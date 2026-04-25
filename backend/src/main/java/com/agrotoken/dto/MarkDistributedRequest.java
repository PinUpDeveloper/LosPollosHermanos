package com.agrotoken.dto;

import jakarta.validation.constraints.NotBlank;

public record MarkDistributedRequest(
        @NotBlank String txSignature) {
}
