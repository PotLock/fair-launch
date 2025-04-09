---
sidebar_position: 2
---

# Basic Information

## 1. Deploy Token

![Deploy Token](../../static/img/deploy_token.png)

The following table explains the essential parameters needed to deploy your token:

| Parameter | Description | Recommendation |
|-----------|-------------|----------------|
| Token Name | The full name of your token | • Maximum 30 characters<br/>• Should be unique and memorable<br/>• Example: "My Sample Token" |
| Token Symbol | Short abbreviation for your token | • Maximum 10 characters<br/>• Keep it short (2-5 characters)<br/>• Example: "MST" |
| Supply | Initial total number of tokens to be created | • Determines maximum supply if mint authority is revoked<br/>• Consider your tokenomics carefully |
| Decimals | Number of decimal places for token division | • 6-9 decimals for standard tokens<br/>• 2-3 decimals for less divisible tokens<br/>• 9+ decimals for high-value tokens |
| Logo | Visual identifier for your token | • Square format (1:1 ratio)<br/>• Minimum 200x200px (512x512px recommended)<br/>• Maximum 5MB size |
| Social Links | Enhance your token's credibility by adding social media links to your token's metadata: website, telegram, twitter,discord, ... | |



## 2. Additional Settings

![Additional Settings](../../static/img/additional_settings.png)
Configure advanced settings for your token:

| Setting | Description | Impact |
|---------|-------------|---------|
| Revoke Mint | Permanently removes ability to mint new tokens | • Makes total supply fixed<br/>• Cannot be reversed<br/>• Increases token security |
| Revoke Freeze | Removes ability to freeze token accounts | • Increases token transferability<br/>• Cannot be reversed<br/>• Reduces control over malicious actors |
| Enable Governance | Activates governance features for token | • Allows community voting<br/>• Enables proposal creation<br/>• Supports decentralized decision-making |


Once you've configured all settings, click "Next" to proceed with the token deployment. 