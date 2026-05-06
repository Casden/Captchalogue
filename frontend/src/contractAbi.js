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
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "evidenceHash", "type": "string" },
      { "internalType": "uint8", "name": "claimedScore", "type": "uint8" }
    ],
    "name": "submitExistenceAttestation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "evidenceHash", "type": "string" },
      { "internalType": "uint8", "name": "claimedScore", "type": "uint8" }
    ],
    "name": "submitPossessionAttestation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bool", "name": "isPrivate", "type": "bool" }
    ],
    "name": "togglePrivacy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "ownerOf",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
];
