package com.agrotoken.dto;

public record TransactionContextResponse(
        String programId,
        String campaignPda,
        String tokenMint,
        String vault,
        String usdcMint,
        long campaignIdOnChain,
        String farmerWallet,
        String oracleWallet,
        String message
) {
}
