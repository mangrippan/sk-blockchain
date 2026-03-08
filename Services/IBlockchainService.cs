namespace Backend.Services;

/// <summary>
/// Interface for blockchain operations
/// </summary>
public interface IBlockchainService
{
    /// <summary>
    /// Store document hash to blockchain
    /// </summary>
    Task<string> StoreDocumentHashAsync(string documentHash, int userId);
    
    /// <summary>
    /// Verify document hash from blockchain
    /// </summary>
    Task<bool> VerifyDocumentHashAsync(string txHash, string documentHash);
    
    /// <summary>
    /// Get transaction details from blockchain
    /// </summary>
    Task<TransactionDetailsDto> GetTransactionDetailsAsync(string txHash);
    
    /// <summary>
    /// Generate hash for document URL
    /// </summary>
    Task<string> GenerateDocumentHashAsync(string documentUrl);
    
    /// <summary>
    /// Get wallet address for user
    /// </summary>
    Task<string> GetOrCreateWalletAddressAsync(int userId);
}

/// <summary>
/// Transaction details DTO
/// </summary>
public class TransactionDetailsDto
{
    public string TxHash { get; set; } = null!;
    public string From { get; set; } = null!;
    public string To { get; set; } = null!;
    public string BlockNumber { get; set; } = null!;
    public string Status { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string Data { get; set; } = null!;
}

