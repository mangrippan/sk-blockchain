/**
 * Mock for fabric-network module
 * Since fabric-network@2.5.0 is no longer available on npm,
 * we mock it for testing purposes.
 */

const mockTransaction = {
  getTransactionId: jest.fn().mockReturnValue('mock-tx-id-' + Date.now()),
  submit: jest.fn().mockResolvedValue(Buffer.from('{}')),
};

const mockContract = {
  submitTransaction: jest.fn().mockResolvedValue(Buffer.from('{}')),
  evaluateTransaction: jest.fn().mockResolvedValue(Buffer.from('[]')),
  createTransaction: jest.fn().mockReturnValue(mockTransaction),
};

const mockNetwork = {
  getContract: jest.fn().mockReturnValue(mockContract),
};

const mockGateway = {
  connect: jest.fn().mockResolvedValue(undefined),
  getNetwork: jest.fn().mockResolvedValue(mockNetwork),
  disconnect: jest.fn(),
};

const Gateway = jest.fn().mockImplementation(() => mockGateway);

const Wallets = {
  newFileSystemWallet: jest.fn().mockResolvedValue({
    get: jest.fn().mockResolvedValue(null),
    put: jest.fn().mockResolvedValue(undefined),
    getProviderRegistry: jest.fn().mockReturnValue({
      getProvider: jest.fn(),
    }),
  }),
};

module.exports = {
  Gateway,
  Wallets,
};
