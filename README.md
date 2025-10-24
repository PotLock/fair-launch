# 🫕 POTLAUNCH

**Cross-chain token launch kit powered by Solana x NEAR Intents x Omnibridge**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-000000?style=flat&logo=solana&logoColor=white)](https://solana.com/)
[![NEAR Protocol](https://img.shields.io/badge/NEAR-000000?style=flat&logo=near&logoColor=white)](https://near.org/)

## 🚀 About PotLock

**POTLOCK** is the open funding stack supercharged by AI, building the future of decentralized funding and impact tracking. Founded by Potluck Labs with contracts deployed by Potlock Foundation DAO, PotLock provides a comprehensive ecosystem for community-powered token launches, grants, and impact tracking.

### 🌟 PotLock Ecosystem

PotLock operates across multiple blockchain networks and provides various tools and platforms:

- **NEAR Protocol** - Core infrastructure and BOS applications
- **Stellar (Soroban Contracts)** - GrantPicks voting mechanism
- **Base/Cyber** - Activity DAO via Commit Protocol
- **Solana** - Token launchpad and bonding curves


## 🪴 POTLAUNCH Overview

POTLAUNCH is a community-powered token launch platform that enables fair, transparent, and accessible token creation across multiple blockchains. Built on Solana with cross-chain capabilities through NEAR Intents and Omnibridge.

### ✨ Key Features

- 🪙 **Token Creation:** Easily create and launch tokens with just a few clicks
- 🏦 **Community Funding:** Raise funds through transparent, community-driven mechanisms
- 📈 **Bonding Curves:** Advanced bonding curve models for fair and dynamic pricing
- 🔒 **Secure Wallet Integration:** Connect with popular wallets like Phantom
- 🌐 **Multi-chain Support:** Launch tokens on Solana with cross-chain expansion
- 🎯 **Fair Launch Mechanisms:** Dutch auctions, bonding curves, and customizable options

## 📁 Project Structure

```
potlaunch/
├── solana-contract/     # Solana smart contracts (Anchor)
├── frontend/           # React frontend application
├── backend/            # Node.js backend services
└── docs/              # Comprehensive documentation
    ├── contracts/      # Smart contract documentation
    ├── user-guide/     # User guides and tutorials
    ├── launch-mechanisms/ # Token launch mechanisms
    ├── developer-guide/ # Developer resources
    └── governance/     # Governance documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Solana CLI tools
- Phantom wallet or compatible Solana wallet

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/PotLock/potlaunch.git
   cd potlaunch
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Backend
   cd ../backend && npm install
   
   # Solana contracts
   cd ../solana-contract && npm install
   ```

3. **Set up environment**
   ```bash
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   ```

4. **Start development servers**
   ```bash
   # Frontend
   cd frontend && npm run dev
   
   # Backend
   cd ../backend && npm run dev
   ```

## 📚 Documentation

### User Guides
- [Introduction to POTLAUNCH](https://docs.potlaunch.com/docs/user-guide/intro)
- [Token Launch Guide](https://docs.potlaunch.com/docs/user-guide/token-launch-guide)
- [User Guides](https://docs.potlaunch.com/docs/user-guide/user-guides)
- [Cross-chain Bridge Features](https://docs.potlaunch.com/docs/user-guide/bridge-cross-chain-features)

### Smart Contracts
- [Core Contracts](https://docs.potlaunch.com/docs/contracts/core-contracts)
- [Contract Interactions](https://docs.potlaunch.com/docs/contracts/contract-interactions)
- [Mathematical Models](https://docs.potlaunch.com/docs/contracts/mathematical-models)
- [Security Considerations](https://docs.potlaunch.com/docs/contracts/security-considerations)

### Launch Mechanisms
- [Bonding Curves](https://docs.potlaunch.com/docs/launch-mechanisms/bonding-curves)
- [Customization Options](https://docs.potlaunch.com/docs/launch-mechanisms/customization-options)
- [Dutch Auctions](https://docs.potlaunch.com/docs/launch-mechanisms/dutch-auctions)
- [Fair Launch Features](https://docs.potlaunch.com/docs/launch-mechanisms/fair-launch-features)

### Developer Resources
- [Indexer Setup](https://docs.potlaunch.com/docs/developer-guide/indexer-setup)
- [Integrations Guide](https://docs.potlaunch.com/docs/developer-guide/integrations-guide)
- [POTLAUNCH SDK](https://docs.potlaunch.com/docs/developer-guide/potlaunch-sdk)
- [White Label Solutions](https://docs.potlaunch.com/docs/developer-guide/white-label-solutions)

### Governance
- [Governance System](https://docs.potlaunch.com/docs/governance/governance-system)
- [Protocol Fee Management](https://docs.potlaunch.com/docs/governance/protocol-fee-management)
- [DAO Management](https://docs.potlaunch.com/docs/governance/dao-management)

## 🌐 Live Environments

- 🌐 **Production:** [POTLAUNCH](https://potlaunch.com/)
- 🧪 **Testnet:** [testnet.potlaunch.com](https://testnet.potlaunch.com/)
- 🔧 **Staging:** [staging.potlaunch.com](https://staging.potlaunch.com/)

## 🔗 PotLock Ecosystem Links

### Core Platforms
- [PotLock Main App](https://app.potlock.org)
- [PotLock BOS App](https://bos.potlock.org)
- [PotLock NextJS App](https://alpha.potlock.org)
- [GrantPicks](https://grantpicks.com)
- [NadaBot](https://nada.bot)
- [AIPGF](https://aipgf.com)
- [Grants.fun](https://grants.fun)
- [Curate.fun](https://curate.fun)

### Documentation & Resources
- [PotLock Website](https://potlock.org)
- [PotLock Documentation](https://docs.potlock.io)
- [PotLock Tutorials](https://potlock.org/tutorials)
- [Ecosystem Map](https://ecosystem.potlock.org)

## 🤝 Contributing

We welcome contributions from the community! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 PotLock Organization

PotLock is building the open funding stack + AI-PGF = funding AGI. Our mission is to democratize access to funding and impact tracking through decentralized technologies.

### Social Links
- [Twitter](https://twitter.com/PotLock_)
- [Blog](https://blog.potlock.org)
- [LinkedIn](https://linkedin.com/company/potlock)
- [YouTube](https://youtube.com/@potlock)
- [Newsletter](https://subscribe.potlock.org)

### Web3 Social
- [NEAR.social](https://potlock.near.social)
- [Farcaster](https://warpcast.com/potlock)
- [Lens Protocol](https://hey.xyz/u/potlock)

## 🆘 Support

- [Backlog](https://potlock.org/backlog)
- [Ideas & Ecosystem Request Board](https://potlock.org/ideas)
- [Nada Bot Stamp Request](https://nada.bot/requests)

---

**Built with ❤️ by the PotLock community**