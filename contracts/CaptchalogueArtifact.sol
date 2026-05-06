// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract CaptchalogueArtifact {
    string public name = "Captchalogue Artifact";
    string public symbol = "CAPA";

    struct Artifact {
        string artifactName;
        string metadataURI;
        string existenceEvidenceHash;
        string possessionEvidenceHash;
        uint8 existenceScore; // 0..50
        uint8 possessionScore; // 0..50
        bool isPrivate;
        uint64 createdAt;
    }

    uint256 private _nextTokenId = 1;

    mapping(uint256 => Artifact) private _artifacts;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    event ArtifactCreated(uint256 indexed tokenId, address indexed owner, string artifactName, bool isPrivate);
    event ExistenceAttested(uint256 indexed tokenId, uint8 score, string evidenceHash);
    event PossessionAttested(uint256 indexed tokenId, uint8 score, string evidenceHash);
    event PrivacyUpdated(uint256 indexed tokenId, bool isPrivate);

    modifier tokenExists(uint256 tokenId) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        _;
    }

    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "Zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
        return _owners[tokenId];
    }

    function tokenURI(uint256 tokenId) external view tokenExists(tokenId) returns (string memory) {
        return _artifacts[tokenId].metadataURI;
    }

    function approve(address to, uint256 tokenId) external tokenExists(tokenId) {
        address owner = ownerOf(tokenId);
        require(to != owner, "Approval to owner");
        require(msg.sender == owner || isApprovedForAll(owner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external {
        require(operator != msg.sender, "Approve self");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public tokenExists(tokenId) {
        require(to != address(0), "Transfer to zero");
        address owner = ownerOf(tokenId);
        require(owner == from, "From not owner");
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");

        _tokenApprovals[tokenId] = address(0);
        emit Approval(owner, address(0), tokenId);

        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "Unsafe recipient");
    }

    function createArtifact(
        string calldata artifactName,
        string calldata metadataURI,
        bool isPrivate
    ) external returns (uint256 tokenId) {
        tokenId = _nextTokenId;
        _nextTokenId += 1;

        _owners[tokenId] = msg.sender;
        _balances[msg.sender] += 1;

        _artifacts[tokenId] = Artifact({
            artifactName: artifactName,
            metadataURI: metadataURI,
            existenceEvidenceHash: "",
            possessionEvidenceHash: "",
            existenceScore: 0,
            possessionScore: 0,
            isPrivate: isPrivate,
            createdAt: uint64(block.timestamp)
        });

        emit Transfer(address(0), msg.sender, tokenId);
        emit ArtifactCreated(tokenId, msg.sender, artifactName, isPrivate);
    }

    function submitExistenceAttestation(
        uint256 tokenId,
        string calldata evidenceHash,
        uint8 claimedScore
    ) external tokenExists(tokenId) onlyTokenOwner(tokenId) {
        require(claimedScore <= 50, "Existence score max 50");

        Artifact storage artifact = _artifacts[tokenId];
        artifact.existenceEvidenceHash = evidenceHash;
        artifact.existenceScore = claimedScore;

        emit ExistenceAttested(tokenId, claimedScore, evidenceHash);
    }

    function submitPossessionAttestation(
        uint256 tokenId,
        string calldata evidenceHash,
        uint8 claimedScore
    ) external tokenExists(tokenId) onlyTokenOwner(tokenId) {
        require(claimedScore <= 50, "Possession score max 50");

        Artifact storage artifact = _artifacts[tokenId];
        artifact.possessionEvidenceHash = evidenceHash;
        artifact.possessionScore = claimedScore;

        emit PossessionAttested(tokenId, claimedScore, evidenceHash);
    }

    function togglePrivacy(uint256 tokenId, bool isPrivate) external tokenExists(tokenId) onlyTokenOwner(tokenId) {
        _artifacts[tokenId].isPrivate = isPrivate;
        emit PrivacyUpdated(tokenId, isPrivate);
    }

    function getScores(uint256 tokenId) public view tokenExists(tokenId) returns (uint8 existence, uint8 possession, uint8 total) {
        Artifact storage artifact = _artifacts[tokenId];
        existence = artifact.existenceScore;
        possession = artifact.possessionScore;
        total = artifact.existenceScore + artifact.possessionScore;
    }

    function getPublicArtifact(
        uint256 tokenId
    )
        external
        view
        tokenExists(tokenId)
        returns (
            address owner,
            string memory artifactName,
            string memory metadataURI,
            bool isPrivate,
            uint8 existenceScore,
            uint8 possessionScore,
            uint8 totalScore,
            uint64 createdAt
        )
    {
        Artifact storage artifact = _artifacts[tokenId];
        owner = ownerOf(tokenId);
        isPrivate = artifact.isPrivate;
        (existenceScore, possessionScore, totalScore) = getScores(tokenId);
        createdAt = artifact.createdAt;

        // Public readers get summary info only when privacy is enabled.
        if (artifact.isPrivate) {
            artifactName = "PRIVATE";
            metadataURI = "";
        } else {
            artifactName = artifact.artifactName;
            metadataURI = artifact.metadataURI;
        }
    }

    function getPrivateArtifact(
        uint256 tokenId
    )
        external
        view
        tokenExists(tokenId)
        onlyTokenOwner(tokenId)
        returns (
            string memory artifactName,
            string memory metadataURI,
            string memory existenceEvidenceHash,
            string memory possessionEvidenceHash,
            uint8 existenceScore,
            uint8 possessionScore,
            uint8 totalScore,
            bool isPrivate,
            uint64 createdAt
        )
    {
        Artifact storage artifact = _artifacts[tokenId];
        artifactName = artifact.artifactName;
        metadataURI = artifact.metadataURI;
        existenceEvidenceHash = artifact.existenceEvidenceHash;
        possessionEvidenceHash = artifact.possessionEvidenceHash;
        (existenceScore, possessionScore, totalScore) = getScores(tokenId);
        isPrivate = artifact.isPrivate;
        createdAt = artifact.createdAt;
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x80ac58cd || interfaceId == 0x01ffc9a7;
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length == 0) {
            return true;
        }

        try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
            return retval == IERC721Receiver.onERC721Received.selector;
        } catch {
            return false;
        }
    }
}
