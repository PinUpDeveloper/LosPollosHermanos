package com.agrotoken.service;

import com.agrotoken.config.SolanaConfig;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.stereotype.Service;

@Service
public class SolanaService {
    private final SolanaConfig solanaConfig;

    public SolanaService(SolanaConfig solanaConfig) {
        this.solanaConfig = solanaConfig;
    }

    public String buildCreateCampaignTx(String farmerWallet, String title) {
        return encode("createCampaign|" + farmerWallet + "|" + title + "|" + solanaConfig.programId());
    }

    public String buildBuyTokensTx(String campaignPda, String investorWallet, long amount) {
        return encode("buyTokens|" + campaignPda + "|" + investorWallet + "|" + amount);
    }

    public String buildConfirmHarvestTx(String campaignPda, long revenue) {
        return encode("confirmHarvest|" + campaignPda + "|" + revenue);
    }

    public String buildDistributeTx(String campaignPda) {
        return encode("distribute|" + campaignPda);
    }

    public String deriveCampaignAddress(String farmerWallet, long campaignId) {
        return "campaign:" + farmerWallet + ":" + campaignId;
    }

    public String deriveMintAddress(long campaignId) {
        return "mint:" + campaignId;
    }

    private String encode(String value) {
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }
}

