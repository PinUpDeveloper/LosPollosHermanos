package com.agrotoken.dto;

public record HolderResponse(
        String investorWallet,
        Long tokensAmount,
        Long usdcPaid
) {
}
