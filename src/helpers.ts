import { type Message, type ProposalResponse } from '@chrom-ar/solver-sdk'
import { validateAndBuildBridge } from './bridge';
import { logger } from "./logger";


export const APPROVE_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ]
  }
];

export const CCTP_DEPOSIT_FOR_BURN_ABI = [
  {
    type: 'function',
    name: 'depositForBurn',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
    ],
    outputs: [],
  },
];

export const CCTP_RECEIVE_MESSAGE_ABI = [
  {
    type: 'function',
    name: 'receiveMessage',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'message', type: 'bytes' },
      { name: 'attestation', type: 'bytes' },
    ],
    outputs: [],
  },
];

export const AVAILABLE_PROTOCOLS = [
  'cctp',
  'cctpv2',
];

export const AVAILABLE_CHAINS = [
  'base',
  'mainnet',
];

export const validateAndBuildProposal = async (message: Message): Promise<ProposalResponse | null> => {
  const {
    body: {
      type,
      protocols,
      fromChain,
    }
  } = message;

  if (protocols && protocols.length > 0) {
    const filteredProtocols = protocols.filter(protocol => AVAILABLE_PROTOCOLS.includes(protocol.toLowerCase()));

    if (filteredProtocols.length === 0) {
      logger.debug('no valid protocols', protocols);

      return null;
    }
  }

  if (!fromChain || !AVAILABLE_CHAINS.includes(fromChain)) {
    logger.debug('Unknown fromChain', fromChain);

    return null;
  }

  let result;

  switch (type?.toUpperCase()) {
    case "BRIDGE":
      result = await validateAndBuildBridge(message);
      break;
    default:
      logger.debug("Unsupported message type:", type);
  }

  if (!result) {
    return null;
  }

  return {
    toChain: message.body.recipientChain || message.body.fromChain,
    ...result
  }
}