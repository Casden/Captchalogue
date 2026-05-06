/**
 * Deploy CaptchalogueArtifact to Sepolia (or any configured network).
 * Usage: npm run deploy:sepolia
 *
 * Prerequisites: SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY in .env (see .env.example).
 */
const hre = require("hardhat");

async function main() {
  const sepUrl = process.env.SEPOLIA_RPC_URL;
  const sepKey = process.env.SEPOLIA_PRIVATE_KEY;
  if (hre.network.name === "sepolia") {
    if (!sepUrl || sepUrl.trim() === "") {
      throw new Error("Missing SEPOLIA_RPC_URL in .env");
    }
    if (!sepKey || sepKey.trim() === "") {
      throw new Error("Missing SEPOLIA_PRIVATE_KEY in .env");
    }
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("CaptchalogueArtifact");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CaptchalogueArtifact deployed to:", address);
  console.log("Save this address for your frontend and submission.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
