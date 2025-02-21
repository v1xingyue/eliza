import { Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { type IAgentRuntime, elizaLogger } from '@elizaos/core';

export interface KeypairResult {
    keypair?: Keypair;
    publicKey?: PublicKey;
}

/**
 * Gets either a keypair or public key based on TEE mode and runtime settings
 * @param runtime The agent runtime
 * @param requirePrivateKey Whether to return a full keypair (true) or just public key (false)
 * @returns KeypairResult containing either keypair or public key
 */
export async function getWalletKey(
    runtime: IAgentRuntime,
    requirePrivateKey = true,
): Promise<KeypairResult> {
    // TEE mode is OFF
    if (requirePrivateKey) {
        const privateKeyString =
            runtime.getSetting('SOLANA_PRIVATE_KEY') ?? runtime.getSetting('WALLET_PRIVATE_KEY');

        if (!privateKeyString) {
            throw new Error('Private key not found in settings');
        }

        try {
            // First try base58
            const secretKey = bs58.decode(privateKeyString);
            return { keypair: Keypair.fromSecretKey(secretKey) };
        } catch (e) {
            elizaLogger.log('Error decoding base58 private key:', e);
            try {
                // Then try base64
                elizaLogger.log('Try decoding base64 instead');
                const secretKey = Uint8Array.from(Buffer.from(privateKeyString, 'base64'));
                return { keypair: Keypair.fromSecretKey(secretKey) };
            } catch (e2) {
                elizaLogger.error('Error decoding private key: ', e2);
                throw new Error('Invalid private key format');
            }
        }
    } else {
        const publicKeyString =
            runtime.getSetting('SOLANA_PUBLIC_KEY') ?? runtime.getSetting('WALLET_PUBLIC_KEY');

        if (!publicKeyString) {
            throw new Error(
                'Solana Public key not found in settings, but plugin was loaded, please set SOLANA_PUBLIC_KEY',
            );
        }

        return { publicKey: new PublicKey(publicKeyString) };
    }
}
