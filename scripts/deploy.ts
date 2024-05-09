import hre from "hardhat";

async function main() {
  const alloAddress = "0x1133eA7Af70876e64665ecD07C0A0476d09465a1";
  console.log(`Deploying contract to ${hre.network.name}...`);
  const strategy = await hre.viem.deployContract("EasyRPGFStrategy", [
    alloAddress,
    "EasyRPGFStrategy",
  ]);

  const hedgeyStrategy = await hre.viem.deployContract(
    "EasyRPGFStrategyHedgey",
    [alloAddress, "EasyRPGFStrategyHedgey"]
  );

  console.log(`EasyRPGFStrategy deployed to ${strategy.address}`);
  console.log(`EasyRPGFStrategyHedgey deployed to ${hedgeyStrategy.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
