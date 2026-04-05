package com.agrotoken.dto;

import java.util.List;

public record FarmerPassportResponse(
        String farmerWallet,
        int totalCampaigns,
        int successfulCampaigns,
        int verifiedProofShare,
        int averageTrustScore,
        Integer averageHarvestConfirmationDays,
        String reliabilityBadge,
        List<String> highlights
) {
}
