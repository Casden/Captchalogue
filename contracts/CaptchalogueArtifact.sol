// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {IERC4906} from "@openzeppelin/contracts/interfaces/IERC4906.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title CaptchalogueArtifact
 * @notice Hybrid model: the chain anchors metadata + evidence commitments.
 *         Verification scoring lives off-chain; the contract only records
 *         that an owner committed to a specific piece of evidence at a time.
 *
 *         Privacy here is a UI-level redaction (toggleable). Storage, calldata,
 *         and `tokenURI` remain readable on-chain by anyone willing to look.
 */
contract CaptchalogueArtifact is ERC721, ERC721Enumerable, IERC4906 {
    uint256 private constant MAX_NAME_BYTES = 120;

    struct Artifact {
        string artifactName;
        string metadataURI;
        bool isPrivate;
        uint64 createdAt;
        bytes32 existenceCommitment;
        uint64 existenceAttestedAt;
        bytes32 possessionCommitment;
        uint64 possessionAttestedAt;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => Artifact) private _artifacts;

    event ArtifactCreated(uint256 indexed tokenId, address indexed owner, string artifactName, bool isPrivate);
    event ArtifactMetadataUpdated(uint256 indexed tokenId, string artifactName, string metadataURI);
    event PrivacyUpdated(uint256 indexed tokenId, bool isPrivate);
    event ExistenceEvidenceSubmitted(
        uint256 indexed tokenId,
        address indexed by,
        bytes32 commitment,
        string evidenceUri,
        uint64 timestamp
    );
    event PossessionEvidenceSubmitted(
        uint256 indexed tokenId,
        address indexed by,
        bytes32 commitment,
        string evidenceUri,
        uint64 timestamp
    );
    event EvidenceClearedOnTransfer(uint256 indexed tokenId, address indexed from, address indexed to);

    modifier onlyTokenOwner(uint256 tokenId) {
        require(_ownerOfRequired(tokenId) == msg.sender, "Not token owner");
        _;
    }

    constructor() ERC721("Captchalogue Artifact", "CAPA") {}

    function createArtifact(
        string calldata artifactName,
        string calldata metadataURI,
        bool isPrivate
    ) external returns (uint256 tokenId) {
        require(bytes(artifactName).length <= MAX_NAME_BYTES, "Name too long");

        tokenId = _nextTokenId;
        _nextTokenId += 1;

        Artifact storage a = _artifacts[tokenId];
        a.artifactName = artifactName;
        a.metadataURI = metadataURI;
        a.isPrivate = isPrivate;
        a.createdAt = uint64(block.timestamp);

        _safeMint(msg.sender, tokenId);
        emit ArtifactCreated(tokenId, msg.sender, artifactName, isPrivate);
    }

    function updateArtifactMetadata(
        uint256 tokenId,
        string calldata artifactName,
        string calldata metadataURI
    ) external onlyTokenOwner(tokenId) {
        require(bytes(artifactName).length <= MAX_NAME_BYTES, "Name too long");
        Artifact storage a = _artifacts[tokenId];
        a.artifactName = artifactName;
        a.metadataURI = metadataURI;
        emit ArtifactMetadataUpdated(tokenId, artifactName, metadataURI);
        emit MetadataUpdate(tokenId);
    }

    function togglePrivacy(uint256 tokenId, bool isPrivate) external onlyTokenOwner(tokenId) {
        _artifacts[tokenId].isPrivate = isPrivate;
        emit PrivacyUpdated(tokenId, isPrivate);
    }

    function submitExistenceEvidence(
        uint256 tokenId,
        bytes32 commitment,
        string calldata evidenceUri
    ) external onlyTokenOwner(tokenId) {
        Artifact storage a = _artifacts[tokenId];
        a.existenceCommitment = commitment;
        a.existenceAttestedAt = uint64(block.timestamp);
        emit ExistenceEvidenceSubmitted(tokenId, msg.sender, commitment, evidenceUri, uint64(block.timestamp));
    }

    function submitPossessionEvidence(
        uint256 tokenId,
        bytes32 commitment,
        string calldata evidenceUri
    ) external onlyTokenOwner(tokenId) {
        Artifact storage a = _artifacts[tokenId];
        a.possessionCommitment = commitment;
        a.possessionAttestedAt = uint64(block.timestamp);
        emit PossessionEvidenceSubmitted(tokenId, msg.sender, commitment, evidenceUri, uint64(block.timestamp));
    }

    /// @notice Total minted token count. Token IDs are 1..totalMinted (gaps possible after burns, none today).
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @notice Enumerate tokens owned by `owner` using ERC721Enumerable's index.
    function tokensOfOwner(address owner) external view returns (uint256[] memory tokenIds) {
        uint256 count = balanceOf(owner);
        tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
    }

    /// @notice Public view. When `isPrivate` is true, name and metadataURI are redacted.
    ///         Commitments + timestamps stay visible (they are pure hashes / numbers).
    function getPublicArtifact(uint256 tokenId)
        external
        view
        returns (
            address owner,
            string memory artifactName,
            string memory metadataURI,
            bool isPrivate,
            uint64 createdAt,
            bytes32 existenceCommitment,
            uint64 existenceAttestedAt,
            bytes32 possessionCommitment,
            uint64 possessionAttestedAt
        )
    {
        owner = _ownerOfRequired(tokenId);
        Artifact storage a = _artifacts[tokenId];
        isPrivate = a.isPrivate;
        createdAt = a.createdAt;
        existenceCommitment = a.existenceCommitment;
        existenceAttestedAt = a.existenceAttestedAt;
        possessionCommitment = a.possessionCommitment;
        possessionAttestedAt = a.possessionAttestedAt;

        if (a.isPrivate) {
            artifactName = "HIDDEN";
            metadataURI = "";
        } else {
            artifactName = a.artifactName;
            metadataURI = a.metadataURI;
        }
    }

    /// @notice Owner-only view that returns full data without redaction.
    function getPrivateArtifact(uint256 tokenId)
        external
        view
        onlyTokenOwner(tokenId)
        returns (
            string memory artifactName,
            string memory metadataURI,
            bool isPrivate,
            uint64 createdAt,
            bytes32 existenceCommitment,
            uint64 existenceAttestedAt,
            bytes32 possessionCommitment,
            uint64 possessionAttestedAt
        )
    {
        Artifact storage a = _artifacts[tokenId];
        artifactName = a.artifactName;
        metadataURI = a.metadataURI;
        isPrivate = a.isPrivate;
        createdAt = a.createdAt;
        existenceCommitment = a.existenceCommitment;
        existenceAttestedAt = a.existenceAttestedAt;
        possessionCommitment = a.possessionCommitment;
        possessionAttestedAt = a.possessionAttestedAt;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _artifacts[tokenId].metadataURI;
    }

    /// @dev EIP-4906 specifies the literal interface id 0x49064906 because the interface only
    ///      declares events (no functions), so `type(IERC4906).interfaceId` would compute to 0x0.
    bytes4 private constant _INTERFACE_ID_ERC4906 = 0x49064906;

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, IERC165)
        returns (bool)
    {
        return interfaceId == _INTERFACE_ID_ERC4906 || super.supportsInterface(interfaceId);
    }

    /// @dev Reset evidence commitments on real transfers (not on mint or burn-mint sequences).
    ///      OZ v5 funnels mint/transfer/burn through `_update`; `from` is non-zero only on transfer/burn.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        address result = super._update(to, tokenId, auth);
        if (from != address(0) && to != address(0) && from != to) {
            Artifact storage a = _artifacts[tokenId];
            a.existenceCommitment = bytes32(0);
            a.existenceAttestedAt = 0;
            a.possessionCommitment = bytes32(0);
            a.possessionAttestedAt = 0;
            emit EvidenceClearedOnTransfer(tokenId, from, to);
        }
        return result;
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function _ownerOfRequired(uint256 tokenId) private view returns (address) {
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "Token does not exist");
        return owner;
    }
}
