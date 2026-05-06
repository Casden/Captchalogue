const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CaptchalogueArtifact", function () {
  async function deploy() {
    const C = await ethers.getContractFactory("CaptchalogueArtifact");
    const c = await C.deploy();
    await c.waitForDeployment();
    return c;
  }

  it("mints artifact and assigns owner tokenId 1", async function () {
    const [, owner] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("TestItem", "ipfs://QmTest", false);
    expect(await c.ownerOf(1)).to.equal(owner.address);
    expect(await c.balanceOf(owner.address)).to.equal(1n);
    expect(await c.tokenURI(1)).to.equal("ipfs://QmTest");
  });

  it("allows owner-only attestations within score bounds", async function () {
    const [, owner, other] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("X", "", false);

    await expect(
      c.connect(other).submitExistenceAttestation(1, "0xexist", 30)
    ).to.be.revertedWith("Not token owner");

    await c.connect(owner).submitExistenceAttestation(1, "0xexist", 30);
    await c.connect(owner).submitPossessionAttestation(1, "0xposs", 20);

    const [e, p, t] = await c.getScores(1);
    expect(e).to.equal(30);
    expect(p).to.equal(20);
    expect(t).to.equal(50);

    await expect(
      c.connect(owner).submitExistenceAttestation(1, "h", 51)
    ).to.be.revertedWith("Existence score max 50");
  });

  it("public view redacts when private", async function () {
    const [, owner] = await ethers.getSigners();
    const c = await deploy();
    await c.connect(owner).createArtifact("Secret", "ipfs://secret", true);

    const pub = await c.getPublicArtifact(1);
    expect(pub.artifactName).to.equal("PRIVATE");
    expect(pub.metadataURI).to.equal("");
  });
});
