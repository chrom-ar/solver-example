import { type Message } from "@chrom-ar/solver-sdk";

import { buildBurnTransactions, buildClaimTransaction, isCCTPSupported } from './bridge/cctpv2';
import { logger } from './logger';

export async function validateAndBuildBridge(message: Message): Promise<object | null> {
  const {
    body: {
      amount,
      fromToken,
      fromAddress,
      fromChain,
      recipientChain,
    }
  } = message;

  if (!amount || !fromToken || !fromAddress || !fromChain || !recipientChain) {
    logger.debug('missing bridge fields', { amount, fromToken, fromAddress, fromChain, recipientChain });
    return null;
  }


  // If token is USDC and both chains are supported by CCTPv2, use CCTPv2
  if (fromToken.toLowerCase() !== 'usdc' || !isCCTPSupported(fromChain, recipientChain!)) {
    logger.debug('not using CCTPv2', { fromToken, fromChain, recipientChain });
    return null;
  }

  const bridgeResult = await buildBurnTransactions(message);

  return {
    description: 'Bridge',
    titles: bridgeResult.map(tx => tx.title),
    calls: bridgeResult.map(tx => tx.call),
    transactions: bridgeResult.map(tx => tx.transaction)
  };
}

export async function validateAndBuildClaim(message: Message): Promise<object | null> {
  const {
    body: {
      fromChain,
      recipientChain,
      transactionHash
    }
  } = message;

  if (!transactionHash) {
    logger.debug('missing transaction hash', message);
    return null;
  }

  if (!isCCTPSupported(fromChain, recipientChain!)) {
    throw new Error(`One or both chains (source: ${fromChain}, destination: ${recipientChain}) are not supported by CCTPv2`);
  }

  const claimResult = await buildClaimTransaction(fromChain, recipientChain!, transactionHash);

  return {
    description: 'Claim CCTPv2',
    titles: claimResult.map(tx => tx.title),
    calls: claimResult.map(tx => tx.call),
    transactions: claimResult.map(tx => tx.transaction)
  };
}
