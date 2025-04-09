---
sidebar_position: 7
---

# Fee Configuration

Configure fees for various token operations to fund development, marketing, or other activities.

## Fee Parameters

| Fee Type | Description | Default | Range | Impact |
|----------|-------------|---------|--------|---------|
| Mint Fee | Charged when new tokens are minted | 1.5% | 0-3% | • Higher fees = More development funding<br/>• Affects initial token distribution |
| Transfer Fee | Charged on wallet-to-wallet transfers | 0.5% | 0-1% | • Higher fees = More ongoing revenue<br/>• Affects trading activity |
| Burn Fee | Charged when tokens are burned | 0% | 0-1% | • Optional deflationary mechanism<br/>• Affects token supply reduction |

## Administrative Settings

| Setting | Description | Required | Notes |
|---------|-------------|----------|--------|
| Fee Recipient Address | Wallet receiving collected fees | Yes | • Must be valid network address<br/>• Treasury or team wallet recommended |
| Admin Controls | Enable post-deployment fee changes | No | • Adds flexibility for future adjustments<br/>• Consider governance implications |
| Admin Address | Wallet authorized to change fee recipient | No* | • Required if Admin Controls enabled<br/>• Defaults to deployer if empty |

:::caution
- High fees can discourage adoption and trading
- Consider market standards when setting fees
- Ensure fee recipient address is secure and controlled by the project
:::
