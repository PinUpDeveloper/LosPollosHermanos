package com.agrotoken;

import com.agrotoken.config.SolanaConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(SolanaConfig.class)
public class AgroTokenApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgroTokenApplication.class, args);
    }
}
