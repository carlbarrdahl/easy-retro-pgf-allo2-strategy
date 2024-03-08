import hre from "hardhat";

async function main() {
  console.log("Deploying token...");

  const token = await hre.viem.deployContract("LocalToken");

  console.log(`Token deployed to ${token.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
