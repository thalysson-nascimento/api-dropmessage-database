import fs from "fs";
import path from "path";

export const sslOptions = {
  key: fs.readFileSync(path.resolve(__dirname, "../certificate/private.key")),
  cert: fs.readFileSync(
    path.resolve(__dirname, "../certificate/certificate.crt")
  ),
};
