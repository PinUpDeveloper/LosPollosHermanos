package com.agrotoken.service;

import com.agrotoken.dto.InvestmentResponse;
import com.agrotoken.model.Investment;
import com.agrotoken.repository.InvestmentRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InvestmentService {
    private final InvestmentRepository investmentRepository;

    public InvestmentService(InvestmentRepository investmentRepository) {
        this.investmentRepository = investmentRepository;
    }

    public List<InvestmentResponse> getPortfolio(String wallet) {
        return investmentRepository.findByInvestorWallet(wallet).stream().map(this::toResponse).toList();
    }

    @Transactional
    public InvestmentResponse recordInvestment(Long campaignId, String investorWallet, long tokensAmount, long usdcPaid, String txSignature) {
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
                investment.getCreatedAt()
        );
    }
}

