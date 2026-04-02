import {
  PublicKey,
  TransactionInstruction,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Connection,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

// ---------------------------------------------------------------------------
// Anchor discriminator — first 8 bytes of SHA-256("global:<instruction_name>")
// ---------------------------------------------------------------------------

async function anchorDiscriminator(name: string): Promise<Buffer> {
  const data = new TextEncoder().encode(`global:${name}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(new Uint8Array(hash).slice(0, 8));
}

// ---------------------------------------------------------------------------
// Borsh helpers
// ---------------------------------------------------------------------------

function writeU64LE(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function writeBorshString(s: string): Buffer {
  const bytes = Buffer.from(s, "utf-8");
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length);
  return Buffer.concat([len, bytes]);
}

function writePubkey(pk: PublicKey): Buffer {
  return pk.toBuffer();
}

// ---------------------------------------------------------------------------
// ATA helper — get or create associated token account
// ---------------------------------------------------------------------------

export async function getOrCreateATA(
  connection: Connection,
  payer: PublicKey,
  mint: PublicKey,
  owner: PublicKey
): Promise<{ address: PublicKey; instruction: TransactionInstruction | null }> {
  const ata = await getAssociatedTokenAddress(mint, owner);
  const info = await connection.getAccountInfo(ata);
  if (info) {
    return { address: ata, instruction: null };
  }
  return {
    address: ata,
    instruction: createAssociatedTokenAccountInstruction(payer, ata, owner, mint),
  };
}

// ---------------------------------------------------------------------------
// create_campaign
// ---------------------------------------------------------------------------

export interface CreateCampaignParams {
  farmer: PublicKey;
  oracle: PublicKey;
  usdcMint: PublicKey;
  programId: PublicKey;
  campaignId: number;
  title: string;
  description: string;
  totalSupply: number;
  pricePerToken: number;
  proofHash: Uint8Array; // 32 bytes
}

export async function buildCreateCampaignTx(
  params: CreateCampaignParams
): Promise<{ tx: Transaction; campaignPda: PublicKey; tokenMint: PublicKey; vault: PublicKey }> {
  const {
    farmer, oracle, usdcMint, programId,
    campaignId, title, description, totalSupply, pricePerToken, proofHash,
  } = params;

  const idBytes = writeU64LE(campaignId);

  const [campaignPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), farmer.toBuffer(), idBytes],
    programId
  );
  const [tokenMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_mint"), campaignPda.toBuffer()],
    programId
  );
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), campaignPda.toBuffer()],
    programId
  );

  const disc = await anchorDiscriminator("create_campaign");

  // Borsh: campaign_id (u64) + CreateCampaignInput struct
  const inputData = Buffer.concat([
    writePubkey(oracle),
    writeBorshString(title),
    writeBorshString(description),
    writeU64LE(totalSupply),
    writeU64LE(pricePerToken),
    Buffer.from(proofHash.slice(0, 32)),
  ]);

  const data = Buffer.concat([disc, idBytes, inputData]);

  const ix = new TransactionInstruction({
    keys: [
      { pubkey: farmer, isSigner: true, isWritable: true },
      { pubkey: campaignPda, isSigner: false, isWritable: true },
      { pubkey: usdcMint, isSigner: false, isWritable: false },
      { pubkey: tokenMint, isSigner: false, isWritable: true },
      { pubkey: vault, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId,
    data,
  });

  const tx = new Transaction().add(ix);
  return { tx, campaignPda, tokenMint, vault };
}

// ---------------------------------------------------------------------------
// buy_tokens
// ---------------------------------------------------------------------------

export interface BuyTokensParams {
  investor: PublicKey;
  campaignPda: PublicKey;
  investorUsdcAccount: PublicKey;
  investorTokenAccount: PublicKey;
  vault: PublicKey;
  tokenMint: PublicKey;
  programId: PublicKey;
  amount: number;
}

export async function buildBuyTokensIx(params: BuyTokensParams): Promise<TransactionInstruction> {
  const disc = await anchorDiscriminator("buy_tokens");
  const data = Buffer.concat([disc, writeU64LE(params.amount)]);

  return new TransactionInstruction({
    keys: [
      { pubkey: params.investor, isSigner: true, isWritable: true },
      { pubkey: params.campaignPda, isSigner: false, isWritable: true },
      { pubkey: params.investorUsdcAccount, isSigner: false, isWritable: true },
      { pubkey: params.investorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      { pubkey: params.tokenMint, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    programId: params.programId,
    data,
  });
}

// ---------------------------------------------------------------------------
// confirm_harvest
// ---------------------------------------------------------------------------

export interface ConfirmHarvestParams {
  authority: PublicKey;
  campaignPda: PublicKey;
  programId: PublicKey;
  harvestTotalUsdc: number;
}

export async function buildConfirmHarvestIx(params: ConfirmHarvestParams): Promise<TransactionInstruction> {
  const disc = await anchorDiscriminator("confirm_harvest");
  const data = Buffer.concat([disc, writeU64LE(params.harvestTotalUsdc)]);

  return new TransactionInstruction({
    keys: [
      { pubkey: params.authority, isSigner: true, isWritable: true },
      { pubkey: params.campaignPda, isSigner: false, isWritable: true },
    ],
    programId: params.programId,
    data,
  });
}

// ---------------------------------------------------------------------------
// distribute
// ---------------------------------------------------------------------------

export interface DistributeParams {
  authority: PublicKey;
  campaignPda: PublicKey;
  tokenMint: PublicKey;
  vault: PublicKey;
  programId: PublicKey;
  holders: Array<{
    tokenAccount: PublicKey;
    usdcAccount: PublicKey;
  }>;
}

export async function buildDistributeIx(params: DistributeParams): Promise<TransactionInstruction> {
  const disc = await anchorDiscriminator("distribute");

  const remainingAccounts = params.holders.flatMap((h) => [
    { pubkey: h.tokenAccount, isSigner: false, isWritable: true },
    { pubkey: h.usdcAccount, isSigner: false, isWritable: true },
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: params.authority, isSigner: true, isWritable: true },
      { pubkey: params.campaignPda, isSigner: false, isWritable: true },
      { pubkey: params.tokenMint, isSigner: false, isWritable: false },
      { pubkey: params.vault, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ...remainingAccounts,
    ],
    programId: params.programId,
    data: disc,
  });
}
