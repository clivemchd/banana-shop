export interface GenerateImageArgs {
  prompt: string;
}

export interface GenerateImageUploadUrlArgs {
  fileName: string;
  mimeType: string;
}

export interface CreateTempImageRecordArgs {
  fileName: string;
  mimeType: string;
  gcsFileName: string;
}