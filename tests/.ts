import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensure that owner can allocate budget",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const department = accounts.get('wallet_1')!;
        
        let block = chain.mineBlock([
            Tx.contractCall('spend-tracker', 'allocate-budget', [
                types.principal(department.address),
                types.uint(1000000)
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), true);
        
        let budgetResponse = chain.callReadOnlyFn(
            'spend-tracker',
            'get-department-budget',
            [types.principal(department.address)],
            deployer.address
        );
        
        assertEquals(budgetResponse.result.expectOk(), types.uint(1000000));
    }
});

Clarinet.test({
    name: "Ensure that only owner can record spending",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const department = accounts.get('wallet_1')!;
        const nonOwner = accounts.get('wallet_2')!;
        
        // First allocate budget
        chain.mineBlock([
            Tx.contractCall('spend-tracker', 'allocate-budget', [
                types.principal(department.address),
                types.uint(1000000)
            ], deployer.address)
        ]);
        
        // Try to record spending as non-owner
        let block = chain.mineBlock([
            Tx.contractCall('spend-tracker', 'record-spending', [
                types.principal(department.address),
                types.uint(500000),
                types.ascii("Test spending")
            ], nonOwner.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectErr(), types.uint(100));
        
        // Record spending as owner
        block = chain.mineBlock([
            Tx.contractCall('spend-tracker', 'record-spending', [
                types.principal(department.address),
                types.uint(500000),
                types.ascii("Test spending")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), true);
    }
});
