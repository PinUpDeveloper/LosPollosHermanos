package com.agrotoken.service;

import com.agrotoken.dto.CampaignResponse;
import com.agrotoken.dto.ConfirmHarvestRequest;
import com.agrotoken.dto.CreateCampaignRequest;
import com.agrotoken.dto.UnsignedTransactionResponse;
import com.agrotoken.model.Campaign;
import com.agrotoken.repository.CampaignRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CampaignService {
    private final CampaignRepository campaignRepository;
    private final SolanaService solanaService;

    public CampaignService(CampaignRepository campaignRepository, SolanaService solanaService) {
        this.campaignRepository = campaignRepository;
        this.solanaService = solanaService;
    }

    @Transactional
    public CampaignResponse createCampaign(CreateCampaignRequest request) {
        Campaign campaign = new Campaign();
        campaign.setFarmerWallet(request.farmerWallet());
        campaign.setTitle(request.title());
        campaign.setDescription(request.description());
        campaign.setCropType(request.cropType());
        campaign.setRegion(request.region());
        campaign.setTotalSupply(request.totalSupply());
        campaign.setTokensSold(0L);
        campaign.setPricePerToken(request.pricePerToken());
        campaign.setStatus("ACTIVE");
        campaign.setProofDocumentUrl(request.proofDocumentUrl());
        campaign.setProofHash(request.proofHash());
        campaign.setCreatedAt(LocalDateTime.now());
        campaign.setHarvestDate(request.harvestDate());

        Campaign saved = campaignRepository.save(campaign);
        saved.setOnChainAddress(solanaService.deriveCampaignAddress(request.farmerWallet(), saved.getId()));
        saved.setTokenMintAddress(solanaService.deriveMintAddress(saved.getId()));
        return toResponse(campaignRepository.save(saved));
    }

    public List<CampaignResponse> listActiveCampaigns() {
        return campaignRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CampaignResponse getCampaign(Long id) {
        return toResponse(findCampaign(id));
    }

    public List<CampaignResponse> getFarmerCampaigns(String wallet) {
        return campaignRepository.findByFarmerWallet(wallet).stream().map(this::toResponse).toList();
    }

    public UnsignedTransactionResponse buildBuyTransaction(Long id, String investorWallet, long amount) {
        Campaign campaign = findCampaign(id);
        return new UnsignedTransactionResponse(
                solanaService.buildBuyTokensTx(campaign.getOnChainAddress(), investorWallet, amount),
                "Unsigned buy transaction generated"
        );
    }

    @Transactional
    public CampaignResponse confirmHarvest(Long id, ConfirmHarvestRequest request) {
        Campaign campaign = findCampaign(id);
        campaign.setStatus("HARVEST_SOLD");
        return toResponse(campaignRepository.save(campaign));
    }

    public UnsignedTransactionResponse buildDistributeTransaction(Long id) {
        Campaign campaign = findCampaign(id);
        return new UnsignedTransactionResponse(
                solanaService.buildDistributeTx(campaign.getOnChainAddress()),
                "Unsigned distribute transaction generated"
        );
    }

    public List<String> getHolders(Long id) {
        Campaign campaign = findCampaign(id);
        return List.of("holders-for-" + campaign.getOnChainAddress());
    }

    private Campaign findCampaign(Long id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Campaign %d not found".formatted(id)));
    }

    private CampaignResponse toResponse(Campaign campaign) {
        return new CampaignResponse(
                campaign.getId(),
                campaign.getOnChainAddress(),
                campaign.getFarmerWallet(),
                campaign.getTitle(),
                campaign.getDescription(),
                campaign.getCropType(),
                campaign.getRegion(),
                campaign.getTotalSupply(),
                campaign.getTokensSold(),
                campaign.getPricePerToken(),
                campaign.getStatus(),
                campaign.getProofDocumentUrl(),
                campaign.getProofHash(),
                campaign.getTokenMintAddress(),
                campaign.getCreatedAt(),
                campaign.getHarvestDate()
        );
    }
}

