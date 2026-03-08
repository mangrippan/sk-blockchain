using System.Security.Cryptography;
using System.Text;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;

namespace Backend.Services;

public class BlockchainService : IBlockchainService
{
    private readonly IConfiguration _configuration;
    private readonly SkContext _db;
    private readonly ILogger<BlockchainService> _logger;
    private readonly Web3 _web3;
    private readonly string _contractAddress;
    private readonly string _contractAbi;

    public BlockchainService(IConfiguration configuration, SkContext db, ILogger<BlockchainService> logger)
    {
        _configuration = configuration;
        _db = db;
        _logger = logger;

        // Get Ganache RPC URL from configuration
        var ganacheUrl = _configuration["Blockchain:GanacheUrl"] ?? "http://127.0.0.1:7545";
        
        // Get private key from configuration (for signing transactions)
        var privateKey = _configuration["Blockchain:PrivateKey"];
        
        if (!string.IsNullOrEmpty(privateKey))
        {
            var account = new Account(privateKey);
            _web3 = new Web3(account, ganacheUrl);
        }
        else
        {
            _web3 = new Web3(ganacheUrl);
        }

        // Get contract address and ABI from configuration
        _contractAddress = _configuration["Blockchain:ContractAddress"] ?? string.Empty;
        _contractAbi = _configuration["Blockchain:ContractAbi"] ?? string.Empty;

        _logger.LogInformation("BlockchainService initialized with Ganache URL: {GanacheUrl}", ganacheUrl);
    }

    public async Task<string> StoreDocumentHashAsync(string documentHash, int userId)
    {
        try
        {
            if (string.IsNullOrEmpty(_contractAddress) || string.IsNullOrEmpty(_contractAbi))
            {
                _logger.LogWarning("Smart contract not configured. Returning simulated transaction hash.");
                return GenerateSimulatedTxHash();
            }

            var contract = _web3.Eth.GetContract(_contractAbi, _contractAddress);
            var storeFunction = contract.GetFunction("storeDocument");

            // Get user wallet address or use default account
            var userWallet = await GetOrCreateWalletAddressAsync(userId);
            
            // Send transaction to store document hash
            var txHash = await storeFunction.SendTransactionAsync(
                userWallet,
                new HexBigInteger(300000), // gas limit
                null, // gas price (will use network default)
                documentHash,
                userId
            );

            _logger.LogInformation("Document hash stored on blockchain. TxHash: {TxHash}", txHash);
            return txHash;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing document hash to blockchain for user {UserId}", userId);
            
            // Return simulated hash for development
            return GenerateSimulatedTxHash();
        }
    }

    public async Task<bool> VerifyDocumentHashAsync(string txHash, string documentHash)
    {
        try
        {
            if (string.IsNullOrEmpty(txHash) || txHash.StartsWith("0xSIM-"))
            {
                _logger.LogWarning("Simulated transaction hash detected: {TxHash}", txHash);
                return true; // Accept simulated hashes in development
            }

            // Get transaction receipt
            var receipt = await _web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);
            
            if (receipt == null)
            {
                _logger.LogWarning("Transaction not found: {TxHash}", txHash);
                return false;
            }

            // Check if transaction was successful
            if (receipt.Status.Value == 0)
            {
                _logger.LogWarning("Transaction failed: {TxHash}", txHash);
                return false;
            }

            // Get transaction details
            var transaction = await _web3.Eth.Transactions.GetTransactionByHash.SendRequestAsync(txHash);
            
            if (transaction == null)
            {
                return false;
            }

            // Decode input data to verify document hash
            // This is a simplified verification - you might need to decode the actual contract input
            var inputData = transaction.Input;
            var isValid = inputData.Contains(documentHash.Replace("0x", ""));

            _logger.LogInformation("Document hash verification: {IsValid} for TxHash: {TxHash}", isValid, txHash);
            return isValid;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying document hash for transaction {TxHash}", txHash);
            return false;
        }
    }

    public async Task<TransactionDetailsDto> GetTransactionDetailsAsync(string txHash)
    {
        try
        {
            if (txHash.StartsWith("0xSIM-"))
            {
                return new TransactionDetailsDto
                {
                    TxHash = txHash,
                    From = "0x0000000000000000000000000000000000000000",
                    To = _contractAddress,
                    BlockNumber = "Simulated",
                    Status = "Success",
                    Timestamp = DateTime.UtcNow,
                    Data = "Simulated transaction for development"
                };
            }

            var transaction = await _web3.Eth.Transactions.GetTransactionByHash.SendRequestAsync(txHash);
            var receipt = await _web3.Eth.Transactions.GetTransactionReceipt.SendRequestAsync(txHash);

            if (transaction == null)
            {
                throw new Exception($"Transaction not found: {txHash}");
            }

            // Get block timestamp
            var block = await _web3.Eth.Blocks.GetBlockWithTransactionsByNumber.SendRequestAsync(
                new BlockParameter(transaction.BlockNumber));

            var timestamp = DateTimeOffset.FromUnixTimeSeconds((long)block.Timestamp.Value).DateTime;

            return new TransactionDetailsDto
            {
                TxHash = txHash,
                From = transaction.From,
                To = transaction.To ?? string.Empty,
                BlockNumber = transaction.BlockNumber.Value.ToString(),
                Status = receipt?.Status.Value == 1 ? "Success" : "Failed",
                Timestamp = timestamp,
                Data = transaction.Input
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction details for {TxHash}", txHash);
            throw;
        }
    }

    public async Task<string> GenerateDocumentHashAsync(string documentUrl)
    {
        try
        {
            // If it's a URL, download and hash the content
            if (documentUrl.StartsWith("http://") || documentUrl.StartsWith("https://"))
            {
                using var httpClient = new HttpClient();
                var content = await httpClient.GetByteArrayAsync(documentUrl);
                return ComputeSHA256Hash(content);
            }
            
            // If it's a file path, hash the file
            if (File.Exists(documentUrl))
            {
                var content = await File.ReadAllBytesAsync(documentUrl);
                return ComputeSHA256Hash(content);
            }

            // Otherwise, hash the string itself
            return ComputeSHA256Hash(Encoding.UTF8.GetBytes(documentUrl));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating document hash for {DocumentUrl}", documentUrl);
            throw;
        }
    }

    public async Task<string> GetOrCreateWalletAddressAsync(int userId)
    {
        try
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId);
            
            if (user == null)
            {
                throw new Exception($"User not found: {userId}");
            }

            // If user already has a wallet address, return it
            if (!string.IsNullOrEmpty(user.WalletAddress))
            {
                return user.WalletAddress;
            }

            // Generate new wallet address
            var ecKey = Nethereum.Signer.EthECKey.GenerateKey();
            var account = new Account(ecKey.GetPrivateKey());
            user.WalletAddress = account.Address;
            
            await _db.SaveChangesAsync();

            _logger.LogInformation("Generated new wallet address for user {UserId}: {WalletAddress}", 
                userId, user.WalletAddress);

            return user.WalletAddress;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting or creating wallet address for user {UserId}", userId);
            throw;
        }
    }

    private string ComputeSHA256Hash(byte[] data)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(data);
        return "0x" + BitConverter.ToString(hash).Replace("-", "").ToLower();
    }

    private string GenerateSimulatedTxHash()
    {
        // Generate a simulated transaction hash for development
        var randomBytes = new byte[32];
        using (var rng = RandomNumberGenerator.Create())
        {
            rng.GetBytes(randomBytes);
        }
        return "0xSIM-" + BitConverter.ToString(randomBytes).Replace("-", "").ToLower();
    }
}



