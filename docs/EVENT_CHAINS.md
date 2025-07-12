# Event Chain System

## Overview

The Event Chain System introduces narrative-driven gameplay through interconnected events that tell a story. Player choices in earlier events affect later events and determine the final outcome.

## Architecture

### Core Components

1. **Enhanced Event Class**
   - `chainId`: Unique identifier for the chain
   - `nextEventId`: ID of the next event in the chain
   - `previousEventId`: ID of the previous event
   - `chainPosition`: Current position in the chain (1-based)
   - `chainLength`: Total number of events in the chain

2. **EventChainService**
   - Creates and manages event chains
   - Tracks player choices throughout the chain
   - Determines completion rewards based on choices made
   - Handles chain progression logic

3. **EventChainManager**
   - Spawns chains based on kingdom conditions
   - Manages chain cooldowns
   - Processes chain completions
   - Applies rewards to the kingdom

4. **Chain Context**
   - Tracks all choices made in a chain
   - Provides context for determining rewards
   - Enables branching narrative paths

## Implemented Event Chains

### 1. The Noble Rebellion (3 Events)
A political crisis where noble houses challenge your authority.

**Events:**
1. **The Noble Conspiracy** - Early warning of discontent
2. **The Demands Escalate** - Nobles form a coalition
3. **The Final Confrontation** - Resolution of the crisis

**Paths:**
- **Peaceful Path**: Diplomacy and negotiation
  - Rewards: +500 Gold, +200 Influence, +100 Loyalty
  - Unlocks: Diplomatic advisor upgrade
- **Force Path**: Military suppression
  - Rewards: +200 Gold, +150 Military Power, -50 Loyalty
  - Unlocks: Military advisor upgrade

### 2. Merchant Guild Expansion (4 Events)
An economic opportunity to expand trade networks.

**Events:**
1. **The Guild Proposal** - Initial trade expansion offer
2. **First Trade Returns** - Managing early challenges
3. **Foreign Competition** - Dealing with external traders
4. **The Trade Empire** - Establishing economic dominance

**Paths:**
- **Cooperation Path**: Working with the guild
  - Rewards: +1000 Gold, +150 Influence, +50 Loyalty
  - Unlocks: Trade routes, Merchant quarter
- **Control Path**: Royal monopoly
  - Rewards: +500 Gold, +100 Influence, +50 Military
  - Unlocks: Royal market

### 3. Religious Awakening (3 Events)
A spiritual movement that challenges traditional beliefs.

**Events:**
1. **The Prophet Arrives** - A new religious movement begins
2. **The Great Schism** - Religious division in the kingdom
3. **The Divine Mandate** - Final religious transformation

**Paths:**
- **Embrace Path**: Supporting the religious movement
  - Rewards: +300 Gold, +300 Influence, +200 Loyalty
  - Unlocks: Grand cathedral, Religious advisor
- **Secular Path**: Maintaining secular rule
  - Rewards: +600 Gold, +100 Military, -25 Loyalty
  - Unlocks: University, Science advisor

## Spawn Conditions

Chains spawn based on:
- **Turn requirements**: Minimum/maximum turns
- **Resource thresholds**: Gold, influence requirements
- **Stability ranges**: Some chains spawn in crisis
- **Cooldown periods**: Prevent chain spam
- **Probability**: Random chance when conditions met

## API Endpoints

### Process Chain Choice
```
POST /api/kingdoms/:kingdomId/events/:eventId/chain-choice
Body: { choiceId: string }
```

### Get Chain Progress
```
GET /api/kingdoms/:kingdomId/chains/:chainId/progress
```

### Get All Active Chains
```
GET /api/kingdoms/:kingdomId/chains
```

## Choice Consequences

Each choice has:
1. **Immediate Effects**: Resource changes, stability impact
2. **Long-term Effects**: Ongoing resource generation/drain
3. **Chain Modifiers**: Affects how next events unfold
4. **Path Determination**: Influences final rewards

## Testing

The system includes comprehensive tests for:
- Chain creation and linking
- Choice processing and tracking
- Reward calculation based on paths
- Spawn condition evaluation
- Chain completion logic

## Future Extensions

1. **Branching Chains**: Different events based on choices
2. **Cross-Chain Effects**: Choices affect other chains
3. **Repeatable Chains**: Some chains can occur multiple times
4. **Dynamic Chain Generation**: Procedurally generated chains
5. **Chain Prerequisites**: Chains that unlock other chains