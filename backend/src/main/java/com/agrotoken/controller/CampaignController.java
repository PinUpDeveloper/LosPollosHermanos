package com.agrotoken.controller;

import com.agrotoken.dto.BuyTokensRequest;
import com.agrotoken.dto.CampaignResponse;
import com.agrotoken.dto.ConfirmHarvestRequest;
import com.agrotoken.dto.CreateCampaignRequest;
import com.agrotoken.dto.UnsignedTransactionResponse;
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

    @PostMapping("/{id}/buy")
    public UnsignedTransactionResponse buyTokens(@PathVariable Long id, @Valid @RequestBody BuyTokensRequest request) {
        return campaignService.buildBuyTransaction(id, request.investorWallet(), request.tokensAmount());
    }

    @PostMapping("/{id}/confirm")
    public CampaignResponse confirmHarvest(@PathVariable Long id, @Valid @RequestBody ConfirmHarvestRequest request) {
        return campaignService.confirmHarvest(id, request);
    }

    @PostMapping("/{id}/distribute")
    public UnsignedTransactionResponse distribute(@PathVariable Long id) {
        return campaignService.buildDistributeTransaction(id);
    }

    @GetMapping("/{id}/holders")
    public List<String> getHolders(@PathVariable Long id) {
        return campaignService.getHolders(id);
    }
}

