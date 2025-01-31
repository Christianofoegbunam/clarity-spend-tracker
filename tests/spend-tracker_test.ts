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
    name: "Ensure spending categories are tracked correctly",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const department = accounts.get('wallet_1')!;
        
        // First allocate budget
        chain.mineBlock([
            Tx.contractCall('spend-tracker', 'allocate-budget', [
                types.principal(department.address),
                types.uint(1000000)
            ], deployer.address)
        ]);
        
        // Record spending with category
        let block = chain.mineBlock([
            Tx.contractCall('spend-tracker', 'record-spending', [
                types.principal(department.address),
                types.uint(500000),
                types.ascii("INFRASTRUCTURE"),
                types.ascii("Road maintenance")
            ], deployer.address)
        ]);
        
        assertEquals(block.receipts[0].result.expectOk(), true);
        
        // Check category spending
        let categoryResponse = chain.callReadOnlyFn(
            'spend-tracker',
            'get-category-spending',
            [types.ascii("INFRASTRUCTURE")],
            deployer.address
        );
        
        assertEquals(categoryResponse.result.expectOk(), types.uint(500000));
    }
});
