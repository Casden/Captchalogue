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
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "string", "name": "artifactName", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" }
    ],
    "name": "updateArtifactMetadata",
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
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bytes32", "name": "commitment", "type": "bytes32" },
      { "internalType": "string", "name": "evidenceUri", "type": "string" }
    ],
    "name": "submitExistenceEvidence",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
      { "internalType": "bytes32", "name": "commitment", "type": "bytes32" },
      { "internalType": "string", "name": "evidenceUri", "type": "string" }
    ],
    "name": "submitPossessionEvidence",
    "outputs": [],
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
      { "internalType": "uint64", "name": "createdAt", "type": "uint64" },
      { "internalType": "bytes32", "name": "existenceCommitment", "type": "bytes32" },
      { "internalType": "uint64", "name": "existenceAttestedAt", "type": "uint64" },
      { "internalType": "bytes32", "name": "possessionCommitment", "type": "bytes32" },
      { "internalType": "uint64", "name": "possessionAttestedAt", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "getPrivateArtifact",
    "outputs": [
      { "internalType": "string", "name": "artifactName", "type": "string" },
      { "internalType": "string", "name": "metadataURI", "type": "string" },
      { "internalType": "bool", "name": "isPrivate", "type": "bool" },
      { "internalType": "uint64", "name": "createdAt", "type": "uint64" },
      { "internalType": "bytes32", "name": "existenceCommitment", "type": "bytes32" },
      { "internalType": "uint64", "name": "existenceAttestedAt", "type": "uint64" },
      { "internalType": "bytes32", "name": "possessionCommitment", "type": "bytes32" },
      { "internalType": "uint64", "name": "possessionAttestedAt", "type": "uint64" }
    ],
    "stateMutability": "view",
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
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalMinted",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "tokensOfOwner",
    "outputs": [{ "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "from", "type": "address" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
    ],
    "name": "safeTransferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
