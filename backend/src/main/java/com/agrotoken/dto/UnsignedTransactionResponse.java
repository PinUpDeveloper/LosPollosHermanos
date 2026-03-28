package com.agrotoken.dto;

public record UnsignedTransactionResponse(
        String transactionBase64,
        String message
) {
}

