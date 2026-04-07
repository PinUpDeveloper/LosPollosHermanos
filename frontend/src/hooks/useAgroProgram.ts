"use client";

import { useMemo } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import idl from "@/lib/anchor/idl.json";

export const PROGRAM_ID = new PublicKey("GM4oyeT5WV1mC1KVgwPMhUV4YMJw8e1i1GKkXMjYnvvY");

export function useAgroProgram() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const program = useMemo(() => {
        if (!wallet) return null;

        const provider = new AnchorProvider(connection, wallet, {
            preflightCommitment: "processed",
        });

        return new Program(idl as Idl, provider);
    }, [connection, wallet]);

    const getCampaignPdAs = (farmer: PublicKey, id: number) => {
        const idBuffer = Buffer.alloc(8);
        idBuffer.writeBigUInt64LE(BigInt(id));

        const [campaignPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("campaign"), farmer.toBuffer(), idBuffer],
            PROGRAM_ID
        );
        const [tokenMint] = PublicKey.findProgramAddressSync(
            [Buffer.from("token_mint"), campaignPda.toBuffer()],
            PROGRAM_ID
        );
        const [vault] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), campaignPda.toBuffer()],
            PROGRAM_ID
        );

        return { campaignPda, tokenMint, vault };
    };

    return {
        program,
        provider: program?.provider as AnchorProvider | undefined,
        wallet,
        getCampaignPdAs,
    };
}
