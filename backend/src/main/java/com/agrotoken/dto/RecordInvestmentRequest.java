package com.agrotoken.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RecordInvestmentRequest(
        @NotBlank String investorWallet,
        @Min(1) long tokensAmount,
        @Min(1) long usdcPaid,
        @NotBlank String txSignature
) {
}

