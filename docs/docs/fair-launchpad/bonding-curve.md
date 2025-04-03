---
sidebar_position: 5
---

# Bonding Curve

A bonding curve is a mathematical function that determines the price of your token based on its supply. This creates a dynamic pricing mechanism that can help with initial distribution and price discovery.

## Understanding Bonding Curves

Bonding curves automatically adjust token prices based on the token's supply. As more tokens are purchased, the price increases according to the curve's formula.

![Bonding Curve Toggle](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

When enabled, the bonding curve creates a dynamic pricing mechanism with these benefits:
- Automatic price discovery
- Initial distribution mechanism
- Reduced price volatility during early stages

## Configuring Your Bonding Curve

### Curve Type

Select the mathematical function that will determine how price changes with supply:

![Curve Type Selection](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

- **Linear**: Price increases at a constant rate as supply increases
- **Exponential**: Price increases at an accelerating rate as supply increases
- **Logarithmic**: Price increases quickly at first, then slows down as supply increases

### Reserve Ratio

The reserve ratio determines what percentage of funds are kept in reserve for token buybacks:

![Reserve Ratio Slider](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

A higher reserve ratio (e.g., 50%) means:
- More price stability
- Stronger price support
- More funds available for token buybacks

### Initial and Final Price

Set the starting price of your token and the target price when your fundraising goal is reached:

![Initial and Final Price Fields](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

- **Initial Price**: The price per token when the first tokens are sold
- **Final Price**: The price per token when the target raise is reached

## How the Bonding Curve Works

The platform provides a helpful explanation of what your configuration means:

![Bonding Curve Explanation](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

In this example:
- Token price starts at 0.01 SOL
- Price can reach up to 1 SOL as more tokens are purchased
- Price follows a Linear curve pattern
- 50% of funds are kept in reserve for token buybacks

## Bonding Curve Best Practices

### For Community Tokens
- Curve Type: Linear or Logarithmic
- Reserve Ratio: 40-60%
- Modest price growth from initial to final price (e.g., 5-10x)

### For Utility Tokens
- Curve Type: Linear
- Reserve Ratio: 50-70%
- Conservative price growth (e.g., 2-5x)

### For Speculative Tokens
- Curve Type: Exponential
- Reserve Ratio: 30-50%
- Higher potential price growth (e.g., 10-20x)

:::caution
Setting unrealistic price targets can deter potential buyers. Consider market conditions and your project's current stage when configuring prices.
:::

Once you've configured your bonding curve, click "Next" to proceed to the liquidity configuration. 