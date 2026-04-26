package com.agrotoken.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record RecordInvestmentRequest(
                @NotBlank String investorWallet,
                long tokensAmount,
                long usdcPaid,
                @NotBlank String txSignature) {
}
