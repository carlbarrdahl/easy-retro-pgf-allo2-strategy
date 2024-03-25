import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-foundry";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

const PRIVATE_KEY = vars.get("PRIVATE_KEY");
const ETHERSCAN_KEY = vars.get("ETHERSCAN_KEY");
const CELO_ETHERSCAN_KEY = vars.get("CELO_ETHERSCAN_KEY");
const ALCHEMY_KEY = vars.get("ALCHEMY_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    mainnet: {
      accounts: [PRIVATE_KEY],
      url: `https://mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      chainId: 1,
    },
    optimism: {
      accounts: [PRIVATE_KEY],
      url: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      chainId: 10,
    },
    optimismSepolia: {
      accounts: [PRIVATE_KEY],
      url: `https://opt-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`,
      chainId: 11155420,
    },
    celo: {
      accounts: [PRIVATE_KEY],
      url: "https://forno.celo.org",
      chainId: 42220,
    },
  },
  etherscan: {
    apiKey: {
      optimisticEthereum: ETHERSCAN_KEY,
      optimismSepolia: ETHERSCAN_KEY,
      celo: CELO_ETHERSCAN_KEY,
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
      {
        network: "celo",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api",
          browserURL: "https://celoscan.io/",
        },
      },
    ],
  },
  sourcify: { enabled: true },
};

export default config;
