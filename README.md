# Chrom-ar Solver example

A JavaScript/TypeScript solver example to participate in Chrom-ar solvers network.

## Installation

```bash
git clone https://github.com/chrom-ar/solver-example
cd solver-example
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env # & Modify

# Modify src/index as needed

# Build the SDK
yarn build

# Run
yarn start
```

## Docs

[Deepwiki generated docs](https://deepwiki.com/chrom-ar/solver-sdk)

### Staking & Rewards

> **_NOTE:_** Pending implementation

### Handling Different Message Types

The SDK supports various message types for different operations. Here's how to handle some common types:

**COMMON messages**
type: The type of message (e.g., "SWAP", "YIELD", "TRANSFER")
protocol: The protocol to use (optional)
protocols: An array of protocols to consider (optional)
deadline: The deadline for the message (optional) [Currently not used]


**YIELD messages**

fromToken: The token to yield
amount: The amount to yield
fromChain: The source chain

**SWAP Messages**

fromToken: The token to swap from
toToken: The token to swap to
amount: The amount to swap
fromChain: The source chain
fromAddress: The source address (optional)

**TRANSFER Messages**

fromToken: The token to transfer
fromChain: The source chain
amount: The amount to transfer
recipientAddress: The destination address

**BRIDGE Messages**

fromToken: The token to bridge
fromChain: The source chain
amount: The amount to bridge
recipientAddress: The destination address
recipientChain: The destination chain

**WITHDRAW Messages**

fromToken: The token to be withdrawn
fromChain: The source chain
fromAddress: The source address
amount: The amount to transfer
protocol: The protocol to use (optional but recommended)
