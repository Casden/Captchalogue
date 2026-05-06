const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CaptchalogueArtifact", function () {
  async function deploy() {
    const C = await ethers.getContractFactory("CaptchalogueArtifact");
    const c = await C.deploy();
    await c.waitForDeployment();
    return c;
  }

  it("mints artifact, assigns owner, and exposes tokenURI", async function () {
    const [, owner] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("TestItem", "ipfs://QmTest", false);
    expect(await c.ownerOf(1)).to.equal(owner.address);
    expect(await c.balanceOf(owner.address)).to.equal(1n);
    expect(await c.tokenURI(1)).to.equal("ipfs://QmTest");
    expect(await c.totalMinted()).to.equal(1n);
  });

  it("rejects names longer than 120 bytes", async function () {
    const [, owner] = await ethers.getSigners();
    const c = await deploy();
    const tooLong = "a".repeat(121);
    await expect(
      c.connect(owner).createArtifact(tooLong, "ipfs://x", false)
    ).to.be.revertedWith("Name too long");
  });

  it("records existence/possession evidence with commitment + timestamp; owner-only", async function () {
    const [, owner, other] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("X", "ipfs://x", false);

    const exCommit = ethers.keccak256(ethers.toUtf8Bytes("ipfs://existence-evidence"));
    const psCommit = ethers.keccak256(ethers.toUtf8Bytes("ipfs://possession-evidence"));

    await expect(
      c.connect(other).submitExistenceEvidence(1, exCommit, "ipfs://existence-evidence")
    ).to.be.revertedWith("Not token owner");

    await expect(c.connect(owner).submitExistenceEvidence(1, exCommit, "ipfs://existence-evidence"))
      .to.emit(c, "ExistenceEvidenceSubmitted");
    await expect(c.connect(owner).submitPossessionEvidence(1, psCommit, "ipfs://possession-evidence"))
      .to.emit(c, "PossessionEvidenceSubmitted");

    const data = await c.connect(owner).getPrivateArtifact(1);
    expect(data.existenceCommitment).to.equal(exCommit);
    expect(data.possessionCommitment).to.equal(psCommit);
    expect(data.existenceAttestedAt).to.be.greaterThan(0n);
    expect(data.possessionAttestedAt).to.be.greaterThan(0n);
  });

  it("public view redacts name/URI when private but still exposes commitments", async function () {
    const [, owner] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("Secret", "ipfs://secret", true);

    const commit = ethers.keccak256(ethers.toUtf8Bytes("ipfs://e"));
    await c.connect(owner).submitExistenceEvidence(1, commit, "ipfs://e");

    const pub = await c.getPublicArtifact(1);
    expect(pub.artifactName).to.equal("HIDDEN");
    expect(pub.metadataURI).to.equal("");
    expect(pub.existenceCommitment).to.equal(commit);
    expect(pub.isPrivate).to.equal(true);
  });

  it("transferFrom resets both evidence commitments and timestamps", async function () {
    const [, owner, recipient] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("X", "ipfs://x", false);

    const exCommit = ethers.keccak256(ethers.toUtf8Bytes("e"));
    const psCommit = ethers.keccak256(ethers.toUtf8Bytes("p"));
    await c.connect(owner).submitExistenceEvidence(1, exCommit, "e");
    await c.connect(owner).submitPossessionEvidence(1, psCommit, "p");

    await expect(c.connect(owner).transferFrom(owner.address, recipient.address, 1))
      .to.emit(c, "EvidenceClearedOnTransfer");

    expect(await c.ownerOf(1)).to.equal(recipient.address);
    const after = await c.connect(recipient).getPrivateArtifact(1);
    expect(after.existenceCommitment).to.equal(ethers.ZeroHash);
    expect(after.possessionCommitment).to.equal(ethers.ZeroHash);
    expect(after.existenceAttestedAt).to.equal(0n);
    expect(after.possessionAttestedAt).to.equal(0n);
  });

  it("updateArtifactMetadata emits MetadataUpdate (EIP-4906)", async function () {
    const [, owner] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("A", "ipfs://a", false);
    await expect(c.connect(owner).updateArtifactMetadata(1, "A2", "ipfs://a2"))
      .to.emit(c, "MetadataUpdate")
      .withArgs(1n);
    expect(await c.tokenURI(1)).to.equal("ipfs://a2");
  });

  it("tokensOfOwner enumerates after multiple mints and a transfer", async function () {
    const [, owner, other] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("A", "ipfs://a", false);
    await c.connect(other).createArtifact("B", "ipfs://b", false);
    await c.connect(owner).createArtifact("C", "ipfs://c", true);

    let owned = await c.tokensOfOwner(owner.address);
    expect(owned.map((x) => Number(x)).sort()).to.deep.equal([1, 3]);

    await c.connect(owner).transferFrom(owner.address, other.address, 3);
    owned = await c.tokensOfOwner(owner.address);
    expect(owned.map((x) => Number(x))).to.deep.equal([1]);
    const otherOwned = await c.tokensOfOwner(other.address);
    expect(otherOwned.map((x) => Number(x)).sort()).to.deep.equal([2, 3]);
  });

  it("supports ERC165, ERC721, and ERC4906 interfaces", async function () {
    const c = await deploy();
    expect(await c.supportsInterface("0x01ffc9a7")).to.equal(true); // ERC165
    expect(await c.supportsInterface("0x80ac58cd")).to.equal(true); // ERC721
    expect(await c.supportsInterface("0x49064906")).to.equal(true); // ERC4906
    expect(await c.supportsInterface("0xffffffff")).to.equal(false);
  });
});
