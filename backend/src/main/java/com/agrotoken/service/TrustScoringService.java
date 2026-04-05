package com.agrotoken.service;

import com.agrotoken.model.Campaign;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class TrustScoringService {

    public TrustScoreResult score(Campaign campaign, int farmerCampaignCount) {
        int trustScore = Math.min(100, Math.max(0,
                buildRiskComponent(campaign)
                        + buildProofComponent(campaign)
                        + buildHistoryComponent(farmerCampaignCount)
                        + buildFundingComponent(campaign)
                        + buildLifecycleComponent(campaign)
        ));

        return new TrustScoreResult(
                trustScore,
                buildLabel(trustScore),
                buildReasons(campaign, farmerCampaignCount)
        );
    }

    private int buildRiskComponent(Campaign campaign) {
        if (campaign.getRiskScore() == null) {
            return 20;
        }
        return Math.max(0, 40 - Math.round(campaign.getRiskScore() * 0.4f));
    }

    private int buildProofComponent(Campaign campaign) {
        String proofStatus = campaign.getProofStatus();
        if ("VERIFIED".equals(proofStatus)) {
            return 20;
        }
        if ("UPLOADED".equals(proofStatus)) {
            return 8;
        }
        if ("PENDING".equals(proofStatus)) {
            return 3;
        }
        return 0;
    }

    private int buildHistoryComponent(int farmerCampaignCount) {
        return Math.min(Math.max(farmerCampaignCount - 1, 0) * 5, 15);
    }

    private int buildFundingComponent(Campaign campaign) {
        long totalSupply = campaign.getTotalSupply() == null ? 0L : campaign.getTotalSupply();
        if (totalSupply <= 0) {
            return 0;
        }
        long tokensSold = campaign.getTokensSold() == null ? 0L : campaign.getTokensSold();
        double fundingRatio = (double) tokensSold / totalSupply;
        return (int) Math.round(Math.min(fundingRatio, 1.0) * 10);
    }

    private int buildLifecycleComponent(Campaign campaign) {
        String status = campaign.getStatus();
        if ("DISTRIBUTED".equals(status)) {
            return 15;
        }
        if ("HARVEST_SOLD".equals(status)) {
            return 12;
        }
        if ("FUNDED".equals(status)) {
            return 10;
        }
        if ("ACTIVE".equals(status)) {
            return 6;
        }
        return 0;
    }

    private String buildLabel(int trustScore) {
        if (trustScore >= 80) {
            return "HIGH_TRUST";
        }
        if (trustScore >= 60) {
            return "MEDIUM_TRUST";
        }
        return "WATCH_CAREFULLY";
    }

    private List<String> buildReasons(Campaign campaign, int farmerCampaignCount) {
        List<String> reasons = new ArrayList<>();

        if ("VERIFIED".equals(campaign.getProofStatus())) {
            reasons.add("Proof-of-asset verified by oracle");
        } else if ("UPLOADED".equals(campaign.getProofStatus())) {
            reasons.add("Proof-of-asset uploaded and awaiting verification");
        } else if ("REJECTED".equals(campaign.getProofStatus())) {
            reasons.add("Proof-of-asset requires manual review after rejection");
        }

        if (campaign.getRiskScore() != null) {
            if (campaign.getRiskScore() <= 33) {
                reasons.add("AI risk model sees low crop and regional risk");
            } else if (campaign.getRiskScore() <= 66) {
                reasons.add("AI risk model sees moderate campaign risk");
            } else {
                reasons.add("AI risk model flags elevated campaign risk");
            }
        } else {
            reasons.add("Trust estimate is provisional until AI risk scoring completes");
        }

        if (farmerCampaignCount > 1) {
            reasons.add("Farmer has prior campaign history on the platform");
        }

        long totalSupply = campaign.getTotalSupply() == null ? 0L : campaign.getTotalSupply();
        long tokensSold = campaign.getTokensSold() == null ? 0L : campaign.getTokensSold();
        if (totalSupply > 0) {
            int soldPercent = (int) Math.round(((double) tokensSold / totalSupply) * 100);
            if (soldPercent >= 75) {
                reasons.add("Strong investor demand with most of the supply already sold");
            } else if (soldPercent >= 25) {
                reasons.add("Campaign already shows early investor traction");
            } else {
                reasons.add("Campaign is still early and building market traction");
            }
        }

        if ("HARVEST_SOLD".equals(campaign.getStatus()) || "DISTRIBUTED".equals(campaign.getStatus())) {
            reasons.add("Campaign has progressed into payout execution");
        } else if ("FUNDED".equals(campaign.getStatus())) {
            reasons.add("Campaign has already reached full funding");
        }

        return reasons.stream().limit(3).toList();
    }

    public record TrustScoreResult(
            int trustScore,
            String trustLabel,
            List<String> trustReasons
    ) {
    }
}
