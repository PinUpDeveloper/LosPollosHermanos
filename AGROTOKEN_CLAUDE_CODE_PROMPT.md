# AgroToken — Claude Code Project Prompt

## CONTEXT

You are building **AgroToken** — a platform for tokenizing future agricultural harvests on Solana blockchain for the **National Solana Hackathon by Decentrathon** (deadline: April 7, 2026).

**Core idea:** Kazakh farmers tokenize their future harvest (e.g. 100 tons of wheat). Investors buy fractional token shares with USDC. When the harvest is sold, the smart contract automatically distributes profits to all token holders proportionally, then burns the tokens.

**Target market:** Kazakhstan — agricultural country where farmers lack access to micro-investments, and urban investors have no access to agricultural assets.

---

## TECH STACK

| Layer | Technology |
|---|---|
| Smart Contract | **Anchor (Rust)** on Solana — devnet |
| Backend | **Java 21 + Spring Boot 3** — REST API, TX building, business logic |
| Database | **PostgreSQL** — campaigns, users, metadata |
| Frontend | **React + Next.js + TypeScript** — marketplace, dashboards |
| Wallet | **Phantom** via `@solana/wallet-adapter` |
| Token standard | **SPL Token** (fungible) for harvest shares |
| Stablecoin | **USDC (devnet mock)** for payments and distributions |
| Build tools | Anchor CLI, Maven/Gradle, npm/yarn |

---

## ARCHITECTURE OVERVIEW

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Farmer    │  │  Investor   │  │   Oracle    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────────────────────────────────────┐
│     Frontend (React / Next.js / TypeScript)  │
│  Marketplace, Dashboard, Phantom Wallet      │
└──────────────────────┬───────────────────────┘
                       │ REST API
                       ▼
┌──────────────────────────────────────────────┐
│     Backend (Java 21 / Spring Boot 3)        │
│  Campaign CRUD, TX Builder, Auth, Metadata   │
├─────────────┬────────────────────────────────┤
│ PostgreSQL  │  Solana RPC (devnet)           │
│ campaigns   │  solanaj / sol4k               │
│ users       │  send transactions             │
│ metadata    │  read accounts                 │
└─────────────┴────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│     Solana Program (Anchor / Rust)           │
│                                              │
│  Instructions:                               │
│  • create_campaign  — init campaign PDA      │
│  • mint_tokens      — SPL mint to investors  │
│  • buy_tokens       — USDC → vault, get SPL  │
│  • confirm_harvest  — oracle marks sold      │
│  • distribute       — USDC → all holders     │
│  • burn_tokens      — cleanup after dist.    │
│                                              │
│  Accounts (PDAs):                            │
│  • CampaignState    — metadata, status       │
│  • Vault            — holds USDC escrow      │
│  • TokenMint        — SPL token mint         │
└──────────────────────────────────────────────┘
```

---

## SMART CONTRACT (Anchor / Rust)

### Directory: `/programs/agrotoken/`

### Program accounts (PDAs):

```rust
#[account]
pub struct Campaign {
    pub farmer: Pubkey,           // farmer wallet
    pub title: String,            // "Wheat Harvest 2026"
    pub description: String,      // details
    pub total_supply: u64,        // total tokens to mint (e.g. 1000)
    pub tokens_sold: u64,         // how many sold so far
    pub price_per_token: u64,     // price in USDC lamports (6 decimals)
    pub vault: Pubkey,            // USDC escrow vault
    pub token_mint: Pubkey,       // SPL token mint address
    pub status: CampaignStatus,   // Active, Funded, HarvestSold, Distributed
    pub harvest_total_usdc: u64,  // actual revenue from harvest sale
    pub proof_hash: [u8; 32],     // SHA-256 of off-chain documents
    pub created_at: i64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum CampaignStatus {
    Active,        // accepting investments
    Funded,        // fully funded, farming in progress
    HarvestSold,   // oracle confirmed, ready to distribute
    Distributed,   // profits sent, tokens burned
    Cancelled,     // campaign cancelled, refunds
}
```

### Instructions to implement:

1. **`create_campaign`** — Farmer creates a new campaign
   - Init Campaign PDA (seeds: `[b"campaign", farmer.key, campaign_id]`)
   - Create SPL Token Mint (decimals: 0, authority: program PDA)
   - Create USDC Vault (token account owned by program PDA)
   - Store metadata, proof_hash, pricing

2. **`buy_tokens`** — Investor buys token shares
   - Transfer USDC from investor → vault
   - Mint SPL tokens to investor's associated token account
   - Update `tokens_sold`
   - If `tokens_sold == total_supply` → status = Funded

3. **`confirm_harvest`** — Oracle/farmer confirms harvest sale
   - Only callable by farmer or designated oracle
   - Set `harvest_total_usdc` (actual revenue)
   - Transfer actual USDC revenue into vault (or update accounting)
   - Status → HarvestSold

4. **`distribute`** — Distribute profits to all holders
   - Iterate through token holders (use remaining_accounts)
   - Calculate each holder's share: `(holder_tokens / total_supply) * harvest_total_usdc`
   - Transfer USDC from vault to each holder
   - Status → Distributed

5. **`burn_tokens`** — Burn all tokens after distribution
   - Burn SPL tokens from each holder
   - Close mint account

6. **`cancel_campaign`** — Emergency cancel (optional, for MVP)
   - Only by farmer, only if status = Active
   - Refund all investors from vault
   - Status → Cancelled

### Key constraints:
- Use `#[access_control]` for role checks (farmer-only, oracle-only)
- All amounts in USDC lamports (6 decimals)
- SPL tokens with 0 decimals (1 token = 1 share)
- Campaign PDA seeds must be deterministic
- Vault is a PDA-owned token account (not ATA of farmer)

---

## BACKEND (Java 21 / Spring Boot 3)

### Directory: `/backend/`

### Dependencies:
```xml
<!-- Key dependencies -->
spring-boot-starter-web
spring-boot-starter-data-jpa
spring-boot-starter-validation
postgresql (driver)
solanaj (or sol4k) — Solana Java SDK
lombok
springdoc-openapi (Swagger)
```

### Database entities:

```java
@Entity
public class Campaign {
    @Id @GeneratedValue
    private Long id;
    private String onChainAddress;     // Solana campaign PDA
    private String farmerWallet;
    private String title;
    private String description;
    private String cropType;           // wheat, barley, rice...
    private String region;             // Akmola, Kostanay...
    private Long totalSupply;
    private Long tokensSold;
    private Long pricePerToken;        // in USDC lamports
    private String status;
    private String proofDocumentUrl;   // IPFS or S3 link
    private String proofHash;          // SHA-256
    private String tokenMintAddress;
    private LocalDateTime createdAt;
    private LocalDateTime harvestDate;  // expected harvest
}

@Entity
public class Investment {
    @Id @GeneratedValue
    private Long id;
    private Long campaignId;
    private String investorWallet;
    private Long tokensAmount;
    private Long usdcPaid;
    private String txSignature;       // Solana TX hash
    private LocalDateTime createdAt;
}
```

### REST API endpoints:

```
POST   /api/campaigns              — create campaign (calls Solana create_campaign)
GET    /api/campaigns              — list all active campaigns (marketplace)
GET    /api/campaigns/{id}         — campaign details
GET    /api/campaigns/farmer/{wallet} — farmer's campaigns
POST   /api/campaigns/{id}/buy     — buy tokens (build TX for frontend to sign)
POST   /api/campaigns/{id}/confirm — confirm harvest sale
POST   /api/campaigns/{id}/distribute — trigger distribution
GET    /api/investments/{wallet}   — investor's portfolio
GET    /api/campaigns/{id}/holders — list token holders
```

### Solana integration service:

```java
@Service
public class SolanaService {
    // Connect to devnet RPC
    // Build unsigned transactions for frontend to sign via Phantom
    // Read on-chain account data (campaign state, token balances)
    // Verify transaction signatures
    
    public Transaction buildBuyTokensTx(String campaignPda, String investorWallet, long amount);
    public Transaction buildConfirmHarvestTx(String campaignPda, long revenue);
    public Transaction buildDistributeTx(String campaignPda);
    public CampaignState readCampaignState(String campaignPda);
}
```

### Key patterns:
- Backend builds unsigned transactions → frontend signs with Phantom → backend submits
- Campaign metadata stored in PostgreSQL (faster reads, search, filtering)
- On-chain state is source of truth for balances and status
- Use `@Transactional` for DB operations
- Validate all inputs with Bean Validation
- Return proper error responses with problem details

---

## FRONTEND (React / Next.js / TypeScript)

### Directory: `/frontend/`

### Key dependencies:
```json
"@solana/web3.js": "^1.x",
"@solana/wallet-adapter-react": "^0.15.x",
"@solana/wallet-adapter-phantom": "^0.9.x",
"@solana/spl-token": "^0.3.x",
"tailwindcss": "^3.x",
"axios": "^1.x"
```

### Pages:

1. **`/` — Landing / Marketplace**
   - Hero section with pitch
   - Grid of active campaigns (cards with: crop, region, progress bar, price)
   - Filter by crop type, region, status
   - Connect Wallet button (Phantom)

2. **`/campaign/[id]` — Campaign Details**
   - Full campaign info: description, farmer, crop, region, expected harvest date
   - Progress bar: tokens sold / total
   - Proof-of-asset section (document hash, link)
   - "Buy Tokens" button → opens modal → amount input → sign with Phantom
   - Token holders list
   - Status timeline (Active → Funded → HarvestSold → Distributed)

3. **`/farmer/dashboard` — Farmer Dashboard**
   - "Create Campaign" form
   - List of farmer's campaigns
   - "Confirm Harvest" button (when harvest sold)
   - "Distribute" button (after confirmation)
   - Revenue stats

4. **`/investor/dashboard` — Investor Dashboard**
   - Portfolio: owned tokens across campaigns
   - Investment history
   - Pending distributions
   - Total invested / total returns

### Wallet integration flow:
```typescript
// 1. User clicks "Buy Tokens"
// 2. Frontend calls backend: POST /api/campaigns/{id}/buy
// 3. Backend returns unsigned transaction (base64)
// 4. Frontend deserializes TX and asks Phantom to sign:
const tx = Transaction.from(Buffer.from(base64Tx, 'base64'));
const signed = await wallet.signTransaction(tx);
// 5. Frontend sends signed TX to Solana RPC
const sig = await connection.sendRawTransaction(signed.serialize());
// 6. Frontend confirms: POST /api/investments with txSignature
```

### UI/UX requirements:
- Clean, professional design (Tailwind CSS)
- Mobile responsive
- Loading states for all blockchain operations
- Toast notifications for TX success/failure
- Campaign cards show: crop emoji/icon, region, funding progress %, APY estimate
- Color scheme: earth tones (green, amber, brown) — agricultural theme

---

## PROJECT STRUCTURE

```
agrotoken/
├── programs/
│   └── agrotoken/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs              — program entry, declare_id
│           ├── instructions/
│           │   ├── mod.rs
│           │   ├── create_campaign.rs
│           │   ├── buy_tokens.rs
│           │   ├── confirm_harvest.rs
│           │   ├── distribute.rs
│           │   └── cancel.rs
│           ├── state/
│           │   ├── mod.rs
│           │   └── campaign.rs     — Campaign account struct
│           └── errors.rs           — custom error codes
├── backend/
│   └── src/main/java/com/agrotoken/
│       ├── AgroTokenApplication.java
│       ├── config/
│       │   └── SolanaConfig.java
│       ├── controller/
│       │   ├── CampaignController.java
│       │   └── InvestmentController.java
│       ├── service/
│       │   ├── CampaignService.java
│       │   ├── SolanaService.java
│       │   └── InvestmentService.java
│       ├── repository/
│       │   ├── CampaignRepository.java
│       │   └── InvestmentRepository.java
│       ├── model/
│       │   ├── Campaign.java
│       │   └── Investment.java
│       ├── dto/
│       │   ├── CreateCampaignRequest.java
│       │   ├── BuyTokensRequest.java
│       │   └── CampaignResponse.java
│       └── exception/
│           └── GlobalExceptionHandler.java
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            — marketplace
│   │   │   ├── campaign/[id]/page.tsx
│   │   │   ├── farmer/dashboard/page.tsx
│   │   │   └── investor/dashboard/page.tsx
│   │   ├── components/
│   │   │   ├── CampaignCard.tsx
│   │   │   ├── BuyTokenModal.tsx
│   │   │   ├── WalletProvider.tsx
│   │   │   ├── StatusTimeline.tsx
│   │   │   └── Navbar.tsx
│   │   ├── hooks/
│   │   │   ├── useSolana.ts
│   │   │   └── useCampaigns.ts
│   │   └── lib/
│   │       ├── api.ts              — axios instance
│   │       └── solana.ts           — connection, helpers
│   ├── tailwind.config.ts
│   └── package.json
├── tests/
│   └── agrotoken.ts                — Anchor integration tests
├── migrations/
│   └── deploy.ts
├── Anchor.toml
├── docker-compose.yml              — PostgreSQL + backend
├── README.md
└── .gitignore
```

---

## STEP-BY-STEP BUILD ORDER

Follow this order strictly. Each step should produce working, testable code.

### Phase 1: Smart Contract (Days 1-3)
1. `anchor init agrotoken` — scaffold project
2. Define `Campaign` account struct in `state/campaign.rs`
3. Implement `create_campaign` instruction
4. Implement `buy_tokens` instruction
5. Implement `confirm_harvest` instruction  
6. Implement `distribute` instruction
7. Write Anchor tests for each instruction
8. Deploy to Solana devnet: `anchor deploy --provider.cluster devnet`
9. Save program ID

### Phase 2: Backend (Days 3-5)
1. `spring init` with Web, JPA, PostgreSQL, Validation
2. Set up `docker-compose.yml` with PostgreSQL
3. Create entities: Campaign, Investment
4. Create repositories, services, controllers
5. Implement `SolanaService` — connect to devnet, read accounts, build TXs
6. Wire up all REST endpoints
7. Test with Postman / curl
8. Add Swagger docs (`springdoc-openapi`)

### Phase 3: Frontend (Days 5-7)
1. `npx create-next-app` with TypeScript + Tailwind
2. Set up Phantom wallet adapter
3. Build Marketplace page (campaign grid)
4. Build Campaign Detail page with Buy flow
5. Build Farmer Dashboard with Create + Confirm + Distribute
6. Build Investor Dashboard with portfolio view
7. Connect all API calls to backend
8. Test full E2E flow on devnet

### Phase 4: Polish (Days 7-9)
1. Full E2E testing: create → buy → confirm → distribute
2. Error handling everywhere
3. Loading states, toast notifications
4. Mobile responsiveness
5. README.md with screenshots, architecture diagram, setup instructions
6. Record demo video (2-3 minutes)
7. Prepare pitch deck (5-7 slides)
8. Deploy: backend to Railway/Render, frontend to Vercel

### Phase 5: Submit (Day 9 = April 7)
1. Push everything to GitHub (clean commits)
2. Submit to Google Forms
3. Submit to Colosseum (CRITICAL — without this, work is disqualified)

---

## PROOF-OF-ASSET MECHANISM

For the hackathon MVP, implement a simplified proof-of-asset:

1. **Document hashing:** Farmer uploads land ownership docs, crop photos → backend computes SHA-256 hash → hash stored on-chain in `Campaign.proof_hash`
2. **Oracle confirmation:** A designated wallet (mock oracle) calls `confirm_harvest` with the actual sale amount. In production this would be a real oracle (Chainlink/Switchboard), but for MVP a trusted wallet is enough.
3. **Verification:** Anyone can verify the document hash matches on-chain data.

---

## IMPORTANT NOTES

- **Solana devnet only** — never use mainnet for hackathon
- **USDC mock** — create a custom SPL token that acts as USDC on devnet
- **All transactions must be real on-chain** — no fake/simulated blockchain
- **The smart contract must be deployed** — this is a hard requirement
- **Keep it simple** — working MVP > feature-rich broken app
- **Git commits** — commit often with meaningful messages
- **README** — must include: setup instructions, architecture diagram, demo link, team info
- **Use English** for all code, comments, variable names, API docs
- **Use Russian** for UI text and campaign content (Kazakh market)

---

## EXAMPLE USER FLOW FOR DEMO

```
1. Farmer "Askar" connects Phantom wallet
2. Creates campaign: "Пшеница Акмолинская, 100 тонн, сезон 2026"
   → price per token: 80 USDC, total: 1000 tokens
   → uploads land document → hash stored on-chain
3. Investor "Dana" connects wallet, browses marketplace
4. Dana buys 50 tokens for 4000 USDC
   → signs TX with Phantom → tokens appear in her wallet
5. More investors buy remaining tokens → status: "Funded"
6. Months later, harvest sold for 100,000 USDC
7. Askar clicks "Confirm Harvest" → oracle validates
8. "Distribute" triggered → Dana receives 5000 USDC (50/1000 * 100,000)
   → 25% profit on her investment
9. Tokens burned, campaign complete
```

---

## HOW TO USE THIS PROMPT

Paste this entire document as context when starting a new Claude Code session. Then give specific instructions like:

- "Set up the Anchor project and implement the create_campaign instruction"
- "Create the Spring Boot backend with campaign CRUD endpoints"
- "Build the Next.js frontend marketplace page"
- "Write Anchor tests for the buy_tokens flow"
- "Help me deploy the program to devnet"

Work in phases. Don't try to build everything at once.
