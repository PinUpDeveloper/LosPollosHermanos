# AgroToken

AgroToken is a hackathon MVP for tokenizing future agricultural harvests on Solana devnet. Farmers create campaigns backed by proof documents, investors buy fractional harvest shares with a mock USDC token, and profits are later distributed proportionally to token holders.

## Stack

- Anchor / Rust smart contract in [`programs/agrotoken`](/C:/Users/Marsel/Desktop/LosPollosHermanos/programs/agrotoken)
- Spring Boot 3 / Java 21 backend in [`backend`](/C:/Users/Marsel/Desktop/LosPollosHermanos/backend)
- Next.js / TypeScript frontend in [`frontend`](/C:/Users/Marsel/Desktop/LosPollosHermanos/frontend)
- PostgreSQL via [`docker-compose.yml`](/C:/Users/Marsel/Desktop/LosPollosHermanos/docker-compose.yml)

## Repo layout

```text
programs/agrotoken   Anchor program
backend              REST API + PostgreSQL metadata
frontend             Marketplace and dashboards
tests                Anchor integration test skeleton
migrations           Anchor deploy script
```

## Local setup

1. Start Postgres: `docker compose up -d postgres`
2. Run backend: `./mvnw spring-boot:run` from `backend`
3. Run frontend: `npm install && npm run dev` from `frontend`
4. Run Anchor tests: `anchor test`

## Notes

- The smart contract is written for devnet and uses deterministic PDAs.
- The backend currently returns unsigned transaction payload placeholders for wallet-signing flow integration.
- The frontend uses Russian UI copy as requested for the Kazakhstan market.

