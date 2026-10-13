declare namespace Express {
  export interface Request {
    id_client: string;
    file?: import("../imageUpload").ImageUploadFile;
    user?: { id: string };
  }
}
