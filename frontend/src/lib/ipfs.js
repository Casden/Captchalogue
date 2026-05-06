import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";

let heliaPromise = null;
let fsPromise = null;

async function getHelia() {
  if (!heliaPromise) {
    heliaPromise = createHelia();
  }
  return heliaPromise;
}

async function getFs() {
  if (!fsPromise) {
    fsPromise = (async () => {
      const helia = await getHelia();
      return unixfs(helia);
    })();
  }
  return fsPromise;
}

export async function uploadFile(file) {
  if (!file) throw new Error("No file selected.");
  const fs = await getFs();
  const buffer = new Uint8Array(await file.arrayBuffer());
  const cid = await fs.addBytes(buffer);
  const cidString = cid.toString();
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
