package com.agrotoken.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ConfirmHarvestRequest(
        @NotBlank String authorityWallet,
        @Min(1) long harvestTotalUsdc
) {
}

