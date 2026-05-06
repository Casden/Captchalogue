import { ethers } from "ethers";
import { CONTRACT_ABI } from "../contractAbi";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

export function hasContractAddress() {
  return Boolean(CONTRACT_ADDRESS);
}

export function getReadonlyContract(provider) {
  if (!provider) throw new Error("Provider not available.");
  if (!CONTRACT_ADDRESS) throw new Error("Missing VITE_CONTRACT_ADDRESS.");
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function getWritableContract(getSigner) {
  if (!CONTRACT_ADDRESS) throw new Error("Missing VITE_CONTRACT_ADDRESS.");
  const signer = await getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export function explorerTxUrl(hash) {
  return `https://sepolia.etherscan.io/tx/${hash}`;
}

export function explorerAddressUrl(address) {
  return `https://sepolia.etherscan.io/address/${address}`;
}

export function explorerTokenUrl(tokenId) {
  return `https://sepolia.etherscan.io/token/${CONTRACT_ADDRESS}?a=${tokenId}`;
}
