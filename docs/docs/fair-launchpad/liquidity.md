---
sidebar_position: 6
---

# Liquidity Configuration

Configure how your token will be launched on a DEX after the bonding curve target is reached.

## Configuration Parameters

| Parameter | Description | Options | Notes |
|-----------|-------------|---------|--------|
| Launch Liquidity On | Target DEX for token launch | • PumpSwap (Trending)<br/>• Other DEXes | Selected DEX's statistics shown:<br/>• 24h Volume: $42.8M<br/>• TVL: $156.2M |
| Liquidity Type | Pool configuration method | • Double-Sided: Traditional pool with token + SOL<br/>• Single-Sided: Only token provided | Double-sided offers better initial stability |
| Liquidity Source | Origin of initial liquidity | • Bonding Curve: Uses raised funds<br/>• Team Reserves: Project's own funds<br/>• External Source: Third-party funding | Choose based on available resources |
| Liquidity Percentage | Portion of raised funds for pool | 30% (adjustable) | • Higher % = Better stability<br/>• Recommended: 30-50% |
| Lockup Period | Duration liquidity cannot be removed | 180 days (minimum 30 days) | Longer periods build trust |


:::caution
Insufficient liquidity or short lockup periods may raise red flags for investors. Consider market standards when configuring.
:::
