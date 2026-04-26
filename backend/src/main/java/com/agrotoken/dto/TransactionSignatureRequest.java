package com.agrotoken.dto;

import jakarta.validation.constraints.NotBlank;

public record TransactionSignatureRequest(
        @NotBlank String txSignature) {
}
