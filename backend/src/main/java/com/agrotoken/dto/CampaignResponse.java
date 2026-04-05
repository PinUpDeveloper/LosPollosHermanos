package com.agrotoken.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CampaignResponse(
        Long id,
        String onChainAddress,
        String farmerWallet,
        String title,
        String description,
        String cropType,
        String region,
        Long totalSupply,
        Long tokensSold,
        Long pricePerToken,
        String status,
        String proofDocumentUrl,
        String proofHash,
        String proofStatus,
        LocalDateTime proofUploadedAt,
        LocalDateTime proofVerifiedAt,
        String proofVerifierWallet,
        String tokenMintAddress,
        String vaultAddress,
        LocalDateTime createdAt,
        LocalDateTime harvestDate,
        Integer riskScore,
        String riskExplanation,
        Integer trustScore,
        String trustLabel,
        List<String> trustReasons,
        List<CampaignLifecycleEventResponse> lifecycleEvents
) {
}

