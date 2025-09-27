export interface GenerateImageArgs {
  prompt: string;
}

export interface EditImageRegionArgs {
  croppedBase64Image: string;
  mimeType: string;
  prompt: string;
}