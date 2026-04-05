package com.agrotoken.service;

import com.agrotoken.dto.CampaignResponse;
import com.agrotoken.dto.CampaignLifecycleEventResponse;
import com.agrotoken.dto.ConfirmHarvestRequest;
import com.agrotoken.dto.CreateCampaignRequest;
import com.agrotoken.dto.FarmerPassportResponse;
import com.agrotoken.dto.HolderResponse;
import com.agrotoken.dto.TransactionContextResponse;
import com.agrotoken.model.Campaign;
import com.agrotoken.repository.CampaignRepository;
import com.agrotoken.repository.InvestmentRepository;
import com.agrotoken.service.TrustScoringService.TrustScoreResult;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CampaignService {
    private final CampaignRepository campaignRepository;
    private final InvestmentRepository investmentRepository;
    private final SolanaService solanaService;
    private final RiskScoringService riskScoringService;
    private final TrustScoringService trustScoringService;
    private final FarmerPassportService farmerPassportService;

    public CampaignService(
            CampaignRepository campaignRepository,
            InvestmentRepository investmentRepository,
            SolanaService solanaService,
            RiskScoringService riskScoringService,
            TrustScoringService trustScoringService,
            FarmerPassportService farmerPassportService
    ) {
        this.campaignRepository = campaignRepository;
        this.investmentRepository = investmentRepository;
        this.solanaService = solanaService;
        this.riskScoringService = riskScoringService;
        this.trustScoringService = trustScoringService;
        this.farmerPassportService = farmerPassportService;
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
        campaign.setProofStatus("UPLOADED");
        campaign.setProofUploadedAt(LocalDateTime.now());
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

        // AI Risk Scoring via Ollama
        int farmerHistory = campaignRepository.findByFarmerWallet(request.farmerWallet()).size();
        riskScoringService.scoreRisk(saved, farmerHistory);

        return toResponse(campaignRepository.save(saved));
    }

    @Transactional
    public CampaignResponse rescoreRisk(Long id) {
        Campaign campaign = findCampaign(id);
        int farmerHistory = campaignRepository.findByFarmerWallet(campaign.getFarmerWallet()).size();
        riskScoringService.scoreRisk(campaign, farmerHistory);
        return toResponse(campaignRepository.save(campaign));
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
        campaign.setHarvestConfirmedAt(LocalDateTime.now());
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
        long previousSold = campaign.getTokensSold();
        long updatedSold = previousSold + amount;
        campaign.setTokensSold(updatedSold);

        markFundingMilestones(campaign, previousSold, updatedSold);

        if (updatedSold >= campaign.getTotalSupply()) {
            campaign.setStatus("FUNDED");
            if (campaign.getFunded100At() == null) {
                campaign.setFunded100At(LocalDateTime.now());
            }
        }
        return toResponse(campaignRepository.save(campaign));
    }

    /**
     * Oracle/verifier marks the proof-of-asset as verified or rejected.
     */
    @Transactional
    public CampaignResponse verifyProof(Long id, String verifierWallet, boolean approved) {
        Campaign campaign = findCampaign(id);
        campaign.setProofStatus(approved ? "VERIFIED" : "REJECTED");
        campaign.setProofVerifiedAt(LocalDateTime.now());
        campaign.setProofVerifierWallet(verifierWallet);
        return toResponse(campaignRepository.save(campaign));
    }

    /**
     * Updates campaign status to DISTRIBUTED after on-chain distribute tx.
     */
    @Transactional
    public CampaignResponse markDistributed(Long id) {
        Campaign campaign = findCampaign(id);
        campaign.setStatus("DISTRIBUTED");
        campaign.setDistributedAt(LocalDateTime.now());
        return toResponse(campaignRepository.save(campaign));
    }

    private void markFundingMilestones(Campaign campaign, long previousSold, long updatedSold) {
        long totalSupply = campaign.getTotalSupply();
        if (totalSupply <= 0) {
            return;
        }

        double previousRatio = (double) previousSold / totalSupply;
        double updatedRatio = (double) updatedSold / totalSupply;
        LocalDateTime now = LocalDateTime.now();

        if (campaign.getFunded25At() == null && previousRatio < 0.25 && updatedRatio >= 0.25) {
            campaign.setFunded25At(now);
        }
        if (campaign.getFunded50At() == null && previousRatio < 0.50 && updatedRatio >= 0.50) {
            campaign.setFunded50At(now);
        }
        if (campaign.getFunded100At() == null && previousRatio < 1.0 && updatedRatio >= 1.0) {
            campaign.setFunded100At(now);
        }
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
        List<Campaign> farmerCampaigns = campaignRepository.findByFarmerWallet(campaign.getFarmerWallet());
        int farmerHistory = farmerCampaigns.size();
        TrustScoreResult trustScore = trustScoringService.score(campaign, farmerHistory);
        FarmerPassportResponse farmerPassport = farmerPassportService.build(campaign.getFarmerWallet(), farmerCampaigns);

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
                campaign.getProofStatus(),
                campaign.getProofUploadedAt(),
                campaign.getProofVerifiedAt(),
                campaign.getProofVerifierWallet(),
                campaign.getTokenMintAddress(),
                campaign.getVaultAddress(),
                campaign.getCreatedAt(),
                campaign.getHarvestDate(),
                campaign.getRiskScore(),
                campaign.getRiskExplanation(),
                trustScore.trustScore(),
                trustScore.trustLabel(),
                trustScore.trustReasons(),
                farmerPassport,
                buildLifecycleEvents(campaign)
        );
    }

    private List<CampaignLifecycleEventResponse> buildLifecycleEvents(Campaign campaign) {
        List<CampaignLifecycleEventResponse> events = new ArrayList<>();

        events.add(new CampaignLifecycleEventResponse(
                "CAMPAIGN_CREATED",
                "Campaign created",
                "The farmer created the campaign and the on-chain lifecycle started.",
                campaign.getCreatedAt(),
                campaign.getCreatedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                campaign.getOnChainAddress()
        ));

        events.add(new CampaignLifecycleEventResponse(
                "PROOF_UPLOADED",
                "Proof uploaded",
                "Proof-of-asset document was attached and its hash was linked to the campaign.",
                campaign.getProofUploadedAt(),
                campaign.getProofUploadedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                campaign.getProofHash()
        ));

        events.add(new CampaignLifecycleEventResponse(
                "PROOF_VERIFIED",
                "Oracle verified proof",
                "The oracle or verifier confirmed that the uploaded proof matches the real-world asset.",
                campaign.getProofVerifiedAt(),
                "VERIFIED".equals(campaign.getProofStatus()),
                campaign.getProofVerifierWallet(),
                campaign.getProofVerifierWallet(),
                campaign.getProofHash()
        ));

        events.add(new CampaignLifecycleEventResponse(
                "FUNDED_25",
                "25% funded",
                "The campaign passed the first investor traction milestone.",
                campaign.getFunded25At(),
                campaign.getFunded25At() != null,
                null,
                campaign.getOnChainAddress(),
                "25%"
        ));

        events.add(new CampaignLifecycleEventResponse(
                "FUNDED_50",
                "50% funded",
                "The campaign reached the midpoint of its funding target.",
                campaign.getFunded50At(),
                campaign.getFunded50At() != null,
                null,
                campaign.getOnChainAddress(),
                "50%"
        ));

        events.add(new CampaignLifecycleEventResponse(
                "FUNDED_100",
                "100% funded",
                "The campaign fully sold its tokenized funding allocation.",
                campaign.getFunded100At(),
                campaign.getFunded100At() != null,
                null,
                campaign.getOnChainAddress(),
                "100%"
        ));

        events.add(new CampaignLifecycleEventResponse(
                "HARVEST_CONFIRMED",
                "Harvest confirmed",
                "The harvest result was confirmed and the campaign moved toward payout.",
                campaign.getHarvestConfirmedAt(),
                campaign.getHarvestConfirmedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                null
        ));

        events.add(new CampaignLifecycleEventResponse(
                "PAYOUT_DISTRIBUTED",
                "Payout distributed",
                "Revenue distribution for token holders was finalized.",
                campaign.getDistributedAt(),
                campaign.getDistributedAt() != null,
                campaign.getFarmerWallet(),
                campaign.getOnChainAddress(),
                campaign.getVaultAddress()
        ));

        return events;
    }
}
