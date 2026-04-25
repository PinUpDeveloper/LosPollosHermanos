package com.agrotoken.controller;

import com.agrotoken.dto.BuyTokensRequest;
import com.agrotoken.dto.CampaignResponse;
import com.agrotoken.dto.ConfirmHarvestRequest;
import com.agrotoken.dto.CreateCampaignRequest;
import com.agrotoken.dto.HolderResponse;
import com.agrotoken.dto.MarkDistributedRequest;
import com.agrotoken.dto.TransactionContextResponse;
import com.agrotoken.dto.VerifyProofRequest;
import com.agrotoken.service.CampaignService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {
    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @PostMapping
    public CampaignResponse createCampaign(@Valid @RequestBody CreateCampaignRequest request) {
        return campaignService.createCampaign(request);
    }

    @GetMapping
    public List<CampaignResponse> listCampaigns() {
        return campaignService.listActiveCampaigns();
    }

    @GetMapping("/{id}")
    public CampaignResponse getCampaign(@PathVariable Long id) {
        return campaignService.getCampaign(id);
    }

    @GetMapping("/farmer/{wallet}")
    public List<CampaignResponse> getFarmerCampaigns(@PathVariable String wallet) {
        return campaignService.getFarmerCampaigns(wallet);
    }

    /**
     * Returns on-chain addresses for frontend to build a buy_tokens transaction.
     */
    @PostMapping("/{id}/buy")
    public TransactionContextResponse buyTokens(
            @PathVariable Long id,
            @Valid @RequestBody BuyTokensRequest request) {
        return campaignService.buildBuyContext(id);
    }

    /** Records harvest confirmation after on-chain tx. */
    @PostMapping("/{id}/confirm")
    public CampaignResponse confirmHarvest(
            @PathVariable Long id,
            @Valid @RequestBody ConfirmHarvestRequest request) {
        return campaignService.confirmHarvest(id, request);
    }

    /**
     * Returns on-chain addresses for frontend to build a distribute transaction.
     */
    @PostMapping("/{id}/distribute")
    public TransactionContextResponse distribute(@PathVariable Long id) {
        return campaignService.buildDistributeContext(id);
    }

    /** Updates tokens_sold after confirmed on-chain buy. */
    @PostMapping("/{id}/record-purchase")
    public CampaignResponse recordPurchase(@PathVariable Long id, @Valid @RequestBody BuyTokensRequest request) {
        return campaignService.recordTokensPurchased(id, request.tokensAmount(), request.txSignature());
    }

    /** Marks campaign as DISTRIBUTED after on-chain distribute tx. */
    @PostMapping("/{id}/mark-distributed")
    public CampaignResponse markDistributed(@PathVariable Long id, @Valid @RequestBody MarkDistributedRequest request) {
        return campaignService.markDistributed(id, request.txSignature());
    }

    /** Re-calculate AI risk score for a campaign. */
    @PostMapping("/{id}/rescore")
    public CampaignResponse rescoreRisk(@PathVariable Long id) {
        return campaignService.rescoreRisk(id);
    }

    /** Oracle/verifier marks proof-of-asset as verified or rejected. */
    @PostMapping("/{id}/verify-proof")
    public CampaignResponse verifyProof(
            @PathVariable Long id,
            @Valid @RequestBody VerifyProofRequest request) {
        return campaignService.verifyProof(id, request.verifierWallet(), request.approved());
    }

    /** Returns real holder list from investment records. */
    @GetMapping("/{id}/holders")
    public List<HolderResponse> getHolders(@PathVariable Long id) {
        return campaignService.getHolders(id);
    }
}
