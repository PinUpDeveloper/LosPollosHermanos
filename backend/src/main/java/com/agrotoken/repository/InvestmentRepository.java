package com.agrotoken.repository;

import com.agrotoken.model.Investment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByInvestorWallet(String investorWallet);

    List<Investment> findByCampaignId(Long campaignId);

    boolean existsByTxSignature(String txSignature);

    Optional<Investment> findByTxSignature(String txSignature);
}
