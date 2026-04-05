package com.agrotoken.service;

import com.agrotoken.dto.FarmerPassportResponse;
import com.agrotoken.model.Campaign;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FarmerPassportService {
    private final TrustScoringService trustScoringService;

    public FarmerPassportService(TrustScoringService trustScoringService) {
        this.trustScoringService = trustScoringService;
    }

    public FarmerPassportResponse build(String farmerWallet, List<Campaign> farmerCampaigns) {
        int totalCampaigns = farmerCampaigns.size();
        if (totalCampaigns == 0) {
            return new FarmerPassportResponse(
                    farmerWallet,
                    0,
                    0,
                    0,
                    0,
                    null,
                    "BRONZE",
                    List.of("Farmer has not launched campaigns on the platform yet")
            );
        }

        int successfulCampaigns = (int) farmerCampaigns.stream()
                .filter(campaign -> "DISTRIBUTED".equals(campaign.getStatus()))
                .count();

        int verifiedProofCampaigns = (int) farmerCampaigns.stream()
                .filter(campaign -> "VERIFIED".equals(campaign.getProofStatus()))
                .count();

        int verifiedProofShare = (int) Math.round((verifiedProofCampaigns * 100.0) / totalCampaigns);

        int averageTrustScore = (int) Math.round(farmerCampaigns.stream()
                .mapToInt(campaign -> trustScoringService.score(campaign, totalCampaigns).trustScore())
                .average()
                .orElse(0));

        Integer averageHarvestConfirmationDays = buildAverageHarvestConfirmationDays(farmerCampaigns);
        String reliabilityBadge = buildReliabilityBadge(successfulCampaigns, verifiedProofShare, averageTrustScore);

        return new FarmerPassportResponse(
                farmerWallet,
                totalCampaigns,
                successfulCampaigns,
                verifiedProofShare,
                averageTrustScore,
                averageHarvestConfirmationDays,
                reliabilityBadge,
                buildHighlights(successfulCampaigns, verifiedProofShare, averageTrustScore, averageHarvestConfirmationDays)
        );
    }

    private Integer buildAverageHarvestConfirmationDays(List<Campaign> farmerCampaigns) {
        return farmerCampaigns.stream()
                .filter(campaign -> campaign.getCreatedAt() != null && campaign.getHarvestConfirmedAt() != null)
                .mapToLong(campaign -> ChronoUnit.DAYS.between(
                        campaign.getCreatedAt().toLocalDate(),
                        campaign.getHarvestConfirmedAt().toLocalDate()
                ))
                .average()
                .stream()
                .mapToInt(value -> (int) Math.round(value))
                .boxed()
                .findFirst()
                .orElse(null);
    }

    private String buildReliabilityBadge(int successfulCampaigns, int verifiedProofShare, int averageTrustScore) {
        if (successfulCampaigns >= 2 && verifiedProofShare >= 80 && averageTrustScore >= 75) {
            return "GOLD";
        }
        if (successfulCampaigns >= 1 || verifiedProofShare >= 60 || averageTrustScore >= 60) {
            return "SILVER";
        }
        return "BRONZE";
    }

    private List<String> buildHighlights(
            int successfulCampaigns,
            int verifiedProofShare,
            int averageTrustScore,
            Integer averageHarvestConfirmationDays
    ) {
        List<String> highlights = new ArrayList<>();
        highlights.add("%d completed campaign%s reached payout distribution".formatted(
                successfulCampaigns,
                successfulCampaigns == 1 ? "" : "s"
        ));
        highlights.add("%d%% of campaigns have verified proof-of-asset".formatted(verifiedProofShare));
        highlights.add("Average trust score across campaigns: %d/100".formatted(averageTrustScore));

        if (averageHarvestConfirmationDays != null) {
            highlights.add("Average time to harvest confirmation: %d days".formatted(averageHarvestConfirmationDays));
        }

        return highlights;
    }
}
