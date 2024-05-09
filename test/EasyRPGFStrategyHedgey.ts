import hre from "hardhat";
import { expect } from "chai";
import {
  type Address,
  encodeAbiParameters,
  parseAbiParameters,
  stringToHex,
} from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

const POOL_AMOUNT = 500n;
const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

describe("EasyRPGFStrategyHedgey", function () {
  describe("Distribute", () => {
    it("distribute can only be called by round managers", async () => {
      const { allo, accounts, poolId } = await loadFixture(deployStrategy);

      const contract = await hre.viem.getContractAt("LocalAllo", allo.address, {
        walletClient: accounts[1],
      });

      const recipients = [accounts[0].account.address];
      const amounts = encodeAmounts([1n]);
      await expect(
        contract.write.distribute([poolId, recipients, amounts])
      ).to.be.rejectedWith("UNAUTHORIZED()");
    });

    it("recipients must be at least 1", async () => {
      const { allo, poolId } = await loadFixture(deployStrategy);
      const recipients: `0x${string}`[] = [];
      const amounts = encodeAmounts([]);

      await expect(
        allo.write.distribute([poolId, recipients, amounts])
      ).to.be.rejectedWith("INPUT_LENGTH_MISMATCH()");
    });

    it("recipients and amounts must be of equal length", async () => {
      const { allo, accounts, poolId } = await loadFixture(deployStrategy);
      const recipients = [accounts[0].account.address];
      const amounts = encodeAmounts([1n, 2n]);

      await expect(
        allo.write.distribute([poolId, recipients, amounts])
      ).to.be.rejectedWith("INPUT_LENGTH_MISMATCH()");
    });

    it("funds with ETH", async () => {
      const { allo, poolId, strategy } = await loadFixture(deployStrategyETH);
      await allo.write.fundPool([poolId, POOL_AMOUNT], { value: POOL_AMOUNT });
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT);
    });

    it("pays out the correct amount", async () => {
      const { allo, accounts, token, poolId, strategy, hedgey, publicClient } =
        await loadFixture(deployStrategy);
      const recipients = accounts.map((a) => a.account.address).slice(0, 2);
      const amounts = encodeAmounts([100n, 200n]);

      await allo.write.fundPool([poolId, POOL_AMOUNT]);
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT);

      await allo.write.distribute([poolId, recipients, amounts]);
      const logs = await publicClient.getContractEvents({
        abi: hedgey.abi,
        address: hedgey.address,
        eventName: "PlanCreated",
      });
      expect(logs.find((e) => e.eventName === "PlanCreated"));
    });

    it("pays out to 500 recipients", async () => {
      const { allo, accounts, token, poolId, strategy } = await loadFixture(
        deployStrategy
      );

      const recipients = Array(500)
        .fill(0)
        .map(() => privateKeyToAccount(generatePrivateKey()).address);
      const amounts = encodeAmounts(
        Array(500)
          .fill(0)
          .map(() => 1n)
      );

      await allo.write.fundPool([poolId, POOL_AMOUNT]);

      await allo.write.distribute([poolId, recipients, amounts]);

      expect(await strategy.read.getPoolAmount()).to.eq(0n);
    });

    it("reverts if payouts are larger than funded amount", async () => {
      const { allo, accounts, token, poolId, strategy } = await loadFixture(
        deployStrategy
      );
      const recipients = accounts.map((a) => a.account.address).slice(0, 2);
      const amounts = encodeAmounts([100n, 1000n]);

      await allo.write.fundPool([poolId, POOL_AMOUNT]);
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT);

      await expect(allo.write.distribute([poolId, recipients, amounts])).to.be
        .rejected;

      // Still same amount in pool
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT);

      // User has not received anything
      expect(await token.read.balanceOf([recipients[0]])).to.eq(0n);
    });

    it("withdraws pool tokens", async () => {
      const { allo, accounts, token, poolId, strategy } = await loadFixture(
        deployStrategy
      );
      const address = accounts[0].account.address;

      await allo.write.fundPool([poolId, POOL_AMOUNT]);

      // Make sure tokens have been transfered from account to pool
      expect(await token.read.balanceOf([address])).to.eq(0n);
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT);

      await strategy.write.withdraw([token.address, address]);

      // Make sure tokens have been transfered back to account from pool
      // expect(await strategy.read.getPoolAmount()).to.eq(0n);
      expect(await token.read.balanceOf([address])).to.eq(POOL_AMOUNT);
    });
    it("withdraws pool ETH", async () => {
      const { allo, accounts, poolId, strategy } = await loadFixture(
        deployStrategyETH
      );
      const address = accounts[0].account.address;

      await allo.write.fundPool([poolId, POOL_AMOUNT], { value: POOL_AMOUNT });

      // Make sure tokens have been transfered from account to pool
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT);

      await strategy.write.withdraw([ethAddress, address]);

      // Make sure tokens have been transfered back to account from pool
      expect(await strategy.read.getPoolAmount()).to.eq(0n);
    });
  });
});

function encodeAmounts(amounts: bigint[]) {
  return encodeAbiParameters(parseAbiParameters("uint256[]"), [amounts]);
}

async function setup() {
  const accounts = await hre.viem.getWalletClients();
  const allo = await hre.viem.deployContract("LocalAllo");
  const hedgey = await hre.viem.deployContract("LocalHedgey");
  const registry = await hre.viem.deployContract("LocalRegistry");
  const deployerAddress = accounts[0].account.address;
  await allo.write.initialize([
    deployerAddress,
    registry.address,
    deployerAddress,
    0n,
    0n,
  ]);

  const strategy = await hre.viem.deployContract("EasyRPGFStrategyHedgey", [
    allo.address,
    "EasyRPGFStrategyHedgey",
  ]);
  return { accounts, allo, strategy, hedgey };
}
async function deploy(
  token: Address,
  { accounts, allo, strategy, hedgey }: any
) {
  const deployerAddress = accounts[0].account?.address;

  await allo.write.createPoolWithCustomStrategy(
    [
      encodeAbiParameters(parseAbiParameters("bytes32"), [
        stringToHex("profileId", { size: 32 }),
      ]),
      strategy.address,
      encodeAbiParameters(
        parseAbiParameters([
          "HedgeyParams data",
          "struct HedgeyParams { address adminAddress; address contractAddress; uint256 duration; uint256 cliff; uint256 period; bool adminTransferOBO}",
        ]),
        [
          {
            adminAddress: accounts[0].account.address,
            contractAddress: hedgey.address,
            duration: 10n,
            cliff: 0n,
            period: 1n,
            adminTransferOBO: false,
          },
        ]
      ),
      token,
      0n,
      { protocol: 1n, pointer: "" }, // metadata
      [deployerAddress],
    ],
    { value: 0n }
  );

  const poolId = 1n;

  const publicClient = await hre.viem.getPublicClient();
  return { poolId, token, publicClient };
}

async function deployStrategyETH() {
  const alloSetup = await setup();
  const deployment = await deploy(ethAddress, alloSetup);
  return { ...alloSetup, ...deployment };
}

async function deployStrategy() {
  const alloSetup = await setup();
  const token = await hre.viem.deployContract("LocalToken");

  const deployerAddress = alloSetup.accounts[0].account.address;
  await token.write.mint([deployerAddress, POOL_AMOUNT]);
  await token.write.increaseAllowance([alloSetup.allo.address, POOL_AMOUNT]);
  const deployment = await deploy(token.address, alloSetup);
  return { ...alloSetup, ...deployment, token };
}
