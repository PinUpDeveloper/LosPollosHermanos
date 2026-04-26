package com.agrotoken.service;

import com.agrotoken.dto.InvestmentResponse;
import com.agrotoken.model.Investment;
import com.agrotoken.repository.InvestmentRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvestmentService {
    private static final Logger log = LoggerFactory.getLogger(InvestmentService.class);
    private final InvestmentRepository investmentRepository;
    private final SolanaService solanaService;
    private final CampaignService campaignService;

    public InvestmentService(InvestmentRepository investmentRepository, SolanaService solanaService,
            CampaignService campaignService) {
        this.investmentRepository = investmentRepository;
        this.solanaService = solanaService;
        this.campaignService = campaignService;
    }

    public List<InvestmentResponse> getPortfolio(String wallet) {
        return investmentRepository.findByInvestorWallet(wallet).stream()
                .map(this::toResponse).toList();
    }

    @Transactional
    public InvestmentResponse recordInvestment(
            Long campaignId, String investorWallet,
            long tokensAmount, long usdcPaid, String txSignature) {
        // 1. Idempotency: skip if already recorded
        var existing = investmentRepository.findByTxSignature(txSignature);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        try {
            log.info("Starting recordInvestment: campaignId={}, wallet={}, tokens={}, tx={}",
                    campaignId, investorWallet, tokensAmount, txSignature);

            // 2. Update campaign totals in DB (this includes Solana verification)
            campaignService.recordTokensPurchased(campaignId, tokensAmount, txSignature);
            log.info("Campaign totals updated for recordInvestment");

            Investment investment = new Investment();
            investment.setCampaignId(campaignId);
            investment.setInvestorWallet(investorWallet);
            investment.setTokensAmount(tokensAmount);
            investment.setUsdcPaid(usdcPaid);
            investment.setTxSignature(txSignature);
            investment.setCreatedAt(LocalDateTime.now());

            var result = toResponse(investmentRepository.save(investment));
            log.info("Investment record saved to DB: id={}", result.id());
            return result;
        } catch (Exception e) {
            log.error("CRITICAL ERROR in recordInvestment for tx {}: {}", txSignature, e.getMessage(), e);
            throw e;
        }
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
