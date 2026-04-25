package com.agrotoken.service;

import com.agrotoken.config.SolanaConfig;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import org.p2p.solanaj.core.PublicKey;
import org.p2p.solanaj.rpc.RpcClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.p2p.solanaj.rpc.RpcException;
import org.p2p.solanaj.rpc.types.ConfirmedTransaction;

@Service
public class SolanaService {

    private static final Logger log = LoggerFactory.getLogger(SolanaService.class);

    private final SolanaConfig solanaConfig;
    private final RpcClient rpcClient;
    private final PublicKey programId;

    public SolanaService(SolanaConfig solanaConfig) {
        this(solanaConfig, new RpcClient(solanaConfig.rpcUrl()));
    }

    public SolanaService(SolanaConfig solanaConfig, RpcClient rpcClient) {
        this.solanaConfig = solanaConfig;
        this.rpcClient = rpcClient;
        this.programId = new PublicKey(solanaConfig.programId());
        log.info("SolanaService initialized: rpc={}, programId={}", solanaConfig.rpcUrl(), solanaConfig.programId());
    }

    /**
     * Verifies that a transaction signature is valid, successful, and belongs to
     * our program and campaign.
     */
    public void verifyTransaction(String signature, String expectedCampaignPda) {
        try {
            log.info("Verifying transaction: {} for campaign: {}", signature, expectedCampaignPda);
            ConfirmedTransaction tx = rpcClient.getApi().getTransaction(signature);

            if (tx == null) {
                throw new RuntimeException("Transaction not found on-chain: " + signature);
            }
            if (tx.getMeta() == null) {
                throw new RuntimeException("Transaction metadata is missing: " + signature);
            }
            if (tx.getMeta().getErr() != null) {
                throw new RuntimeException(
                        "Transaction failed on-chain: " + signature + ". Error: " + tx.getMeta().getErr());
            }

            // Verify program involvement
            boolean programInvolved = tx.getTransaction().getMessage().getAccountKeys().stream()
                    .anyMatch(key -> String.valueOf(key).equals(solanaConfig.programId()));

            if (!programInvolved) {
                throw new RuntimeException("Transaction does not involve our Program ID: " + solanaConfig.programId());
            }

            // Verify campaign involvement
            boolean campaignInvolved = tx.getTransaction().getMessage().getAccountKeys().stream()
                    .anyMatch(key -> String.valueOf(key).equals(expectedCampaignPda));

            if (!campaignInvolved) {
                throw new RuntimeException(
                        "Transaction does not involve the expected campaign PDA: " + expectedCampaignPda);
            }

            log.info("Transaction {} verified successfully", signature);
        } catch (RpcException e) {
            log.error("RPC error during transaction verification: {}", signature, e);
            throw new RuntimeException("Solana RPC verification failed: " + e.getMessage(), e);
        }
    }

    /**
     * Derives campaign PDA: seeds = ["campaign", farmer_pubkey,
     * campaign_id_le_bytes]
     */
    public String deriveCampaignAddress(String farmerWallet, long campaignId) {
        byte[] idBytes = longToLeBytes(campaignId);
        PublicKey farmer = new PublicKey(farmerWallet);
        PublicKey pda = PublicKey.findProgramAddress(
                List.of("campaign".getBytes(), farmer.toByteArray(), idBytes),
                programId).getAddress();
        return pda.toBase58();
    }

    /**
     * Derives token mint PDA: seeds = ["token_mint", campaign_pda]
     */
    public String deriveTokenMintAddress(String campaignPda) {
        PublicKey campaign = new PublicKey(campaignPda);
        PublicKey pda = PublicKey.findProgramAddress(
                List.of("token_mint".getBytes(), campaign.toByteArray()),
                programId).getAddress();
        return pda.toBase58();
    }

    /**
     * Derives vault PDA: seeds = ["vault", campaign_pda]
     */
    public String deriveVaultAddress(String campaignPda) {
        PublicKey campaign = new PublicKey(campaignPda);
        PublicKey pda = PublicKey.findProgramAddress(
                List.of("vault".getBytes(), campaign.toByteArray()),
                programId).getAddress();
        return pda.toBase58();
    }

    public String getProgramId() {
        return solanaConfig.programId();
    }

    public String getUsdcMint() {
        return solanaConfig.usdcMint();
    }

    public String getOracleWallet() {
        return solanaConfig.oracleWallet();
    }

    public RpcClient getRpcClient() {
        return rpcClient;
    }

    private static byte[] longToLeBytes(long value) {
        return ByteBuffer.allocate(8).order(ByteOrder.LITTLE_ENDIAN).putLong(value).array();
    }
}
