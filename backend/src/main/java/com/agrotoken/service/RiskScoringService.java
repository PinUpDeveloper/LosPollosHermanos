package com.agrotoken.service;

import com.agrotoken.model.Campaign;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class RiskScoringService {

    private static final Logger log = LoggerFactory.getLogger(RiskScoringService.class);

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${ollama.url}")
    private String ollamaUrl;

    @Value("${ollama.model}")
    private String model;

    /**
     * Calls Ollama to score the campaign risk. Updates riskScore and riskExplanation on the entity.
     * If Ollama is unavailable, logs a warning and leaves fields null.
     */
    public void scoreRisk(Campaign campaign, int farmerCampaignCount) {
        try {
            String prompt = buildPrompt(campaign, farmerCampaignCount);

            Map<String, Object> body = Map.of(
                    "model", model,
                    "prompt", prompt,
                    "stream", false,
                    "options", Map.of("temperature", 0.3)
            );

            RequestEntity<Map<String, Object>> request = RequestEntity
                    .post(ollamaUrl + "/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body);

            String responseBody = restTemplate.exchange(request, String.class).getBody();
            JsonNode root = objectMapper.readTree(responseBody);
            String generatedText = root.path("response").asText();

            parseAndApply(generatedText, campaign);
        } catch (Exception e) {
            log.warn("Ollama risk scoring failed, skipping: {}", e.getMessage());
        }
    }

    private String buildPrompt(Campaign campaign, int farmerCampaignCount) {
        long totalFunding = campaign.getTotalSupply() * campaign.getPricePerToken() / 1_000_000;
        return """
                You are an agricultural investment risk analyst. Evaluate this campaign and assign a risk score.

                Campaign parameters:
                - Crop type: %s
                - Region: %s
                - Harvest date: %s
                - Total funding goal: %d USDC
                - Price per token: %d USDC
                - Farmer's previous campaigns: %d

                Rules:
                - Score from 1 (minimal risk) to 100 (extremely risky)
                - Consider: crop volatility, region climate reliability, time until harvest, funding size, farmer experience
                - More previous campaigns = lower risk (experienced farmer)

                Respond ONLY with valid JSON, no other text:
                {"score": <number 1-100>, "explanation": "<2 sentences in Russian explaining the risk>"}
                """.formatted(
                campaign.getCropType(),
                campaign.getRegion(),
                campaign.getHarvestDate(),
                totalFunding,
                campaign.getPricePerToken() / 1_000_000,
                farmerCampaignCount
        );
    }

    private void parseAndApply(String text, Campaign campaign) {
        try {
            // Extract JSON from response (model might wrap it in markdown code blocks)
            String json = text;
            int braceStart = text.indexOf('{');
            int braceEnd = text.lastIndexOf('}');
            if (braceStart >= 0 && braceEnd > braceStart) {
                json = text.substring(braceStart, braceEnd + 1);
            }

            JsonNode node = objectMapper.readTree(json);
            int score = node.path("score").asInt();
            String explanation = node.path("explanation").asText();

            if (score >= 1 && score <= 100 && !explanation.isBlank()) {
                campaign.setRiskScore(score);
                campaign.setRiskExplanation(explanation);
            } else {
                log.warn("Ollama returned invalid score or empty explanation: {}", text);
            }
        } catch (Exception e) {
            log.warn("Failed to parse Ollama risk response: {}", e.getMessage());
        }
    }
}
