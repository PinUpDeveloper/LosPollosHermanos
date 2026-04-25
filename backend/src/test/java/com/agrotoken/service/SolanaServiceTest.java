package com.agrotoken.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.agrotoken.config.SolanaConfig;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.p2p.solanaj.rpc.RpcApi;
import org.p2p.solanaj.rpc.RpcClient;
import org.p2p.solanaj.rpc.RpcException;
import org.p2p.solanaj.rpc.types.ConfirmedTransaction;
import org.p2p.solanaj.rpc.types.ConfirmedTransaction.Message;
import org.p2p.solanaj.rpc.types.ConfirmedTransaction.Meta;
import org.p2p.solanaj.rpc.types.ConfirmedTransaction.Transaction;

class SolanaServiceTest {

    private RpcClient rpcClient;
    private RpcApi rpcApi;
    private SolanaConfig solanaConfig;
    private SolanaService solanaService;

    private static final String PROGRAM_ID = "GM4oyeT5WV1mC1KVgwPMhUV4YMJw8e1i1GKkXMjYnvvY";
    private static final String CAMPAIGN_PDA = "CampaignPDA1111111111111111111111111111111";

    @BeforeEach
    void setUp() {
        rpcClient = mock(RpcClient.class);
        rpcApi = mock(RpcApi.class);
        solanaConfig = new SolanaConfig(
                "https://api.devnet.solana.com",
                PROGRAM_ID,
                "OracleWallet11111111111111111111111111111111",
                "UsdcMint11111111111111111111111111111111111");
        when(rpcClient.getApi()).thenReturn(rpcApi);
        solanaService = new SolanaService(solanaConfig, rpcClient);
    }

    @Test
    void verifyTransaction_Success() throws RpcException {
        ConfirmedTransaction tx = createMockTx(true, List.of(PROGRAM_ID, CAMPAIGN_PDA));
        when(rpcApi.getTransaction(anyString())).thenReturn(tx);

        assertDoesNotThrow(() -> solanaService.verifyTransaction("sig", CAMPAIGN_PDA));
    }

    @Test
    void verifyTransaction_NotFound() throws RpcException {
        when(rpcApi.getTransaction(anyString())).thenReturn(null);

        assertThrows(RuntimeException.class, () -> solanaService.verifyTransaction("sig", CAMPAIGN_PDA));
    }

    @Test
    void verifyTransaction_FailedOnChain() throws RpcException {
        ConfirmedTransaction tx = createMockTx(false, List.of(PROGRAM_ID, CAMPAIGN_PDA));
        // Simulate error in meta
        when(tx.getMeta().getErr()).thenReturn("Some Error");
        when(rpcApi.getTransaction(anyString())).thenReturn(tx);

        assertThrows(RuntimeException.class, () -> solanaService.verifyTransaction("sig", CAMPAIGN_PDA));
    }

    @Test
    void verifyTransaction_WrongProgram() throws RpcException {
        ConfirmedTransaction tx = createMockTx(true, List.of("WrongProgramID", CAMPAIGN_PDA));
        when(rpcApi.getTransaction(anyString())).thenReturn(tx);

        assertThrows(RuntimeException.class, () -> solanaService.verifyTransaction("sig", CAMPAIGN_PDA));
    }

    @Test
    void verifyTransaction_WrongCampaign() throws RpcException {
        ConfirmedTransaction tx = createMockTx(true, List.of(PROGRAM_ID, "OtherCampaignPDA"));
        when(rpcApi.getTransaction(anyString())).thenReturn(tx);

        assertThrows(RuntimeException.class, () -> solanaService.verifyTransaction("sig", CAMPAIGN_PDA));
    }

    private ConfirmedTransaction createMockTx(boolean success, List<String> accountKeys) {
        ConfirmedTransaction tx = mock(ConfirmedTransaction.class);
        Meta meta = mock(Meta.class);
        Transaction transaction = mock(Transaction.class);
        Message message = mock(Message.class);

        when(tx.getMeta()).thenReturn(meta);
        when(tx.getTransaction()).thenReturn(transaction);
        when(transaction.getMessage()).thenReturn(message);
        when(message.getAccountKeys()).thenReturn(accountKeys);

        if (success) {
            when(meta.getErr()).thenReturn(null);
        }

        return tx;
    }
}
