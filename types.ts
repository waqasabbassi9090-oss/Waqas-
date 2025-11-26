export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export interface GenerationResult {
  imageUrl: string | null;
  text: string | null;
}

export enum AppStatus {
  IDLE = 'IDLE',
  ENHANCING = 'ENHANCING',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}