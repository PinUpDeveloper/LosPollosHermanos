package com.agrotoken.controller;

import com.agrotoken.dto.InvestmentResponse;
import com.agrotoken.dto.RecordInvestmentRequest;
import com.agrotoken.service.InvestmentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/investments")
public class InvestmentController {
    private final InvestmentService investmentService;

    public InvestmentController(InvestmentService investmentService) {
        this.investmentService = investmentService;
    }

    @GetMapping("/{wallet}")
    public List<InvestmentResponse> getPortfolio(@PathVariable String wallet) {
        return investmentService.getPortfolio(wallet);
    }

    @PostMapping("/campaigns/{campaignId}")
    public InvestmentResponse recordInvestment(@PathVariable Long campaignId, @Valid @RequestBody RecordInvestmentRequest request) {
        return investmentService.recordInvestment(
                campaignId,
                request.investorWallet(),
                request.tokensAmount(),
                request.usdcPaid(),
                request.txSignature()
        );
    }
}
