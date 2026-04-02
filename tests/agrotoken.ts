import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorError, BN } from "@coral-xyz/anchor";
import { Agrotoken } from "../target/types/agrotoken";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const USDC_DECIMALS = 6;
const ONE_USDC = 1_000_000; // 10^6

interface TestEnv {
  provider: anchor.AnchorProvider;
  program: Program<Agrotoken>;
  farmer: Keypair;
  oracle: Keypair;
  investor: Keypair;
  investor2: Keypair;
  usdcMint: PublicKey;
}

async function airdrop(
  provider: anchor.AnchorProvider,
  to: PublicKey,
  lamports = 10 * LAMPORTS_PER_SOL
) {
  const sig = await provider.connection.requestAirdrop(to, lamports);
  await provider.connection.confirmTransaction(sig, "confirmed");
}

async function setupEnv(): Promise<TestEnv> {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Agrotoken as Program<Agrotoken>;

  const farmer = Keypair.generate();
  const oracle = Keypair.generate();
  const investor = Keypair.generate();
  const investor2 = Keypair.generate();

  // Fund all wallets
  await Promise.all([
    airdrop(provider, farmer.publicKey),
    airdrop(provider, oracle.publicKey),
    airdrop(provider, investor.publicKey),
    airdrop(provider, investor2.publicKey),
  ]);

  // Create a mock USDC mint (6 decimals) owned by provider wallet
  const usdcMint = await createMint(
    provider.connection,
    farmer,
    farmer.publicKey, // mint authority
    null,
    USDC_DECIMALS
  );

  return { provider, program, farmer, oracle, investor, investor2, usdcMint };
}

function deriveCampaignPda(
  programId: PublicKey,
  farmer: PublicKey,
  campaignId: BN
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("campaign"),
      farmer.toBuffer(),
      campaignId.toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
}

function deriveTokenMintPda(
  programId: PublicKey,
  campaignPda: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("token_mint"), campaignPda.toBuffer()],
    programId
  );
}

function deriveVaultPda(
  programId: PublicKey,
  campaignPda: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), campaignPda.toBuffer()],
    programId
  );
}

function makeProofHash(): number[] {
  const hash = new Array(32).fill(0);
  hash[0] = 0xab;
  hash[31] = 0xcd;
  return hash;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("agrotoken", () => {
  let env: TestEnv;

  // Shared state across test lifecycle
  let campaignId: BN;
  let campaignPda: PublicKey;
  let campaignBump: number;
  let tokenMintPda: PublicKey;
  let vaultPda: PublicKey;

  // Token accounts for investors
  let investorUsdcAccount: PublicKey;
  let investorTokenAccount: PublicKey;
  let investor2UsdcAccount: PublicKey;
  let investor2TokenAccount: PublicKey;

  const TOTAL_SUPPLY = new BN(100);
  const PRICE_PER_TOKEN = new BN(10 * ONE_USDC); // 10 USDC per token

  before(async () => {
    env = await setupEnv();
    campaignId = new BN(1);

    [campaignPda, campaignBump] = deriveCampaignPda(
      env.program.programId,
      env.farmer.publicKey,
      campaignId
    );
    [tokenMintPda] = deriveTokenMintPda(env.program.programId, campaignPda);
    [vaultPda] = deriveVaultPda(env.program.programId, campaignPda);
  });

  // =======================================================================
  // 1. create_campaign
  // =======================================================================
  describe("create_campaign", () => {
    it("creates a campaign with correct PDA, mint, and vault", async () => {
      const proofHash = makeProofHash();

      await env.program.methods
        .createCampaign(campaignId, {
          oracle: env.oracle.publicKey,
          title: "Wheat Harvest 2026",
          description: "Premium wheat from Akmola region",
          totalSupply: TOTAL_SUPPLY,
          pricePerToken: PRICE_PER_TOKEN,
          proofHash: proofHash,
        })
        .accounts({
          farmer: env.farmer.publicKey,
          campaign: campaignPda,
          usdcMint: env.usdcMint,
          tokenMint: tokenMintPda,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([env.farmer])
        .rpc();

      // Verify on-chain state
      const campaign = await env.program.account.campaign.fetch(campaignPda);
      expect(campaign.farmer.toBase58()).to.equal(
        env.farmer.publicKey.toBase58()
      );
      expect(campaign.oracle.toBase58()).to.equal(
        env.oracle.publicKey.toBase58()
      );
      expect(campaign.campaignId.toNumber()).to.equal(1);
      expect(campaign.title).to.equal("Wheat Harvest 2026");
      expect(campaign.description).to.equal(
        "Premium wheat from Akmola region"
      );
      expect(campaign.totalSupply.toNumber()).to.equal(100);
      expect(campaign.tokensSold.toNumber()).to.equal(0);
      expect(campaign.pricePerToken.toNumber()).to.equal(10 * ONE_USDC);
      expect(campaign.vault.toBase58()).to.equal(vaultPda.toBase58());
      expect(campaign.tokenMint.toBase58()).to.equal(tokenMintPda.toBase58());
      expect(campaign.status).to.deep.equal({ active: {} });
      expect(campaign.harvestTotalUsdc.toNumber()).to.equal(0);
      expect(campaign.bump).to.equal(campaignBump);

      // Verify token mint: 0 decimals, authority = campaign PDA
      const mintInfo = await getAccount(env.provider.connection, tokenMintPda).catch(
        () => null
      );
      // Use raw mint account to check decimals
      const mintAccountInfo = await env.provider.connection.getAccountInfo(
        tokenMintPda
      );
      expect(mintAccountInfo).to.not.be.null;

      // Verify vault exists and is USDC-denominated
      const vaultInfo = await getAccount(env.provider.connection, vaultPda);
      expect(vaultInfo.mint.toBase58()).to.equal(env.usdcMint.toBase58());
    });

    it("rejects title exceeding max length", async () => {
      const badCampaignId = new BN(99);
      const [badPda] = deriveCampaignPda(
        env.program.programId,
        env.farmer.publicKey,
        badCampaignId
      );
      const [badMint] = deriveTokenMintPda(env.program.programId, badPda);
      const [badVault] = deriveVaultPda(env.program.programId, badPda);

      const longTitle = "A".repeat(101);

      try {
        await env.program.methods
          .createCampaign(badCampaignId, {
            oracle: env.oracle.publicKey,
            title: longTitle,
            description: "ok",
            totalSupply: TOTAL_SUPPLY,
            pricePerToken: PRICE_PER_TOKEN,
            proofHash: makeProofHash(),
          })
          .accounts({
            farmer: env.farmer.publicKey,
            campaign: badPda,
            usdcMint: env.usdcMint,
            tokenMint: badMint,
            vault: badVault,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([env.farmer])
          .rpc();
        expect.fail("Should have thrown MetadataTooLong");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "MetadataTooLong"
        );
      }
    });

    it("rejects non-6-decimal USDC mint", async () => {
      // Create a mint with 9 decimals
      const badMint = await createMint(
        env.provider.connection,
        env.farmer,
        env.farmer.publicKey,
        null,
        9
      );

      const badCampaignId = new BN(98);
      const [badPda] = deriveCampaignPda(
        env.program.programId,
        env.farmer.publicKey,
        badCampaignId
      );
      const [badTokenMint] = deriveTokenMintPda(env.program.programId, badPda);
      const [badVault] = deriveVaultPda(env.program.programId, badPda);

      try {
        await env.program.methods
          .createCampaign(badCampaignId, {
            oracle: env.oracle.publicKey,
            title: "Bad USDC",
            description: "Wrong decimals",
            totalSupply: TOTAL_SUPPLY,
            pricePerToken: PRICE_PER_TOKEN,
            proofHash: makeProofHash(),
          })
          .accounts({
            farmer: env.farmer.publicKey,
            campaign: badPda,
            usdcMint: badMint,
            tokenMint: badTokenMint,
            vault: badVault,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          })
          .signers([env.farmer])
          .rpc();
        expect.fail("Should have thrown InvalidUsdcMint");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "InvalidUsdcMint"
        );
      }
    });
  });

  // =======================================================================
  // 2. buy_tokens
  // =======================================================================
  describe("buy_tokens", () => {
    before(async () => {
      // Create USDC accounts for investors and fund them
      investorUsdcAccount = await createAccount(
        env.provider.connection,
        env.investor,
        env.usdcMint,
        env.investor.publicKey
      );
      investor2UsdcAccount = await createAccount(
        env.provider.connection,
        env.investor2,
        env.usdcMint,
        env.investor2.publicKey
      );

      // Mint USDC to investors (enough to buy all tokens)
      const totalCost = 100 * 10 * ONE_USDC; // 100 tokens * 10 USDC
      await mintTo(
        env.provider.connection,
        env.farmer,
        env.usdcMint,
        investorUsdcAccount,
        env.farmer,
        totalCost
      );
      await mintTo(
        env.provider.connection,
        env.farmer,
        env.usdcMint,
        investor2UsdcAccount,
        env.farmer,
        totalCost
      );

      // Create share token accounts for investors
      investorTokenAccount = await createAccount(
        env.provider.connection,
        env.investor,
        tokenMintPda,
        env.investor.publicKey
      );
      investor2TokenAccount = await createAccount(
        env.provider.connection,
        env.investor2,
        tokenMintPda,
        env.investor2.publicKey
      );
    });

    it("investor buys 40 tokens — USDC transferred, shares minted", async () => {
      const amount = new BN(40);

      await env.program.methods
        .buyTokens(amount)
        .accounts({
          investor: env.investor.publicKey,
          campaign: campaignPda,
          investorUsdcAccount: investorUsdcAccount,
          investorTokenAccount: investorTokenAccount,
          vault: vaultPda,
          tokenMint: tokenMintPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([env.investor])
        .rpc();

      // Check campaign state
      const campaign = await env.program.account.campaign.fetch(campaignPda);
      expect(campaign.tokensSold.toNumber()).to.equal(40);
      expect(campaign.status).to.deep.equal({ active: {} }); // still active

      // Check investor received share tokens
      const tokenAcc = await getAccount(
        env.provider.connection,
        investorTokenAccount
      );
      expect(Number(tokenAcc.amount)).to.equal(40);

      // Check vault received USDC
      const vaultAcc = await getAccount(env.provider.connection, vaultPda);
      expect(Number(vaultAcc.amount)).to.equal(40 * 10 * ONE_USDC);
    });

    it("rejects zero amount", async () => {
      try {
        await env.program.methods
          .buyTokens(new BN(0))
          .accounts({
            investor: env.investor.publicKey,
            campaign: campaignPda,
            investorUsdcAccount: investorUsdcAccount,
            investorTokenAccount: investorTokenAccount,
            vault: vaultPda,
            tokenMint: tokenMintPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([env.investor])
          .rpc();
        expect.fail("Should have thrown InvalidAmount");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "InvalidAmount"
        );
      }
    });

    it("rejects buying more than remaining supply", async () => {
      // 40 already sold, trying to buy 61 more (total would be 101 > 100)
      try {
        await env.program.methods
          .buyTokens(new BN(61))
          .accounts({
            investor: env.investor.publicKey,
            campaign: campaignPda,
            investorUsdcAccount: investorUsdcAccount,
            investorTokenAccount: investorTokenAccount,
            vault: vaultPda,
            tokenMint: tokenMintPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([env.investor])
          .rpc();
        expect.fail("Should have thrown SupplyExceeded");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "SupplyExceeded"
        );
      }
    });

    it("second investor buys remaining 60 tokens — campaign becomes Funded", async () => {
      const amount = new BN(60);

      await env.program.methods
        .buyTokens(amount)
        .accounts({
          investor: env.investor2.publicKey,
          campaign: campaignPda,
          investorUsdcAccount: investor2UsdcAccount,
          investorTokenAccount: investor2TokenAccount,
          vault: vaultPda,
          tokenMint: tokenMintPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([env.investor2])
        .rpc();

      const campaign = await env.program.account.campaign.fetch(campaignPda);
      expect(campaign.tokensSold.toNumber()).to.equal(100);
      expect(campaign.status).to.deep.equal({ funded: {} });

      // Verify vault holds full amount: 100 * 10 USDC = 1000 USDC
      const vaultAcc = await getAccount(env.provider.connection, vaultPda);
      expect(Number(vaultAcc.amount)).to.equal(100 * 10 * ONE_USDC);
    });

    it("rejects buying after campaign is fully funded", async () => {
      try {
        await env.program.methods
          .buyTokens(new BN(1))
          .accounts({
            investor: env.investor.publicKey,
            campaign: campaignPda,
            investorUsdcAccount: investorUsdcAccount,
            investorTokenAccount: investorTokenAccount,
            vault: vaultPda,
            tokenMint: tokenMintPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([env.investor])
          .rpc();
        expect.fail("Should have thrown CampaignNotActive");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "CampaignNotActive"
        );
      }
    });
  });

  // =======================================================================
  // 3. confirm_harvest
  // =======================================================================
  describe("confirm_harvest", () => {
    const HARVEST_REVENUE = new BN(2000 * ONE_USDC); // 2000 USDC total revenue

    it("rejects unauthorized caller", async () => {
      const stranger = Keypair.generate();
      await airdrop(env.provider, stranger.publicKey);

      try {
        await env.program.methods
          .confirmHarvest(HARVEST_REVENUE)
          .accounts({
            authority: stranger.publicKey,
            campaign: campaignPda,
          })
          .signers([stranger])
          .rpc();
        expect.fail("Should have thrown Unauthorized");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "Unauthorized"
        );
      }
    });

    it("farmer confirms harvest — status becomes HarvestSold, revenue recorded", async () => {
      await env.program.methods
        .confirmHarvest(HARVEST_REVENUE)
        .accounts({
          authority: env.farmer.publicKey,
          campaign: campaignPda,
        })
        .signers([env.farmer])
        .rpc();

      const campaign = await env.program.account.campaign.fetch(campaignPda);
      expect(campaign.status).to.deep.equal({ harvestSold: {} });
      expect(campaign.harvestTotalUsdc.toNumber()).to.equal(2000 * ONE_USDC);
    });

    it("rejects confirm on already-harvested campaign", async () => {
      try {
        await env.program.methods
          .confirmHarvest(HARVEST_REVENUE)
          .accounts({
            authority: env.farmer.publicKey,
            campaign: campaignPda,
          })
          .signers([env.farmer])
          .rpc();
        expect.fail("Should have thrown CampaignNotFunded");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "CampaignNotFunded"
        );
      }
    });
  });

  // =======================================================================
  // 4. distribute
  // =======================================================================
  describe("distribute", () => {
    // We need USDC payout accounts for investors and fund the vault with
    // harvest revenue. The vault currently holds 1000 USDC from token sales.
    // Harvest revenue is 2000 USDC, so we need to top up the vault.

    let investorPayoutUsdc: PublicKey;
    let investor2PayoutUsdc: PublicKey;

    before(async () => {
      // Create separate payout USDC accounts (or reuse existing ones)
      // For simplicity, reuse investor USDC accounts as payout destinations
      investorPayoutUsdc = investorUsdcAccount;
      investor2PayoutUsdc = investor2UsdcAccount;

      // Fund vault with enough USDC for distribution (harvest revenue = 2000 USDC)
      // Vault currently has 1000 USDC. We need 2000 total for payouts.
      // Mint additional 1000 USDC to vault
      await mintTo(
        env.provider.connection,
        env.farmer,
        env.usdcMint,
        vaultPda,
        env.farmer,
        1000 * ONE_USDC
      );
    });

    it("rejects distribution with no holder accounts", async () => {
      try {
        await env.program.methods
          .distribute()
          .accounts({
            authority: env.farmer.publicKey,
            campaign: campaignPda,
            tokenMint: tokenMintPda,
            vault: vaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([env.farmer])
          .rpc();
        expect.fail("Should have thrown MissingHolderAccounts");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "MissingHolderAccounts"
        );
      }
    });

    it("rejects unauthorized caller", async () => {
      const stranger = Keypair.generate();
      await airdrop(env.provider, stranger.publicKey);

      try {
        await env.program.methods
          .distribute()
          .accounts({
            authority: stranger.publicKey,
            campaign: campaignPda,
            tokenMint: tokenMintPda,
            vault: vaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts([
            {
              pubkey: investorTokenAccount,
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: investorPayoutUsdc,
              isSigner: false,
              isWritable: true,
            },
          ])
          .signers([stranger])
          .rpc();
        expect.fail("Should have thrown Unauthorized");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "Unauthorized"
        );
      }
    });

    it("distributes proportional payouts to two investors", async () => {
      // Record balances before
      const inv1Before = await getAccount(
        env.provider.connection,
        investorPayoutUsdc
      );
      const inv2Before = await getAccount(
        env.provider.connection,
        investor2PayoutUsdc
      );

      await env.program.methods
        .distribute()
        .accounts({
          authority: env.farmer.publicKey,
          campaign: campaignPda,
          tokenMint: tokenMintPda,
          vault: vaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          // Investor 1: 40 tokens
          {
            pubkey: investorTokenAccount,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: investorPayoutUsdc,
            isSigner: false,
            isWritable: true,
          },
          // Investor 2: 60 tokens
          {
            pubkey: investor2TokenAccount,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: investor2PayoutUsdc,
            isSigner: false,
            isWritable: true,
          },
        ])
        .signers([env.farmer])
        .rpc();

      // Verify campaign status
      const campaign = await env.program.account.campaign.fetch(campaignPda);
      expect(campaign.status).to.deep.equal({ distributed: {} });

      // Verify payouts: harvest = 2000 USDC, supply = 100
      // Investor 1: 40/100 * 2000 = 800 USDC
      // Investor 2: 60/100 * 2000 = 1200 USDC
      const inv1After = await getAccount(
        env.provider.connection,
        investorPayoutUsdc
      );
      const inv2After = await getAccount(
        env.provider.connection,
        investor2PayoutUsdc
      );

      const inv1Received =
        Number(inv1After.amount) - Number(inv1Before.amount);
      const inv2Received =
        Number(inv2After.amount) - Number(inv2Before.amount);

      expect(inv1Received).to.equal(800 * ONE_USDC);
      expect(inv2Received).to.equal(1200 * ONE_USDC);
    });

    it("rejects distribution on already-distributed campaign", async () => {
      try {
        await env.program.methods
          .distribute()
          .accounts({
            authority: env.farmer.publicKey,
            campaign: campaignPda,
            tokenMint: tokenMintPda,
            vault: vaultPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts([
            {
              pubkey: investorTokenAccount,
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: investorUsdcAccount,
              isSigner: false,
              isWritable: true,
            },
          ])
          .signers([env.farmer])
          .rpc();
        expect.fail("Should have thrown CampaignNotReadyForDistribution");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "CampaignNotReadyForDistribution"
        );
      }
    });
  });

  // =======================================================================
  // 5. burn_tokens
  // =======================================================================
  describe("burn_tokens", () => {
    it("rejects unauthorized caller", async () => {
      const stranger = Keypair.generate();
      await airdrop(env.provider, stranger.publicKey);

      try {
        await env.program.methods
          .burnTokens()
          .accounts({
            authority: stranger.publicKey,
            campaign: campaignPda,
            tokenMint: tokenMintPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .remainingAccounts([
            {
              pubkey: investorTokenAccount,
              isSigner: false,
              isWritable: true,
            },
            {
              pubkey: env.investor.publicKey,
              isSigner: true,
              isWritable: true,
            },
          ])
          .signers([stranger, env.investor])
          .rpc();
        expect.fail("Should have thrown Unauthorized");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "Unauthorized"
        );
      }
    });

    it("rejects burn with no holder accounts", async () => {
      try {
        await env.program.methods
          .burnTokens()
          .accounts({
            authority: env.farmer.publicKey,
            campaign: campaignPda,
            tokenMint: tokenMintPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([env.farmer])
          .rpc();
        expect.fail("Should have thrown MissingHolderAccounts");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "MissingHolderAccounts"
        );
      }
    });

    it("burns tokens and closes holder accounts for both investors", async () => {
      // Verify tokens exist before burn
      const inv1TokenBefore = await getAccount(
        env.provider.connection,
        investorTokenAccount
      );
      expect(Number(inv1TokenBefore.amount)).to.equal(40);

      const inv2TokenBefore = await getAccount(
        env.provider.connection,
        investor2TokenAccount
      );
      expect(Number(inv2TokenBefore.amount)).to.equal(60);

      await env.program.methods
        .burnTokens()
        .accounts({
          authority: env.farmer.publicKey,
          campaign: campaignPda,
          tokenMint: tokenMintPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .remainingAccounts([
          // Investor 1
          {
            pubkey: investorTokenAccount,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: env.investor.publicKey,
            isSigner: true,
            isWritable: true,
          },
          // Investor 2
          {
            pubkey: investor2TokenAccount,
            isSigner: false,
            isWritable: true,
          },
          {
            pubkey: env.investor2.publicKey,
            isSigner: true,
            isWritable: true,
          },
        ])
        .signers([env.farmer, env.investor, env.investor2])
        .rpc();

      // Token accounts should be closed (fetch should fail)
      try {
        await getAccount(env.provider.connection, investorTokenAccount);
        expect.fail("Token account should have been closed");
      } catch {
        // Expected: account not found after close
      }

      try {
        await getAccount(env.provider.connection, investor2TokenAccount);
        expect.fail("Token account should have been closed");
      } catch {
        // Expected: account not found after close
      }
    });
  });

  // =======================================================================
  // 6. cancel_campaign (separate campaign)
  // =======================================================================
  describe("cancel_campaign", () => {
    let cancelCampaignPda: PublicKey;
    let cancelTokenMint: PublicKey;
    let cancelVault: PublicKey;
    const cancelCampaignId = new BN(200);

    before(async () => {
      [cancelCampaignPda] = deriveCampaignPda(
        env.program.programId,
        env.farmer.publicKey,
        cancelCampaignId
      );
      [cancelTokenMint] = deriveTokenMintPda(
        env.program.programId,
        cancelCampaignPda
      );
      [cancelVault] = deriveVaultPda(env.program.programId, cancelCampaignPda);

      // Create a fresh campaign for cancel tests
      await env.program.methods
        .createCampaign(cancelCampaignId, {
          oracle: env.oracle.publicKey,
          title: "Cancel Test Campaign",
          description: "For testing cancellation",
          totalSupply: new BN(50),
          pricePerToken: new BN(5 * ONE_USDC),
          proofHash: makeProofHash(),
        })
        .accounts({
          farmer: env.farmer.publicKey,
          campaign: cancelCampaignPda,
          usdcMint: env.usdcMint,
          tokenMint: cancelTokenMint,
          vault: cancelVault,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([env.farmer])
        .rpc();
    });

    it("rejects cancellation from non-farmer", async () => {
      try {
        await env.program.methods
          .cancelCampaign()
          .accounts({
            farmer: env.investor.publicKey,
            campaign: cancelCampaignPda,
          })
          .signers([env.investor])
          .rpc();
        expect.fail("Should have thrown Unauthorized");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "Unauthorized"
        );
      }
    });

    it("farmer cancels active campaign", async () => {
      await env.program.methods
        .cancelCampaign()
        .accounts({
          farmer: env.farmer.publicKey,
          campaign: cancelCampaignPda,
        })
        .signers([env.farmer])
        .rpc();

      const campaign = await env.program.account.campaign.fetch(
        cancelCampaignPda
      );
      expect(campaign.status).to.deep.equal({ cancelled: {} });
    });

    it("rejects cancelling already-cancelled campaign", async () => {
      try {
        await env.program.methods
          .cancelCampaign()
          .accounts({
            farmer: env.farmer.publicKey,
            campaign: cancelCampaignPda,
          })
          .signers([env.farmer])
          .rpc();
        expect.fail("Should have thrown InvalidCancelState");
      } catch (err) {
        expect((err as AnchorError).error.errorCode.code).to.equal(
          "InvalidCancelState"
        );
      }
    });
  });
});
