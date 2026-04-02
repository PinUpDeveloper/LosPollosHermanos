package com.agrotoken.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VerifyProofRequest(
        @NotBlank String verifierWallet,
        @NotNull Boolean approved
) {
}
