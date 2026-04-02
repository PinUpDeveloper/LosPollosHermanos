package com.agrotoken.service;

import com.agrotoken.dto.CampaignResponse;
import com.agrotoken.dto.ConfirmHarvestRequest;
import com.agrotoken.dto.CreateCampaignRequest;
import com.agrotoken.dto.HolderResponse;
import com.agrotoken.dto.TransactionContextResponse;
import com.agrotoken.model.Campaign;
import com.agrotoken.repository.CampaignRepository;
import com.agrotoken.repository.InvestmentRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CampaignService {
    private final CampaignRepository campaignRepository;
    private final InvestmentRepository investmentRepository;
    private final SolanaService solanaService;

    public CampaignService(
            CampaignRepository campaignRepository,
            InvestmentRepository investmentRepository,
            SolanaService solanaService
    ) {
        this.campaignRepository = campaignRepository;
        this.investmentRepository = investmentRepository;
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

        // Save first to get DB id, which is used as on-chain campaign_id
        Campaign saved = campaignRepository.save(campaign);

        // Derive real PDA addresses
        String campaignPda = solanaService.deriveCampaignAddress(
                request.farmerWallet(), saved.getId());
        String tokenMint = solanaService.deriveTokenMintAddress(campaignPda);
        String vault = solanaService.deriveVaultAddress(campaignPda);

        saved.setOnChainAddress(campaignPda);
        saved.setTokenMintAddress(tokenMint);
        saved.setVaultAddress(vault);

        return toResponse(campaignRepository.save(saved));
    }

    public List<CampaignResponse> listActiveCampaigns() {
        return campaignRepository.findAll().stream().map(this::toResponse).toList();
    }

    public CampaignResponse getCampaign(Long id) {
        return toResponse(findCampaign(id));
    }

    public List<CampaignResponse> getFarmerCampaigns(String wallet) {
        return campaignRepository.findByFarmerWallet(wallet).stream()
                .map(this::toResponse).toList();
    }

    /**
     * Returns on-chain addresses needed for frontend to build a buy_tokens transaction.
     */
    public TransactionContextResponse buildBuyContext(Long id) {
        Campaign campaign = findCampaign(id);
        if (!"ACTIVE".equals(campaign.getStatus())) {
            throw new IllegalStateException("Campaign is not active");
        }
        return buildContext(campaign, "Buy context ready. Build buy_tokens transaction on frontend.");
    }

    /**
     * Records harvest confirmation after on-chain confirm_harvest transaction.
     */
    @Transactional
    public CampaignResponse confirmHarvest(Long id, ConfirmHarvestRequest request) {
        Campaign campaign = findCampaign(id);
        campaign.setStatus("HARVEST_SOLD");
        return toResponse(campaignRepository.save(campaign));
    }

    /**
     * Returns on-chain addresses needed for frontend to build a distribute transaction.
     */
    public TransactionContextResponse buildDistributeContext(Long id) {
        Campaign campaign = findCampaign(id);
        if (!"HARVEST_SOLD".equals(campaign.getStatus())) {
            throw new IllegalStateException("Campaign is not ready for distribution");
        }
        return buildContext(campaign, "Distribute context ready. Build distribute transaction on frontend.");
    }

    /**
     * Returns real holder list from recorded investments.
     */
    public List<HolderResponse> getHolders(Long id) {
        findCampaign(id); // validate campaign exists
        return investmentRepository.findByCampaignId(id).stream()
                .map(inv -> new HolderResponse(
                        inv.getInvestorWallet(),
                        inv.getTokensAmount(),
                        inv.getUsdcPaid()
                ))
                .toList();
    }

    /**
     * Updates tokensSold in DB after a confirmed buy_tokens transaction.
     */
    @Transactional
    public CampaignResponse recordTokensPurchased(Long id, long amount) {
        Campaign campaign = findCampaign(id);
        campaign.setTokensSold(campaign.getTokensSold() + amount);
        if (campaign.getTokensSold() >= campaign.getTotalSupply()) {
            campaign.setStatus("FUNDED");
        }
        return toResponse(campaignRepository.save(campaign));
    }

    /**
     * Updates campaign status to DISTRIBUTED after on-chain distribute tx.
     */
    @Transactional
    public CampaignResponse markDistributed(Long id) {
        Campaign campaign = findCampaign(id);
        campaign.setStatus("DISTRIBUTED");
        return toResponse(campaignRepository.save(campaign));
    }

    private TransactionContextResponse buildContext(Campaign campaign, String message) {
        return new TransactionContextResponse(
                solanaService.getProgramId(),
                campaign.getOnChainAddress(),
                campaign.getTokenMintAddress(),
                campaign.getVaultAddress(),
                solanaService.getUsdcMint(),
                campaign.getId(), // DB id = on-chain campaign_id
                campaign.getFarmerWallet(),
                solanaService.getOracleWallet(),
                message
        );
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
                campaign.getVaultAddress(),
                campaign.getCreatedAt(),
                campaign.getHarvestDate()
        );
    }
}
