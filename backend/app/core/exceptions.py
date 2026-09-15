from __future__ import annotations


class AppError(Exception):
    """Base application error."""

    def __init__(self, code: str = "APP_ERROR", message: str = "An unexpected error occurred"):
        self.code = code
        self.message = message
        super().__init__(self.message)


class InvalidImageError(AppError):
    def __init__(self, message: str = "The uploaded file is not a valid image."):
        super().__init__(code="INVALID_IMAGE", message=message)


class FileTooLargeError(AppError):
    def __init__(self, message: str = "The uploaded file exceeds the maximum allowed size."):
        super().__init__(code="FILE_TOO_LARGE", message=message)


class UnsupportedFileTypeError(AppError):
    def __init__(self, message: str = "The uploaded file type is not supported."):
        super().__init__(code="UNSUPPORTED_FILE_TYPE", message=message)


class VLMInitializationError(AppError):
    def __init__(self, message: str = "Failed to initialize the Vision-Language Model."):
        super().__init__(code="VLM_INIT_ERROR", message=message)


class VLMInferenceError(AppError):
    def __init__(self, message: str = "VLM inference failed."):
        super().__init__(code="VLM_INFERENCE_ERROR", message=message)


class JSONParsingError(AppError):
    def __init__(self, message: str = "Failed to parse the model output as JSON."):
        super().__init__(code="JSON_PARSING_ERROR", message=message)


class ValidationError(AppError):
    def __init__(self, message: str = "The extracted data failed validation."):
        super().__init__(code="VALIDATION_ERROR", message=message)


class ExportError(AppError):
    def __init__(self, message: str = "Failed to generate the export file."):
        super().__init__(code="EXPORT_ERROR", message=message)


class TooManyFilesError(AppError):
    def __init__(self, message: str = "Too many files uploaded."):
        super().__init__(code="TOO_MANY_FILES", message=message)
