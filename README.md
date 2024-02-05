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

# Network name (optimism, optimismGoerli)
npx hardhat vars set NETWORK mainnet

# Network url (Alchemy or Infura for example)
npx hardhat vars set NETWORK_URL https://mainnet.g.alchemy.com/v2/<api-key>
```

```sh
npm run deploy -- --network $(npx hardhat vars get NETWORK)
```
