import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  userDocsSidebar: [
    'user-guide/intro',
    'user-guide/user-guides',
    'user-guide/token-launch-guide',
    'user-guide/bridge-cross-chain-features',
  ],
  developerDocsSidebar: [
    'developer-guide/potlaunch-sdk',
    'developer-guide/integrations-guide',
    'developer-guide/white-label-solutions',
    'developer-guide/indexer-setup',
  ],
  contractsDocsSidebar: [
    'contracts/core-contracts',
    'contracts/contract-interactions',
    'contracts/mathematical-models',
    'contracts/security-considerations',
  ],
  launchMechanismsSidebar: [
    'launch-mechanisms/bonding-curves',
    'launch-mechanisms/dutch-auctions',
    'launch-mechanisms/fair-launch-features',
    'launch-mechanisms/customization-options',
  ],
  governanceSidebar: [
    'governance/governance-system',
    'governance/dao-management',
    'governance/protocol-fee-management',
  ],
};

export default sidebars;
