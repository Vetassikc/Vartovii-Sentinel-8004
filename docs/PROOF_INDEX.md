# Public Proof Index

As of **April 8, 2026**, this is the smallest public-safe set of links that
helps a judge verify the Sentinel-8004 submission story quickly.

## Primary Product Surfaces

- Hosted submission hub:
  - <https://sentinel-8004-judge-demo.onrender.com/>
- Live judge walkthrough:
  - <https://sentinel-8004-judge-demo.onrender.com/judge>
- Operator dry-run shell:
  - <https://sentinel-8004-judge-demo.onrender.com/operator>

## Shared Sepolia Read-Only Surfaces

- Shared contract config JSON:
  - <https://sentinel-8004-judge-demo.onrender.com/api/demo/shared-sepolia>
- Founder-run AgentRegistry anchor plan:
  - <https://sentinel-8004-judge-demo.onrender.com/api/demo/shared-sepolia/agent-registry-anchor/strategy-agent-demo>
- Shared Sepolia contract notes:
  - <https://github.com/Vetassikc/Vartovii-Sentinel-8004/blob/main/docs/SHARED_SEPOLIA.md>

## Public Contract Links

- AgentRegistry:
  - <https://sepolia.etherscan.io/address/0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3>
- RiskRouter:
  - <https://sepolia.etherscan.io/address/0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC>
- ValidationRegistry:
  - <https://sepolia.etherscan.io/address/0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1>

## Companion-Proof Snapshot

The separate founder-run companion log currently records:

- `130` total cycles
- `50` `ALLOW`
- `49` `ALLOW_WITH_DOWNSIZE`
- `26` `DENY`
- `83` approved shared-Sepolia `RiskRouter` actions

This is supporting proof only. Judges can evaluate Sentinel-8004 without the
companion repo.

## Recent Approved RiskRouter Transactions

These recent transactions came from the companion proof log and are externally
inspectable on Sepolia Etherscan:

1. `2026-04-08 09:30:51Z` · `ETH/USD` · `ALLOW_WITH_DOWNSIZE`
   - tx:
     <https://sepolia.etherscan.io/tx/0x7dc1105be8e575dc8eed265eb41acc509b677e4953af6b16a80df617ced629af>
   - decision hash:
     `0xe6edb49ba1f33610f7bdd78090456e3d2db83ec3c53fc514e3d7cca12f9a4caf`
2. `2026-04-08 09:30:29Z` · `BTC/USD` · `ALLOW`
   - tx:
     <https://sepolia.etherscan.io/tx/0x3bd0e41c8fce56ba0c25079c7cd177d6266dfb507f25d1b96b73b60459e8b3fc>
   - decision hash:
     `0x2e5af55abe6432478edb77d74e632f3ea48955dc1af078dbb6a13490b3158ec3`
3. `2026-04-08 09:29:51Z` · `ETH/USD` · `ALLOW_WITH_DOWNSIZE`
   - tx:
     <https://sepolia.etherscan.io/tx/0x00244a28015ab13be5d0ca5ba233defa3cc9142b84bfc2a130bbcc58bb028ac4>
   - decision hash:
     `0xe6b5950f5895a34bd89ef1e03731bfb2dc427c7aae43e06dadad4a73e65ccf5e`
4. `2026-04-08 09:29:29Z` · `BTC/USD` · `ALLOW`
   - tx:
     <https://sepolia.etherscan.io/tx/0xe4bba5828d1f3d12359578c471d842905bd031d5b9472cd13debc15ac690a2cc>
   - decision hash:
     `0x494b3583e8a99d04a6d85c0d92fd6b669af026871b23782abdb9ba0977df2b6c`
5. `2026-04-07 22:00:27Z` · `ETH/USD` · `ALLOW_WITH_DOWNSIZE`
   - tx:
     <https://sepolia.etherscan.io/tx/0xbf72b3cd59afd6c2c4c6da8e09778c05f3b3b2ea066cb4eaf52f92f7cc9d8149>
   - decision hash:
     `0x3b6edb4c93b47d20abedb3bcd2730d89739abd5262360db83d9848a1a9c16437`

## Boundary Reminder

Sentinel-8004 is the judged product.

The companion trading loop, public transaction history, and external leaderboard
presence are supporting proof for market relevance, not the primary product
claim.
