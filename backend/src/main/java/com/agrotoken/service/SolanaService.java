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

@Service
public class SolanaService {

    private static final Logger log = LoggerFactory.getLogger(SolanaService.class);

    private final SolanaConfig solanaConfig;
    private final RpcClient rpcClient;
    private final PublicKey programId;

    public SolanaService(SolanaConfig solanaConfig) {
        this.solanaConfig = solanaConfig;
        this.rpcClient = new RpcClient(solanaConfig.rpcUrl());
        this.programId = new PublicKey(solanaConfig.programId());
        log.info("SolanaService initialized: rpc={}, programId={}", solanaConfig.rpcUrl(), solanaConfig.programId());
    }

    /**
     * Derives campaign PDA: seeds = ["campaign", farmer_pubkey, campaign_id_le_bytes]
     */
    public String deriveCampaignAddress(String farmerWallet, long campaignId) {
        byte[] idBytes = longToLeBytes(campaignId);
        PublicKey farmer = new PublicKey(farmerWallet);
        PublicKey pda = PublicKey.findProgramAddress(
                List.of("campaign".getBytes(), farmer.toByteArray(), idBytes),
                programId
        ).getAddress();
        return pda.toBase58();
    }

    /**
     * Derives token mint PDA: seeds = ["token_mint", campaign_pda]
     */
    public String deriveTokenMintAddress(String campaignPda) {
        PublicKey campaign = new PublicKey(campaignPda);
        PublicKey pda = PublicKey.findProgramAddress(
                List.of("token_mint".getBytes(), campaign.toByteArray()),
                programId
        ).getAddress();
        return pda.toBase58();
    }

    /**
     * Derives vault PDA: seeds = ["vault", campaign_pda]
     */
    public String deriveVaultAddress(String campaignPda) {
        PublicKey campaign = new PublicKey(campaignPda);
        PublicKey pda = PublicKey.findProgramAddress(
                List.of("vault".getBytes(), campaign.toByteArray()),
                programId
        ).getAddress();
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
