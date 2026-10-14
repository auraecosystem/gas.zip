import type { Address, Hex, PublicClient, WalletClient } from 'viem';
import { estimateFeesAbi, lzDepositAbi } from './abi';

export type EstimateFeesInput = {
  /** Deployed contract exposing estimateFees on the selected chain. */
  estimatorAddress: Address;
  dstEids: readonly number[];
  messages: readonly Hex[];
  options: readonly Hex[];
};

export type SendDepositsInput = {
  /** Deployed contract exposing sendDeposits on the connected chain. */
  depositAddress: Address;
  depositParams: readonly bigint[];
  to: Address;
  /** Native currency attached to the payable call, in wei. Caller must determine this. */
  value: bigint;
};

/** Reads native fees for LayerZero destination/message/options arrays; sends no transaction. */
export async function estimateNativeFees(
  publicClient: PublicClient,
  input: EstimateFeesInput,
): Promise<readonly bigint[]> {
  const { dstEids, messages, options, estimatorAddress } = input;
  if (dstEids.length !== messages.length || dstEids.length !== options.length) {
    throw new Error('dstEids, messages, and options must have the same length.');
  }
  if (dstEids.some((eid) => !Number.isInteger(eid) || eid < 0 || eid > 0xffff_ffff)) {
    throw new Error('Every destination EID must be an unsigned 32-bit integer.');
  }

  return publicClient.readContract({
    address: estimatorAddress,
    abi: estimateFeesAbi,
    functionName: 'estimateFees',
    args: [[...dstEids], [...messages], [...options]],
  });
}

/** Simulates then submits sendDeposits. `value` is explicit and is not inferred from fee estimates. */
export async function sendDeposits(
  publicClient: PublicClient,
  walletClient: WalletClient,
  input: SendDepositsInput,
) {
  if (input.value < 0n) throw new Error('Transaction value cannot be negative.');
  const account = walletClient.account;
  if (!account) throw new Error('WalletClient must have an account configured.');

  const { request } = await publicClient.simulateContract({
    account,
    address: input.depositAddress,
    abi: lzDepositAbi,
    functionName: 'sendDeposits',
    args: [[...input.depositParams], input.to],
    value: input.value,
  });
  return walletClient.writeContract(request);
}
