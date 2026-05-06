const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || "";



export async function uploadFile(file) {

  if (!file) throw new Error("No file selected.");

  if (!UPLOAD_API_URL) {

    throw new Error("Missing VITE_UPLOAD_API_URL. Configure your Cloudflare upload endpoint.");

  }



  const formData = new FormData();

  formData.append("file", file);



  let response;
  try {
    response = await fetch(UPLOAD_API_URL, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    const raw = err?.message || "Network request failed";
    throw new Error(
      `Upload request could not reach ${UPLOAD_API_URL}. ${raw}. ` +
        "Check that VITE_UPLOAD_API_URL is an https Cloudflare Worker /upload endpoint with CORS enabled for this site."
    );
  }



  if (!response.ok) {

    const message = await response.text();

    throw new Error(
      `Upload failed (${response.status}) at ${UPLOAD_API_URL}: ${message}`
    );

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
  const trimmed = String(uri).trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("ipfs://")) {
    const cid = trimmed.slice("ipfs://".length).replace(/^\/+/, "");
    return `https://ipfs.io/ipfs/${cid}`;
  }

  return trimmed;
}

