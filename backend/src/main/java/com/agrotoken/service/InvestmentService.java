package com.agrotoken.service;

import com.agrotoken.dto.InvestmentResponse;
import com.agrotoken.model.Campaign;
import com.agrotoken.model.Investment;
import com.agrotoken.repository.CampaignRepository;
import com.agrotoken.repository.InvestmentRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvestmentService {
    private final InvestmentRepository investmentRepository;
    private final SolanaService solanaService;
    private final CampaignRepository campaignRepository;

    public InvestmentService(InvestmentRepository investmentRepository, SolanaService solanaService,
            CampaignRepository campaignRepository) {
        this.investmentRepository = investmentRepository;
        this.solanaService = solanaService;
        this.campaignRepository = campaignRepository;
    }

    public List<InvestmentResponse> getPortfolio(String wallet) {
        return investmentRepository.findByInvestorWallet(wallet).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public InvestmentResponse recordInvestment(
            Long campaignId, String investorWallet,
            long tokensAmount, long usdcPaid, String txSignature) {
        // 1. Fetch campaign to get on-chain address
        var campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Campaign not found"));

        // 2. Verify on-chain transaction
        solanaService.verifyTransaction(txSignature, campaign.getOnChainAddress());

        // 3. Prevent duplicate records on retry
        if (investmentRepository.existsByTxSignature(txSignature)) {
            throw new IllegalStateException(
                    "Investment with tx signature %s already recorded".formatted(txSignature));
        }

        Investment investment = new Investment();
        investment.setCampaignId(campaignId);
        investment.setInvestorWallet(investorWallet);
        investment.setTokensAmount(tokensAmount);
        investment.setUsdcPaid(usdcPaid);
        investment.setTxSignature(txSignature);
        investment.setCreatedAt(LocalDateTime.now());
        return toResponse(investmentRepository.save(investment));
    }

    private InvestmentResponse toResponse(Investment investment) {
        return new InvestmentResponse(
                investment.getId(),
                investment.getCampaignId(),
                investment.getInvestorWallet(),
                investment.getTokensAmount(),
                investment.getUsdcPaid(),
                investment.getTxSignature(),
                investment.getCreatedAt());
    }
}
