export async function readBoundedBody(request: Request, maxBytes: number) {
  if (!request.body || Number(request.headers.get("content-length")) > maxBytes) throw new Error("Request body too large or missing.");
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new Error("Request body too large."); }
    chunks.push(part.value);
  }
  return Buffer.concat(chunks);
}
