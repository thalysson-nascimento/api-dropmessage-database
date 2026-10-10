const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true}}).outputText, filename);
};
const express = require("express");
const { upload, validateUploadedImage } = require("../src/lib/multerCloudinary");
const { validateImageUpload } = require("../src/service/imageUploadValidation");
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
async function sendFile(buffer, mime, name = "image.png") {
  const app = express();
  app.post("/upload", upload.single("file"), validateUploadedImage, (req, res) => res.json({size:req.file?.size, content:req.body.content}));
  app.use((err, req, res, next) => res.status(err.statusCode || 400).json({message:err.message}));
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const form = new FormData();
    form.append("content", "hello");
    if (buffer) form.append("file", new Blob([buffer], {type:mime}), name);
    const response = await fetch("http://127.0.0.1:" + server.address().port + "/upload", {method:"POST", body:form});
    return {status:response.status, body:await response.json()};
  } finally { await new Promise(resolve => server.close(resolve)); }
}
test("real PNG and binary mobile uploads are accepted", async () => {
  for (const mime of ["image/png", "application/octet-stream"]) assert.equal((await sendFile(png, mime)).status, 200);
});
test("text renamed as JPEG is rejected before the controller", async () => {
  assert.equal((await sendFile(Buffer.from("<script>danger()</script>"), "image/jpeg", "photo.jpg")).status, 415);
});
test("SVG and executables are rejected", async () => {
  for (const mime of ["image/svg+xml", "application/x-msdownload"]) assert.equal((await sendFile(Buffer.from("bad"), mime)).status, 415);
});
test("oversized uploads are rejected and text-only requests still work", async () => {
  assert.equal((await sendFile(Buffer.alloc(5*1024*1024+1), "image/png")).status, 400);
  assert.deepEqual(await sendFile(null), {status:200, body:{content:"hello"}});
});
test("service validation rejects empty and spoofed image contents", () => {
  assert.throws(() => validateImageUpload({buffer:Buffer.alloc(0), mimetype:"image/png"}), {statusCode:400});
  assert.throws(() => validateImageUpload({buffer:Buffer.from("MZfake executable"), mimetype:"image/png"}), {statusCode:415});
});
