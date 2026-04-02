package com.agrotoken.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class Campaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String onChainAddress;
    private String farmerWallet;
    private String title;
    private String description;
    private String cropType;
    private String region;
    private Long totalSupply;
    private Long tokensSold;
    private Long pricePerToken;
    private String status;
    private String proofDocumentUrl;
    private String proofHash;
    private String proofStatus;          // PENDING, UPLOADED, VERIFIED, REJECTED
    private LocalDateTime proofUploadedAt;
    private LocalDateTime proofVerifiedAt;
    private String proofVerifierWallet;
    private String tokenMintAddress;
    private String vaultAddress;
    private LocalDateTime createdAt;
    private LocalDateTime harvestDate;
}

