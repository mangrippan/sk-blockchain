# Hyperledger Fabric Network Setup

## Prerequisites

- Docker & Docker Compose
- curl
- Git

## Quick Start

### 1. Download Fabric Samples & Binaries

```bash
# From project root
cd fabric-network
./setup.sh
```

### 2. Start the Network

```bash
./start-network.sh
```

This will:
- Start Fabric test-network (1 Org, 1 Peer, 1 Orderer, CA)
- Create channel `mychannel`
- Deploy `prima` chaincode
- Register & enroll `appUser` identity

### 3. Stop the Network

```bash
./stop-network.sh
```

### 4. Verify Chaincode

```bash
./test-chaincode.sh
```

## Network Architecture (POC)

```
┌─────────────────────────────────────────┐
│           Hyperledger Fabric             │
│                                         │
│  ┌──────────┐  ┌──────────┐            │
│  │  Peer0   │  │ Orderer  │            │
│  │  Org1    │  │          │            │
│  └──────────┘  └──────────┘            │
│       │                                  │
│  ┌──────────┐                           │
│  │    CA    │  Channel: mychannel       │
│  │   Org1   │  Chaincode: prima     │
│  └──────────┘                           │
└─────────────────────────────────────────┘
```

## Troubleshooting

- **Docker not running**: Start Docker Desktop first
- **Port conflicts**: Stop any services on 7050, 7051, 7054, 9443
- **Chaincode deploy fails**: Check `docker logs` for peer container
