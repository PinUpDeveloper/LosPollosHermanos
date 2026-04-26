package com.agrotoken.repository;

import com.agrotoken.model.Campaign;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    List<Campaign> findByStatus(String status);

    List<Campaign> findByFarmerWallet(String farmerWallet);
}
