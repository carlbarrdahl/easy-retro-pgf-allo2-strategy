import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-foundry";
import "@nomicfoundation/hardhat-toolbox-viem";

const NETWORK = vars.get("NETWORK");
const NETWORK_URL = vars.get("NETWORK_URL");
const PRIVATE_KEY = vars.get("PRIVATE_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    [NETWORK]: {
      url: `${NETWORK_URL}`,
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
