package com.agrotoken.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "agrotoken.solana")
public record SolanaConfig(String rpcUrl, String programId, String oracleWallet) {
}

