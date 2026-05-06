const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || "";

export async function uploadFile(file) {
  if (!file) throw new Error("No file selected.");
  if (!UPLOAD_API_URL) {
    throw new Error("Missing VITE_UPLOAD_API_URL. Configure your Cloudflare upload endpoint.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(UPLOAD_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const message = await response.text();
    const hint =
      response.status === 405 && /<\s*html/i.test(message)
        ? " This often means VITE_UPLOAD_API_URL points at a static site (e.g. GitHub Pages) instead of your Cloudflare Worker URL ending with /upload."
        : "";
    throw new Error(`Upload failed (${response.status}): ${message}${hint}`);
  }

  const json = await response.json();
  const cidString = json.cid || json.IpfsHash;
  if (!cidString) {
    throw new Error("Pinata response missing IpfsHash.");
  }

  return {
    cid: cidString,
    uri: `ipfs://${cidString}`,
    gatewayUrl: `https://ipfs.io/ipfs/${cidString}`,
  };
}

export function ipfsUriToGateway(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice("ipfs://".length).replace(/^\/+/, "");
    return `https://ipfs.io/ipfs/${cid}`;
  }
  return uri;
}
