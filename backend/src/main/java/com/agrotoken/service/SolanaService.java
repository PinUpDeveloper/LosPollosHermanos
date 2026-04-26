package com.agrotoken.service;

import com.agrotoken.config.SolanaConfig;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;
import org.p2p.solanaj.core.PublicKey;
import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.rpc.types.ConfirmedTransaction;
import org.p2p.solanaj.rpc.types.SignatureInformation;
import org.p2p.solanaj.rpc.types.config.Commitment;
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

    public void verifyTransaction(String signature, List<String> expectedAccounts) {
        log.info("Verifying transaction simply: signature={}", signature);

        ConfirmedTransaction tx = null;
        int attempts = 10;
        while (attempts > 0) {
            try {
                tx = rpcClient.getApi().getTransaction(signature);
                if (tx != null)
                    break;
            } catch (Exception e) {
                log.debug("Poll attempt failed for signature {}: {}", signature, e.getMessage());
            }
            attempts--;
            if (attempts > 0) {
                try {
                    Thread.sleep(2000);
                } catch (InterruptedException ignored) {
                }
            }
        }

        if (tx == null) {
            throw new RuntimeException("Transaction not found on Solana");
        }
        if (tx.getMeta().getErr() != null) {
            throw new RuntimeException("Transaction failed on-chain");
        }

        log.info("Transaction {} verified successfully", signature);
    }

    /** Helper classes for address derivation needed by CampaignService */
    public String deriveCampaignAddress(String farmerWallet, Long campaignId) {
        try {
            // In most solanaj forks, findProgramAddress returns an object with
            // .getAddress()
            // Using reflection-like safe approach or just direct call if we expect
            // ProgramAddress
            return PublicKey.findProgramAddress(
                    List.of("campaign".getBytes(), new PublicKey(farmerWallet).toByteArray(),
                            longToLeBytes(campaignId)),
                    programId).getAddress().toBase58();
        } catch (Exception e) {
            log.error("Derivation failed: {}", e.getMessage());
            throw new RuntimeException("Failed to derive campaign address", e);
        }
    }

    public String deriveTokenMintAddress(String campaignAddress) {
        try {
            return PublicKey.findProgramAddress(
                    List.of("token_mint".getBytes(), new PublicKey(campaignAddress).toByteArray()),
                    programId).getAddress().toBase58();
        } catch (Exception e) {
            throw new RuntimeException("Failed to derive token mint address", e);
        }
    }

    public String deriveVaultAddress(String campaignAddress) {
        try {
            return PublicKey.findProgramAddress(
                    List.of("vault".getBytes(), new PublicKey(campaignAddress).toByteArray()),
                    programId).getAddress().toBase58();
        } catch (Exception e) {
            throw new RuntimeException("Failed to derive vault address", e);
        }
    }

    public String findLatestSignature(String address) {
        try {
            List<SignatureInformation> sigs = rpcClient.getApi().getSignaturesForAddress(new PublicKey(address), 1,
                    Commitment.CONFIRMED);
            if (sigs != null && !sigs.isEmpty()) {
                return sigs.get(0).getSignature();
            }
        } catch (Exception e) {
            log.warn("Failed to find latest signature: {}", e.getMessage());
        }
        return null;
    }

    public String getUsdcMint() {
        return solanaConfig.usdcMint();
    }

    public String getOracleWallet() {
        return solanaConfig.oracleWallet();
    }

    public String getProgramId() {
        return solanaConfig.programId();
    }

    private static byte[] longToLeBytes(long value) {
        return ByteBuffer.allocate(8).order(ByteOrder.LITTLE_ENDIAN).putLong(value).array();
    }
}
