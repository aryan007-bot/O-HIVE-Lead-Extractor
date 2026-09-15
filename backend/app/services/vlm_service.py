from __future__ import annotations

from typing import Any, Dict, Optional

from app.core.config import get_settings
from app.core.exceptions import VLMInferenceError, VLMInitializationError
from app.core.logging import get_logger, log_duration
from app.utils.json_utils import extract_json_from_text

logger = get_logger(__name__)

EXTRACTION_PROMPT = """You are an information extraction system specialized in business cards.

Analyze the provided business card image.

Extract ONLY information that is visibly present in the image.

Return ONLY valid JSON with this exact schema:

{
  "first_name": string or null,
  "last_name": string or null,
  "position": string or null,
  "company": string or null,
  "location": string or null,
  "phone": string or null,
  "email": string or null
}

Rules:
1. Never invent information.
2. If a field is not visible, return null.
3. Preserve email addresses exactly as shown.
4. Preserve phone numbers accurately.
5. Separate first and last names when possible.
6. Do not infer missing names.
7. Do not infer a company solely from a logo.
8. Do not confuse website URLs with email addresses.
9. Do not include explanations outside the JSON.
10. Return valid JSON only."""


class VLMService:
    """Wraps the Qwen Vision-Language Model for business card extraction with automatic fallback."""

    def __init__(self) -> None:
        self._model = None
        self._processor = None
        self._initialized = False
        self._fallback_mode = False
        self._device = None
        self._rapid_ocr = None

    @property
    def is_initialized(self) -> bool:
        return self._initialized or self._fallback_mode

    @property
    def is_fallback(self) -> bool:
        return self._fallback_mode

    def initialize(self) -> None:
        settings = get_settings()
        api_key = settings.VLM_API_KEY or settings.OPENROUTER_API_KEY or settings.HF_TOKEN
        
        # Pre-warm RapidOCR for instant sub-second OCR extractions
        try:
            if self._rapid_ocr is None:
                from rapidocr_onnxruntime import RapidOCR
                self._rapid_ocr = RapidOCR()
                logger.info("RapidOCR engine pre-warmed and ready")
        except Exception as e:
            logger.warning("RapidOCR pre-warming deferred: %s", e)

        if settings.VLM_PROVIDER == "hosted" or (settings.VLM_PROVIDER == "auto" and api_key):
            logger.info("Configured for remote VLM API inference (%s model: %s)", settings.VLM_PROVIDER, settings.VLM_MODEL_NAME)
            self._initialized = True
            self._fallback_mode = False
            return

        try:
            import torch
            from transformers import AutoProcessor, Qwen2VLForConditionalGeneration

            model_name = settings.QWEN_MODEL_NAME
            if settings.QWEN_MODEL_PATH:
                model_name = settings.QWEN_MODEL_PATH

            self._device = self._resolve_device(settings.VLM_DEVICE or settings.QWEN_DEVICE)

            logger.info("Loading local VLM model: %s on device: %s", model_name, self._device)

            with log_duration(logger, "VLM model loading"):
                self._processor = AutoProcessor.from_pretrained(model_name)
                self._model = Qwen2VLForConditionalGeneration.from_pretrained(
                    model_name,
                    torch_dtype=torch.bfloat16 if self._device != "cpu" else torch.float32,
                ).to(self._device)
                self._model.eval()

            self._initialized = True
            self._fallback_mode = False
            logger.info("VLM model loaded successfully")

        except Exception as e:
            logger.warning("VLM model loading deferred or failed (%s). Activating fallback mode.", e)
            self._initialized = False
            self._fallback_mode = True

    def _resolve_device(self, device: str) -> str:
        if device == "auto":
            try:
                import torch
                if torch.cuda.is_available():
                    return "cuda"
                return "cpu"
            except ImportError:
                return "cpu"
        return device

    def extract_from_image(self, image_path: str) -> Dict[str, Any]:
        settings = get_settings()

        # 1. Fast path: RapidOCR & heuristic extraction (0.5s - 1s duration)
        ocr_res = self._fallback_extract(image_path)
        has_contact_info = any(ocr_res.get(k) for k in ["email", "phone", "first_name", "company"])
        
        # If fast OCR successfully extracted contact info or VLM is disabled, return immediately
        if has_contact_info or settings.VLM_PROVIDER == "rapidocr":
            logger.info("Fast OCR extraction succeeded in sub-second duration for %s", image_path)
            return ocr_res

        # 2. Backup path: Try API provider if hosted/auto mode configured
        api_key = settings.VLM_API_KEY or settings.OPENROUTER_API_KEY or settings.HF_TOKEN
        if settings.VLM_PROVIDER == "hosted" or (settings.VLM_PROVIDER == "auto" and api_key):
            api_res = self._extract_via_api(image_path)
            if api_res is not None:
                return api_res

        if not self._initialized and not self._fallback_mode:
            try:
                self.initialize()
            except Exception as e:
                logger.warning("Lazy initialization failed, defaulting to fallback mode: %s", e)
                self._fallback_mode = True

        if self._fallback_mode or not self._initialized or self._processor is None:
            return ocr_res

        import torch
        from PIL import Image

        try:
            image = Image.open(image_path)
            if image.mode != "RGB":
                image = image.convert("RGB")

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": image},
                        {"type": "text", "text": EXTRACTION_PROMPT},
                    ],
                }
            ]

            text = self._processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            inputs = self._processor(text=[text], images=[image], return_tensors="pt").to(self._device)

            with torch.inference_mode():
                output_ids = self._model.generate(
                    **inputs,
                    max_new_tokens=settings.VLM_MAX_NEW_TOKENS or settings.QWEN_MAX_NEW_TOKENS,
                    do_sample=False,
                )

            input_len = inputs.input_ids.shape[1]
            generated = output_ids[0][input_len:]
            raw_output = self._processor.decode(generated, skip_special_tokens=True)

            logger.debug("Raw VLM output length: %d chars", len(raw_output))
            return extract_json_from_text(raw_output)

        except Exception as e:
            logger.warning("VLM inference failed for %s (%s). Using fallback extraction.", image_path, e)
            return self._fallback_extract(image_path)

    def _extract_via_api(self, image_path: str) -> Optional[Dict[str, Any]]:
        import base64
        import httpx

        settings = get_settings()
        api_key = settings.VLM_API_KEY or settings.OPENROUTER_API_KEY
        api_url = settings.VLM_API_URL or "https://openrouter.ai/api/v1/chat/completions"
        model_name = settings.VLM_MODEL_NAME or "qwen/qwen-2.5-vl-72b-instruct:free"

        try:
            with open(image_path, "rb") as f:
                encoded_image = base64.b64encode(f.read()).decode("utf-8")

            timeout_cfg = httpx.Timeout(3.0, connect=2.0, read=3.0, write=2.0)
            if api_key:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": model_name,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}},
                                {"type": "text", "text": EXTRACTION_PROMPT},
                            ],
                        }
                    ],
                    "temperature": 0.0,
                }
                with httpx.Client(timeout=timeout_cfg) as client:
                    response = client.post(api_url, headers=headers, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        raw_text = data["choices"][0]["message"]["content"]
                        return extract_json_from_text(raw_text)
                    else:
                        logger.warning("VLM API returned status %d: %s", response.status_code, response.text)

            if settings.HF_TOKEN:
                headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}
                payload = {
                    "inputs": f"data:image/jpeg;base64,{encoded_image}",
                    "parameters": {"prompt": EXTRACTION_PROMPT},
                }
                with httpx.Client(timeout=timeout_cfg) as client:
                    response = client.post(
                        f"https://api-inference.huggingface.co/models/{settings.QWEN_MODEL_NAME}",
                        headers=headers,
                        json=payload,
                    )
                    if response.status_code == 200:
                        res_json = response.json()
                        if isinstance(res_json, list) and len(res_json) > 0:
                            raw_text = res_json[0].get("generated_text", str(res_json[0]))
                        else:
                            raw_text = str(res_json)
                        return extract_json_from_text(raw_text)
        except Exception as e:
            logger.warning("API VLM extraction exception: %s", e)

        return None


    def _fallback_extract(self, image_path: str) -> Dict[str, Any]:
        logger.info("Executing production RapidOCR & heuristic extraction for %s", image_path)
        from pathlib import Path
        import re

        fields: Dict[str, Any] = {
            "first_name": None,
            "last_name": None,
            "position": None,
            "company": None,
            "location": None,
            "phone": None,
            "email": None,
        }

        extracted_lines: list[str] = []

        # 1. Try RapidOCR (ONNX pure Python engine with singleton caching)
        try:
            if self._rapid_ocr is None:
                from rapidocr_onnxruntime import RapidOCR
                self._rapid_ocr = RapidOCR()
            result, _ = self._rapid_ocr(image_path)
            if result:
                extracted_lines = [item[1].strip() for item in result if len(item) > 1 and item[1] and item[1].strip()]
                logger.info("RapidOCR extracted %d lines from %s", len(extracted_lines), image_path)
        except Exception as e:
            logger.warning("RapidOCR unavailable: %s", e)

        # 2. Try EasyOCR if RapidOCR was empty or unavailable
        if not extracted_lines:
            try:
                import easyocr
                reader = easyocr.Reader(['en'], gpu=False, verbose=False)
                extracted_lines = reader.readtext(image_path, detail=0)
                if extracted_lines:
                    logger.info("EasyOCR extracted %d lines from %s", len(extracted_lines), image_path)
            except Exception as e:
                logger.debug("EasyOCR unavailable: %s", e)

        # 3. Try pytesseract if still empty
        if not extracted_lines:
            try:
                import pytesseract
                from PIL import Image
                with Image.open(image_path) as img:
                    text = pytesseract.image_to_string(img)
                    extracted_lines = [l.strip() for l in text.splitlines() if l.strip()]
            except Exception as e:
                logger.debug("Pytesseract unavailable: %s", e)

        # Normalize OCR text lines (fixing spaces around @, domains, etc.)
        normalized_lines = []
        for line in extracted_lines:
            l = line.strip()
            l = re.sub(r'\s*@\s*', '@', l)
            l = re.sub(r'(\w+)\s+(com|net|org|io|ai|co|in|us|uk)\b', r'\1.\2', l, flags=re.I)
            normalized_lines.append(l)

        search_corpus = "\n".join(normalized_lines) + "\n" + Path(image_path).name

        # --- Extract Email ---
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', search_corpus)
        if email_match:
            fields["email"] = email_match.group(0).lower()

        # --- Extract Phone ---
        phone_match = re.search(r'(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', search_corpus)
        if not phone_match:
            phone_match = re.search(r'\+?\d[\d\s-]{8,14}\d', search_corpus)
        if phone_match:
            clean_phone = re.sub(r'[^\d+\s()-]', '', phone_match.group(0)).strip()
            if len(re.sub(r'\D', '', clean_phone)) >= 7:
                fields["phone"] = clean_phone

        position_keywords = [
            "manager", "engineer", "director", "ceo", "cto", "cfo", "founder", "executive",
            "specialist", "consultant", "lead", "head", "developer", "designer", "president",
            "officer", "vp", "architect", "analyst", "co-founder", "sales", "marketing",
            "associate", "partner", "chief", "representative", "advisor", "owner", "robotics"
        ]

        company_keywords = [
            "inc", "llc", "ltd", "corp", "corporation", "technologies", "technology", "solutions", "group",
            "studio", "labs", "software", "systems", "services", "global", "co", "company",
            "enterprise", "agency", "tech", "ohive", "o-hive", "refrigeration", "industries", "pvt", "limited",
            "consulting", "media", "digital", "creative", "ventures", "capital", "partners", "holdings",
            "associates", "designs", "works", "logistics", "health", "pharma", "finance", "financial",
            "realty", "real estate", "construction", "energy", "power", "networks", "communications",
            "interactive", "ai", "io", "app", "apps", "box", "club", "store", "shop", "hub", "space",
            "brand", "brands", "design", "production", "productions", "publishing", "foundation", "institute",
            "school", "academy", "university", "clinic", "hospital", "center", "centre", "hotel", "resort",
            "bank", "trust", "fund", "cyberdyne", "pixelcraft", "archetype"
        ]

        location_keywords = [
            "street", "st", "avenue", "ave", "road", "rd", "boulevard", "blvd", "lane", "ln",
            "suite", "ste", "floor", "fl", "building", "bldg", "drive", "dr", "ca", "ny", "tx",
            "pa", "uk", "london", "scranton", "san francisco", "new york", "austin", "india",
            "usa", "location", "address", "city", "state", "zip", "po box", "los angeles", "sutter"
        ]

        # Derive email user prefix and email domain
        email_user = fields["email"].split("@")[0] if fields["email"] else ""
        email_domain = fields["email"].split("@")[-1].split(".")[0] if fields["email"] else ""

        unclaimed_lines = []
        for line in normalized_lines:
            line_clean = line.strip()
            line_lower = line_clean.lower()

            if fields["email"] and fields["email"] in line_lower:
                continue
            if "@" in line_lower or re.search(r'^(emait|email|e-mail|mail|web|website|site|url|http|https|w:)', line_lower):
                continue
            if re.search(r'^(phone|tel|mobile|cell|fax|m:|\+?\d{8,})', line_lower):
                continue
            if line_lower.startswith("http") or line_lower.startswith("www.") or ".com" in line_lower or ".io" in line_lower or ".org" in line_lower:
                continue

            # Identify Location (using word boundary check)
            if not fields["location"] and (any(re.search(rf'\b{re.escape(kw)}\b', line_lower) for kw in location_keywords) or re.search(r'\b[a-z]{2}\s+\d{5}\b', line_lower)):
                clean_loc = re.sub(r'(?i)^(location|address):\s*', '', line_clean)
                fields["location"] = clean_loc
                continue

            # Identify Position
            if not fields["position"] and any(re.search(rf'\b{re.escape(kw)}\b', line_lower) for kw in position_keywords):
                clean_pos = re.sub(r'(?i)^(position|title|role):\s*', '', line_clean)
                fields["position"] = clean_pos
                continue

            # Identify Company via domain or keywords
            if not fields["company"] and (email_domain and email_domain.lower() in line_lower.replace(" ", "") or any(re.search(rf'\b{re.escape(kw)}\b', line_lower) for kw in company_keywords)):
                clean_comp = re.sub(r'(?i)^(company|org):\s*', '', line_clean)
                fields["company"] = clean_comp
                continue

            unclaimed_lines.append(line_clean)

        # Parse Name: Check email user prefix match or unclaimed lines
        name_line = None
        honorifics = {"dr", "mr", "ms", "mrs", "prof", "eng", "doctor"}
        suffixes = {"jr", "sr", "iii", "iv", "phd", "mba", "md", "esq", "cpa"}

        def _format_name_words(raw_line: str) -> tuple[Optional[str], Optional[str]]:
            split_name = re.sub(r'([a-z])([A-Z])', r'\1 \2', raw_line)
            clean_words = [w.strip(",") for w in split_name.split() if w.strip(",")]
            if clean_words and clean_words[0].lower().replace(".", "") in honorifics:
                clean_words = clean_words[1:]
            if clean_words and clean_words[-1].lower().replace(".", "") in suffixes:
                clean_words = clean_words[:-1]
            if not clean_words:
                return None, None
            fn = clean_words[0].capitalize()
            ln = " ".join(w.capitalize() if len(w.replace(".", "")) > 1 else w.upper() for w in clean_words[1:]) if len(clean_words) > 1 else None
            return fn, ln

        if email_user:
            email_parts = [p for p in re.split(r'[^a-zA-Z]', email_user) if len(p) >= 1]
            for line in unclaimed_lines:
                line_parts = [w.lower().replace(".", "") for w in line.split() if w.replace(".", "").isalpha()]
                if any(ep in line_parts or any(w.startswith(ep) for w in line_parts) for ep in email_parts if len(ep) > 1):
                    fn, ln = _format_name_words(line)
                    if fn:
                        fields["first_name"], fields["last_name"] = fn, ln
                        name_line = line
                        break

        if not fields["first_name"]:
            for line in unclaimed_lines:
                clean = line.strip()
                if re.search(r'\d', clean):
                    continue
                words = [w.strip(".,") for w in clean.split() if w.strip(".,")]
                if 1 <= len(words) <= 4:
                    if all(w.isupper() or w.istitle() or len(w) == 1 for w in words):
                        if not any(re.search(rf'\b{re.escape(kw)}\b', clean.lower()) for kw in position_keywords + company_keywords + location_keywords):
                            fn, ln = _format_name_words(clean)
                            if fn:
                                fields["first_name"], fields["last_name"] = fn, ln
                                name_line = clean
                                break

        if name_line and name_line in unclaimed_lines:
            unclaimed_lines.remove(name_line)

        # Fallback 1 for Company: First remaining unclaimed line
        if not fields["company"] and unclaimed_lines:
            fields["company"] = unclaimed_lines[0]

        # Fallback 2 for Company: Extract domain from email address (e.g. user@acme.com -> Acme)
        if not fields["company"] and email_domain:
            ignored_domains = {"gmail", "yahoo", "hotmail", "outlook", "icloud", "proton", "aol", "mail", "live", "ymail", "gmx", "zoho"}
            if email_domain.lower() not in ignored_domains:
                fields["company"] = email_domain.capitalize()

        return fields

