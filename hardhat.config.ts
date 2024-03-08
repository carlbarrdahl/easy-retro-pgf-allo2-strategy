import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-foundry";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

const NETWORK = vars.get("NETWORK");
const NETWORK_URL = vars.get("NETWORK_URL");
const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ETHERSCAN_KEY = vars.get("ETHERSCAN_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    [NETWORK]: {
      url: `${NETWORK_URL}`,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      optimismSepolia: ETHERSCAN_KEY,
    },
    customChains: [
      {
        network: "optimismSepolia",
        chainId: 11155420,
        urls: {
          apiURL: "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL: "https://sepolia-optimism.etherscan.io",
        },
      },
    ],
  },
  sourcify: { enabled: true },
};

export default config;
