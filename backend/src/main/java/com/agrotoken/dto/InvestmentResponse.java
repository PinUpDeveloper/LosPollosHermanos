package com.agrotoken.dto;

import java.time.LocalDateTime;

public record InvestmentResponse(
        Long id,
        Long campaignId,
        String investorWallet,
        Long tokensAmount,
        Long usdcPaid,
        String txSignature,
        LocalDateTime createdAt
) {
}

