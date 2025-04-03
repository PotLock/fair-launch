---
sidebar_position: 1
---

# Architectural Overview

The Fair LaunchPad platform provides a comprehensive multi-chain solution for creating and launching tokens without coding. This document explains the system architecture and how the various components interact across different blockchain ecosystems.

## System Architecture

```mermaid
graph TD
    User[User Interface] --> API[API Layer]
    API --> TokenFactory[Token Factory]
    API --> AllocationEngine[Allocation Engine]
    API --> VestingEngine[Vesting Engine]
    API --> BondingCurve[Bonding Curve]
    API --> LaunchpadEngine[Launchpad Engine]
    API --> LiquidityManager[Liquidity Manager]
    API --> FeeManager[Fee Manager]
    
    TokenFactory --> ChainAdapter[Chain Adapter]
    AllocationEngine --> ChainAdapter
    VestingEngine --> ChainAdapter
    BondingCurve --> ChainAdapter
    LaunchpadEngine --> ChainAdapter
    LiquidityManager --> ChainAdapter
    FeeManager --> ChainAdapter
    
    ChainAdapter --> SolanaAdapter[Solana Adapter]
    ChainAdapter --> EVMAdapter[EVM Adapter]
    ChainAdapter --> NEARAdapter[NEAR Adapter]
    
    SolanaAdapter --> SolanaRPC[Solana RPC]
    EVMAdapter --> EVMRPC[EVM RPC]
    NEARAdapter --> NEARRPC[NEAR RPC]
    
    SolanaRPC --> SPLToken[SPL Token Program]
    SolanaRPC --> Metaplex[Metaplex]
    SolanaRPC --> SolanaPrograms[Solana Programs]
    
    EVMRPC --> ERC20[ERC-20 Standard]
    EVMRPC --> EVMContracts[EVM Smart Contracts]
    
    NEARRPC --> NEARToken[NEAR Token Standard]
    NEARRPC --> NEARContracts[NEAR Smart Contracts]
```

## Cross-Chain Architecture

The Fair LaunchPad uses a modular architecture with blockchain-specific adapters to support multiple chains:

```mermaid
graph LR
    Core[Core Business Logic] --> Adapters[Chain Adapters]
    Adapters --> Solana[Solana Implementation]
    Adapters --> EVM[EVM Implementation]
    Adapters --> NEAR[NEAR Implementation]
    
    Solana --> SPL[SPL Token]
    EVM --> ERC20[ERC-20 Token]
    NEAR --> NEP[NEP-141 Token]
```

