package com.agrotoken.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record BuyTokensRequest(
                @NotBlank String investorWallet,
                @Min(1) long tokensAmount,
                @NotBlank String txSignature,
                @Min(0) long usdcPaid) {
}
