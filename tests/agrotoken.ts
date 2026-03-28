import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";

describe("agrotoken", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  it("bootstraps the test environment", async () => {
    if (!provider.wallet.publicKey) {
      throw new Error("Wallet is not configured");
    }
  });
});
