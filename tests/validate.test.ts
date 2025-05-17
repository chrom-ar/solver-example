import { describe, it, expect } from 'vitest';
import { type Message, type ProposalResponse, ProposalResponseSchema } from '@chrom-ar/solver-sdk';
import { validateAndBuildProposal } from '../src/helpers';

describe('validateAndBuildProposal', () => {
  const createBaseMessage = (body: Message['body']): Message => ({
    timestamp: Date.now(),
    replyTo: 'test-reply-to',
    body
  });

  it('should return null for unsupported message type', async () => {
    const message = createBaseMessage({
      type: 'UNSUPPORTED',
      fromChain: 'base',
      recipientChain: 'mainnet'
    });

    const result = await validateAndBuildProposal(message);
    expect(result).toBeNull();
  });

  it('should build a bridge proposal', async () => {
    const message = createBaseMessage({
      type: 'BRIDGE',
      fromChain: 'base',
      recipientChain: 'avalanche',
      amount: '100',
      fromToken: 'USDC',
      fromAddress: '0x1234567890123456789012345678901234567890',
      recipientAddress: '0x0987654321098765432109876543210987654321'
    });

    const result: ProposalResponse = await validateAndBuildProposal(message);

    // Ensure schema is valid
    ProposalResponseSchema.parse(result);

    expect(result).not.toBeNull();
    expect(result.description).toBe('Bridge');
    expect(result.titles).toEqual(['CCTPv2 Approve', 'CCTPv2 Burn']);
    expect(result.calls).toEqual([
      `Approving 100USDC on base to be spent by CCTPv2`,
      `Burning 100USDC on base to avalanche`
    ]);
    expect(result.transactions).toHaveLength(2);
  });
});
