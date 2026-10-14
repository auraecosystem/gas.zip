# gas.zip

TypeScript / Viem helpers for the supplied Gas.Zip contract ABI fragments.

## Status and deployment safety

The repository initially contained only this README. This change adds the supplied ABI fragments and a small Viem integration layer. No deployed contract addresses, supported chain IDs, or authoritative contract source were present in the repository. Those details—and the meaning of each uint256 deposit parameter—must be verified before production use.

## Install

Install viem in the consuming TypeScript project:

    npm install viem

## Usage

Import `estimateNativeFees` and `sendDeposits` from `src/gasZip.ts`. Create a Viem public client for the verified chain and a wallet client using your application's established wallet connection. Do not hard-code private keys in source code.

    import { estimateNativeFees, sendDeposits } from './src/gasZip';

    const fees = await estimateNativeFees(publicClient, {
      estimatorAddress, // verified deployed contract address
      dstEids: [/* verified LayerZero endpoint IDs */],
      messages: [/* encoded message bytes */],
      options: [/* encoded LayerZero options */],
    });

    console.log('Estimated native fees (wei):', fees);

    const hash = await sendDeposits(publicClient, walletClient, {
      depositAddress, // verified deployed contract address
      depositParams: [/* verified uint256 deposit parameters */],
      to: recipientAddress,
      value: approvedNativeValueWei, // explicitly determine and confirm this amount
    });

    console.log('Transaction hash:', hash);

## API

- `estimateNativeFees(publicClient, input)` calls the read-only `estimateFees` method and returns a bigint array of native fees in chain base units (wei on EVM chains).
- `sendDeposits(publicClient, walletClient, input)` simulates `sendDeposits` before submitting it and returns a transaction hash. The caller must explicitly supply the payable transaction value.

The helpers check that destination EIDs, messages, and options have matching lengths and that EIDs fit uint32. They do not prove that addresses are deployed on the selected chain or that deposit parameters are semantically valid. Verify the deployed contract source/ABI, network, recipient, and required payable value before submitting funds. The supplied `sendDeposits` ABI has no return value; check the transaction receipt and any documented events to confirm execution.
