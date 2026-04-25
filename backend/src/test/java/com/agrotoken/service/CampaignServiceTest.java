package com.agrotoken.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.agrotoken.dto.ConfirmHarvestRequest;
import com.agrotoken.model.Campaign;
import com.agrotoken.repository.CampaignRepository;
import com.agrotoken.repository.InvestmentRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class CampaignServiceTest {

    private CampaignRepository campaignRepository;
    private InvestmentRepository investmentRepository;
    private SolanaService solanaService;
    private RiskScoringService riskScoringService;
    private TrustScoringService trustScoringService;
    private FarmerPassportService farmerPassportService;
    private CampaignService campaignService;

    @BeforeEach
    void setUp() {
        campaignRepository = mock(CampaignRepository.class);
        investmentRepository = mock(InvestmentRepository.class);
        solanaService = mock(SolanaService.class);
        riskScoringService = mock(RiskScoringService.class);
        trustScoringService = mock(TrustScoringService.class);
        farmerPassportService = mock(FarmerPassportService.class);

        campaignService = new CampaignService(
                campaignRepository, investmentRepository, solanaService,
                riskScoringService, trustScoringService, farmerPassportService);
    }

    @Test
    void confirmHarvest_VerifiesTransaction() {
        Long id = 1L;
        String txSig = "harvestSig";
        String campaignAddress = "campaignAddr";
        ConfirmHarvestRequest request = new ConfirmHarvestRequest("wallet", 1000L, txSig);

        Campaign campaign = new Campaign();
        campaign.setId(id);
        campaign.setOnChainAddress(campaignAddress);

        when(campaignRepository.findById(id)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(any(Campaign.class))).thenReturn(campaign);

        campaignService.confirmHarvest(id, request);

        verify(solanaService).verifyTransaction(txSig, campaignAddress);
        assertEquals("HARVEST_SOLD", campaign.getStatus());
    }

    @Test
    void recordTokensPurchased_VerifiesTransaction() {
        Long id = 1L;
        String txSig = "purchaseSig";
        String campaignAddress = "campaignAddr";

        Campaign campaign = new Campaign();
        campaign.setId(id);
        campaign.setOnChainAddress(campaignAddress);
        campaign.setTokensSold(0L);
        campaign.setTotalSupply(1000L);

        when(campaignRepository.findById(id)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(any(Campaign.class))).thenReturn(campaign);

        campaignService.recordTokensPurchased(id, 100L, txSig);

        verify(solanaService).verifyTransaction(txSig, campaignAddress);
        assertEquals(100L, campaign.getTokensSold());
    }

    @Test
    void markDistributed_VerifiesTransaction() {
        Long id = 1L;
        String txSig = "distributeSig";
        String campaignAddress = "campaignAddr";

        Campaign campaign = new Campaign();
        campaign.setId(id);
        campaign.setOnChainAddress(campaignAddress);

        when(campaignRepository.findById(id)).thenReturn(Optional.of(campaign));
        when(campaignRepository.save(any(Campaign.class))).thenReturn(campaign);

        campaignService.markDistributed(id, txSig);

        verify(solanaService).verifyTransaction(txSig, campaignAddress);
        assertEquals("DISTRIBUTED", campaign.getStatus());
    }
}
