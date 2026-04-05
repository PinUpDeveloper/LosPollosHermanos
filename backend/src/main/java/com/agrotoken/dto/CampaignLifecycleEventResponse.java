package com.agrotoken.dto;

import java.time.LocalDateTime;

public record CampaignLifecycleEventResponse(
        String type,
        String label,
        String description,
        LocalDateTime occurredAt,
        boolean done,
        String actorWallet,
        String explorerAddress,
        String referenceValue
) {
}
