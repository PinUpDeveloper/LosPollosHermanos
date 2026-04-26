package com.agrotoken.service;

import com.agrotoken.dto.CampaignLifecycleEventResponse;
import com.agrotoken.model.Campaign;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class LifecycleService {

    public List<CampaignLifecycleEventResponse> buildEvents(Campaign campaign) {
        List<CampaignLifecycleEventResponse> events = new ArrayList<>();

        events.add(new CampaignLifecycleEventResponse(
                "CAMPAIGN_CREATED",
                "Campaign created",
                "The farmer created the campaign and the on-chain lifecycle started.",
                campaign.getCreatedAt(),
                campaign.getCreatedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                campaign.getOnChainAddress()));

        events.add(new CampaignLifecycleEventResponse(
                "PROOF_UPLOADED",
                "Proof uploaded",
                "Proof-of-asset document was attached and its hash was linked to the campaign.",
                campaign.getProofUploadedAt(),
                campaign.getProofUploadedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                campaign.getProofHash()));

        events.add(new CampaignLifecycleEventResponse(
                "PROOF_VERIFIED",
                "Oracle verified proof",
                "The oracle or verifier confirmed that the uploaded proof matches the real-world asset.",
                campaign.getProofVerifiedAt(),
                "VERIFIED".equals(campaign.getProofStatus()),
                campaign.getProofVerifierWallet(),
                campaign.getProofVerifierWallet(),
                campaign.getProofHash()));

        events.add(new CampaignLifecycleEventResponse(
                "FUNDED_25",
                "25% funded",
                "The campaign passed the first investor traction milestone.",
                campaign.getFunded25At(),
                campaign.getFunded25At() != null,
                null,
                campaign.getOnChainAddress(),
                "25%"));

        events.add(new CampaignLifecycleEventResponse(
                "FUNDED_50",
                "50% funded",
                "The campaign reached the midpoint of its funding target.",
                campaign.getFunded50At(),
                campaign.getFunded50At() != null,
                null,
                campaign.getOnChainAddress(),
                "50%"));

        events.add(new CampaignLifecycleEventResponse(
                "FUNDED_100",
                "100% funded",
                "The campaign fully sold its tokenized funding allocation.",
                campaign.getFunded100At(),
                campaign.getFunded100At() != null,
                null,
                campaign.getOnChainAddress(),
                "100%"));

        events.add(new CampaignLifecycleEventResponse(
                "HARVEST_CONFIRMED",
                "Harvest confirmed",
                "The harvest result was confirmed and the campaign moved toward payout.",
                campaign.getHarvestConfirmedAt(),
                campaign.getHarvestConfirmedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                null));

        events.add(new CampaignLifecycleEventResponse(
                "PAYOUT_DISTRIBUTED",
                "Payout distributed",
                "Revenue distribution for token holders was finalized.",
                campaign.getDistributedAt(),
                campaign.getDistributedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                campaign.getVaultAddress()));

        return events;
    }
}
