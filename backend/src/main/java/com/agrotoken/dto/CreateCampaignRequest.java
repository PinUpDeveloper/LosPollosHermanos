package com.agrotoken.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record CreateCampaignRequest(
        @NotBlank String farmerWallet,
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String cropType,
        @NotBlank String region,
        @Min(1) long totalSupply,
        @Min(1) long pricePerToken,
        @NotBlank String proofDocumentUrl,
        @NotBlank String proofHash,
        @NotNull @Future LocalDateTime harvestDate
) {
}

