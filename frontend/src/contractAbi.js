export const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "artifactName", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" },
      { "internalType": "bool", "name": "isPrivate", "type": "bool" }
    ],
    "name": "createArtifact",
    "outputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getPublicArtifact",
    "outputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "string", "name": "artifactName", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" },
      { "internalType": "bool", "name": "isPrivate", "type": "bool" },
      { "internalType": "uint8", "name": "existenceScore", "type": "uint8" },
      { "internalType": "uint8", "name": "possessionScore", "type": "uint8" },
      { "internalType": "uint8", "name": "totalScore", "type": "uint8" },
      { "internalType": "uint64", "name": "createdAt", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
