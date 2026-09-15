import { z } from "zod";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, MAX_FILES } from "@/lib/constants";

export const uploadFileSchema = z.object({
  files: z
    .array(z.custom<File>())
    .min(1, "Please select at least one file")
    .max(MAX_FILES, `Maximum ${MAX_FILES} files allowed`)
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      "File size must be less than 10 MB"
    )
    .refine(
      (files) => files.every((file) => ALLOWED_FILE_TYPES.includes(file.type)),
      "Only JPG, PNG, and WEBP files are accepted"
    ),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;

export function validateFile(file: File): string | null {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Invalid file type. Only JPG, PNG, and WEBP are accepted.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large. Maximum size is 10 MB.";
  }
  return null;
}

export function validateFiles(files: File[]): { valid: File[]; errors: Array<{ file: string; error: string }> } {
  const valid: File[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    const error = validateFile(file);
    if (error) {
      errors.push({ file: file.name, error });
    } else {
      valid.push(file);
    }
  }

  return { valid, errors };
}
