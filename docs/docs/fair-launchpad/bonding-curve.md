---
sidebar_position: 5
---

# Bonding Curve Configuration

A bonding curve determines token price based on supply, creating a dynamic pricing mechanism.

## Configuration Parameters

| Parameter | Description | Example | Impact |
|-----------|-------------|---------|---------|
| Curve Type | Mathematical function for price calculation | Linear, Exponential, Logarithmic | • Linear: Constant price increase<br/>• Exponential: Accelerating increase<br/>• Logarithmic: Decelerating increase |
| Reserve Ratio | Percentage of funds kept in reserve | 50% (slider) | • Higher ratio = More stability<br/>• Lower ratio = More volatility<br/>• Affects buyback capability |
| Initial Price | Starting token price | 0.02 SOL | • First token sale price<br/>• Sets entry point for early buyers |
| Final Price | Price at target raise | 1 SOL | • Maximum price at full raise<br/>• Determines price growth potential |

:::caution
Choose realistic price targets based on market conditions and project stage to encourage participation.
:::

Once you've configured your bonding curve, click "Next" to proceed to the liquidity configuration. 