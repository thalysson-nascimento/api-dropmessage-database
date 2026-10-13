// Internal legacy repository interfaces; no HTTP middleware accepts binary files.
export interface ImageUploadFile { originalname: string; filename: string; mimetype: string; size: number; buffer: Buffer; }
