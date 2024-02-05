import hre from "hardhat";
import { expect } from "chai";
import { encodeAbiParameters, parseAbiParameters, stringToHex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

const POOL_AMOUNT = 500n;

describe("EasyRPGFStrategy", function () {
  async function deployStrategy() {
    const accounts = await hre.viem.getWalletClients();

    const allo = await hre.viem.deployContract("LocalAllo");
    const registry = await hre.viem.deployContract("LocalRegistry");
    const token = await hre.viem.deployContract("LocalToken");

    const deployerAddress = accounts[0].account.address;
    await token.write.mint([deployerAddress, POOL_AMOUNT]);
    await token.write.increaseAllowance([allo.address, POOL_AMOUNT]);

    await allo.write.initialize([
      deployerAddress,
      registry.address,
      deployerAddress,
      0n,
      0n,
    ]);

    const strategy = await hre.viem.deployContract("EasyRPGFStrategy", [
      allo.address,
      "EasyRPGFStrategy",
    ]);

    await allo.write.createPoolWithCustomStrategy([
      encodeAbiParameters(parseAbiParameters("bytes32"), [
        stringToHex("profileId", { size: 32 }),
      ]),
      strategy.address,
      encodeAbiParameters(parseAbiParameters("uint256"), [0n]),
      token.address, // token
      0n, // amount
      { protocol: 1n, pointer: "" }, // metadata
      [deployerAddress],
    ]);

    const poolId = 1n;

    const publicClient = await hre.viem.getPublicClient();
    return { accounts, allo, strategy, poolId, token, publicClient };
  }

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

    it("pays out the correct amount", async () => {
      const { allo, accounts, token, poolId, strategy } = await loadFixture(
        deployStrategy
      );
      const recipients = accounts.map((a) => a.account.address).slice(0, 2);
      const amounts = encodeAmounts([1n, 2n]);

      await allo.write.fundPool([poolId, POOL_AMOUNT]);
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT);

      await allo.write.distribute([poolId, recipients, amounts]);

      expect(await token.read.balanceOf([recipients[0]])).to.eq(1n);
      expect(await token.read.balanceOf([recipients[1]])).to.eq(2n);
      expect(await strategy.read.getPoolAmount()).to.eq(POOL_AMOUNT - 3n);
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

      await Promise.all(
        recipients.map(async (address) =>
          expect(await token.read.balanceOf([address])).to.eq(1n)
        )
      );
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
  });
});

function encodeAmounts(amounts: bigint[]) {
  return encodeAbiParameters(parseAbiParameters("uint256[]"), [amounts]);
}
