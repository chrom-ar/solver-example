import { encodeFunctionData } from 'viem';
import { base, mainnet, avalanche } from 'viem/chains';
import { Message } from '@chrom-ar/solver-sdk';
import {
  getChainId,
  getTokenAddress,
  getTokenAmount,
} from '@chrom-ar/utils';

import {
  APPROVE_ABI,
  CCTP_DEPOSIT_FOR_BURN_ABI,
  CCTP_RECEIVE_MESSAGE_ABI,
} from '../helpers';
import { logger } from '../logger';

const API_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const DOMAINS: Record<number, number> = {
  [mainnet.id]: 0,
  [base.id]: 6,
  [avalanche.id]: 1,
};

const TOKEN_MESSENGERS: Record<number, string> = {
  [mainnet.id]: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
  [base.id]: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
  [avalanche.id]: '0x28b5a0e9C621a5BadaA536219b3a228C8168cf5d',
};

const MESSAGE_TRANSMITTERS: Record<number, string> = {
  [mainnet.id]: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
  [base.id]: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
  [avalanche.id]: '0x81D40F21F12A8F0E3252Bccb954D722d4c464B64',
};

interface Attestation {
  message: `0x${string}`;
  attestation: `0x${string}`;
  status: string;
}

interface CircleResponse {
  messages: Attestation[];
}

export function isCCTPSupported(sourceChain: string, destinationChain: string): boolean {
  const sourceChainId = getChainId(sourceChain);
  const destinationChainId = getChainId(destinationChain);

  return Object.keys(DOMAINS).includes(sourceChainId?.toString()) &&
    Object.keys(DOMAINS).includes(destinationChainId?.toString());
}

export async function buildBurnTransactions(message: Message) {
  const {
    body: {
      amount,
      fromChain,
      recipientAddress,
      recipientChain,
    }
  } = message;

  if (!isCCTPSupported(fromChain, recipientChain!)) {
    throw new Error('One or both chains are not supported by CCTP');
  }

  const sourceChainId = getChainId(fromChain);
  const destinationChainId = getChainId(recipientChain!);

  const amountInTokenUnits = BigInt(getTokenAmount(amount!, fromChain, 'USDC') || '0');
  const maxFee = 500n; // Fast transfer max fee (0.0005 USDC)

  // Format destination address for CCTP
  const destinationAddressBytes32 = `0x000000000000000000000000${recipientAddress!.slice(2)}` as `0x${string}`;
  const destinationCallerBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

  const usdcAddress = getTokenAddress(fromChain, 'USDC');

  return [
    {
      transaction: {
        value: '0',
        to: usdcAddress as `0x${string}`,
        chainId: sourceChainId,
        data: encodeFunctionData({
          abi: APPROVE_ABI,
          functionName: 'approve',
          args: [TOKEN_MESSENGERS[sourceChainId], amountInTokenUnits],
        }),
      },
      title: 'CCTPv2 Approve',
      call: `Approving ${amount}USDC on ${fromChain} to be spent by CCTPv2`,
    },
    {
      transaction: {
        value: '0',
        to: TOKEN_MESSENGERS[sourceChainId] as `0x${string}`,
        chainId: sourceChainId,
        data: encodeFunctionData({
          abi: CCTP_DEPOSIT_FOR_BURN_ABI,
          functionName: 'depositForBurn',
          args: [
            amountInTokenUnits,
            DOMAINS[destinationChainId],
            destinationAddressBytes32,
            usdcAddress,
            destinationCallerBytes32,
            maxFee,
            1000, // minFinalityThreshold (1000 or less for Fast Transfer)
          ],
        }),
      },
      title: 'CCTPv2 Burn',
      call: `Burning ${amount}USDC on ${fromChain} to ${recipientChain}`,
    }
  ];
}

export async function buildClaimTransaction(sourceChain: string, destinationChain: string, burnTxHash: string) {
  const sourceChainId = getChainId(sourceChain);
  const destinationChainId = getChainId(destinationChain);
  const sourceDomain = DOMAINS[sourceChainId];

  if (!isCCTPSupported(sourceChain, destinationChain)) {
    throw new Error(`CCTPv2 is not supported on ${sourceChain} or ${destinationChain}`);
  }

  const attestation = await retrieveAttestation(sourceDomain, burnTxHash);

  return [{
    transaction: {
      value: '0',
      to: MESSAGE_TRANSMITTERS[destinationChainId] as `0x${string}`,
      chainId: destinationChainId,
      data: encodeFunctionData({
        abi: CCTP_RECEIVE_MESSAGE_ABI,
        functionName: 'receiveMessage',
        args: [attestation.message, attestation.attestation],
      }),
    },
    title: 'CCTPv2 Claim',
    call: `Claiming USDC on ${destinationChain}`
  }];
}

async function retrieveAttestation(sourceDomain: number, transactionHash: string): Promise<Attestation> {
  logger.debug('Retrieving attestation...');

  const url = `https://iris-api.circle.com/v2/messages/${sourceDomain}?transactionHash=${transactionHash}`;
  const startTime = Date.now();

  while (Date.now() - startTime < API_TIMEOUT_MS) {
    try {
      const response = await fetch(url);

      if (response.status === 404) {
        logger.debug('Waiting for attestation...');
      }

      if (response.ok) {
        const data = await response.json() as CircleResponse;
        if (data?.messages?.[0]?.status === 'complete') {
          logger.debug('Attestation retrieved successfully!');
          return data.messages[0];
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      logger.error('Error fetching attestation:', error instanceof Error ? error.message : String(error));
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  throw new Error(`Timeout waiting for attestation after ${API_TIMEOUT_MS / 1000} seconds`);
}
