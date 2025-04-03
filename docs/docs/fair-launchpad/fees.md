---
sidebar_position: 7
---

# Fee Configuration

The fee configuration allows you to set up transaction fees for various token operations. These fees can be used to fund development, marketing, or other project activities.

## Understanding Token Fees

Token fees are small percentages taken from transactions that can be directed to a designated wallet. These fees can provide ongoing funding for your project beyond the initial token sale.

![Fee Configuration Toggle](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

## Configuring Fees

### Mint Fee

The fee charged when new tokens are minted:

![Mint Fee Slider](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

This fee is typically set between 0-3% and applies only when new tokens are created.

### Transfer Fee

The fee charged when tokens are transferred between wallets:

![Transfer Fee Slider](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

This fee is typically set between 0-1% and applies to all token transfers.

### Burn Fee

The fee charged when tokens are burned (permanently removed from circulation):

![Burn Fee Slider](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

This fee is typically set between 0-1% and applies when tokens are deliberately burned.

## Fee Recipient Address

Specify the wallet address that will receive the collected fees:

![Fee Recipient Address Field](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

This should be a wallet controlled by your project's treasury or development team.

## Admin Configuration

Enable admin capabilities to change the fee recipient address after deployment:

![Admin Toggle](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

If enabled, you'll need to specify an admin address that will have permission to update the fee recipient in the future:

![Admin Address Field](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

## Fee Impact Estimation

The platform provides an estimate of how much revenue your fee configuration would generate:

![Fee Impact Estimation](https://fastly.picsum.photos/id/237/200/300.jpg?hmac=TmmQSbShHz9CdQm0NkEjx1Dyh_Y984R9LpNrpvH2D_U)

This helps you understand the potential income from your fee structure based on transaction volume.

## Fee Best Practices

### For Community Tokens
- Mint Fee: 1-2%
- Transfer Fee: 0.25-0.5%
- Burn Fee: 0%
- Clearly communicate how fee revenue will be used (e.g., development, marketing, community rewards)

### For DeFi/Protocol Tokens
- Mint Fee: 0.5-1.5%
- Transfer Fee: 0.1-0.3%
- Burn Fee: 0%
- Consider directing a portion of fees to a DAO-controlled treasury

### For Gaming/NFT Tokens
- Mint Fee: 1-3%
- Transfer Fee: 0.5-1%
- Burn Fee: 0-0.5%
- Use fees to fund game development and player rewards

:::caution
Setting fees too high can discourage transactions and adoption of your token. Balance revenue needs with user experience.
:::

:::tip
Be transparent with your community about how fee revenue will be used. This builds trust and demonstrates responsible tokenomics.
:::

Once you've configured your fees, click "Next" to proceed to the launchpad configuration. 