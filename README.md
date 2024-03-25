# EasyRetroPGF Allo2 Strategy

Strategy contract that is used for https://github.com/gitcoinco/easy-retro-pgf

### Getting started

Install Forge:

- https://github.com/foundry-rs/foundry

Run the tests

```sh
npm run test
```

## Deployment

Configure environment variables

```sh
# Configure key to a funded wallet deploying the strategy contract
npx hardhat vars set PRIVATE_KEY 0x...

# Alchemy API key
npx hardhat vars set ALCHEMY_KEY

```

```sh
npm run deploy -- --network optimismSepolia # See hardhat config for available networks
```

Deploy token for testing

```sh
npx hardhat --network optimismSepolia run scripts/deploy-token.ts
```

## Verify

Copy the deployed contract address and pase in place of `<STRATEGY_ADDRESS>` below

```sh
npx hardhat verify --network optimismSepolia 0xa20f3a96f771fc8cc3b44e3a4ac8bcf51654ff0f --constructor-args scripts/args.js

```
