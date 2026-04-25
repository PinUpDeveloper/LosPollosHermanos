package com.agrotoken.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.agrotoken.model.Campaign;
import com.agrotoken.model.Investment;
import com.agrotoken.repository.CampaignRepository;
import com.agrotoken.repository.InvestmentRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class InvestmentServiceTest {

    private InvestmentRepository investmentRepository;
    private SolanaService solanaService;
    private CampaignRepository campaignRepository;
    private InvestmentService investmentService;

    @BeforeEach
    void setUp() {
        investmentRepository = mock(InvestmentRepository.class);
        solanaService = mock(SolanaService.class);
        campaignRepository = mock(CampaignRepository.class);
        investmentService = new InvestmentService(investmentRepository, solanaService, campaignRepository);
    }

    @Test
    void recordInvestment_VerifiesTransaction() {
        Long campaignId = 1L;
        String wallet = "investorWallet";
        String txSig = "validSig";
        String campaignAddress = "campaignAddress";

        Campaign campaign = new Campaign();
        campaign.setId(campaignId);
        campaign.setOnChainAddress(campaignAddress);

        when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
        when(investmentRepository.existsByTxSignature(txSig)).thenReturn(false);
        when(investmentRepository.save(any(Investment.class))).thenAnswer(inv -> inv.getArgument(0));

        investmentService.recordInvestment(campaignId, wallet, 100L, 1000L, txSig);

        // Crucial check: was verification called with correct params?
        verify(solanaService).verifyTransaction(txSig, campaignAddress);
        verify(investmentRepository).save(any(Investment.class));
    }

    @Test
    void recordInvestment_FailsIfVerificationFails() {
        Long campaignId = 1L;
        String wallet = "investorWallet";
        String txSig = "invalidSig";
        String campaignAddress = "campaignAddress";

        Campaign campaign = new Campaign();
        campaign.setId(campaignId);
        campaign.setOnChainAddress(campaignAddress);

        when(campaignRepository.findById(campaignId)).thenReturn(Optional.of(campaign));
        // Simulate verification failure
        doThrow(new RuntimeException("Verification failed")).when(solanaService).verifyTransaction(anyString(),
                anyString());

        assertThrows(RuntimeException.class,
                () -> investmentService.recordInvestment(campaignId, wallet, 100L, 1000L, txSig));

        // Repository should NOT be called if verification fails
        verify(investmentRepository, never()).save(any(Investment.class));
    }
}
