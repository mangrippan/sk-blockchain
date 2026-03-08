using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Route("[controller]")]
[ApiController]
public class BlockchainController : ControllerBase
{
    private readonly IBlockchainService _blockchainService;
    private readonly ILogger<BlockchainController> _logger;

    public BlockchainController(IBlockchainService blockchainService, ILogger<BlockchainController> logger)
    {
        _blockchainService = blockchainService;
        _logger = logger;
    }

    /// <summary>
    /// Store document hash to blockchain
    /// </summary>
    [HttpPost("StoreDocument")]
    [Authorize]
    public async Task<ActionResult> StoreDocument([FromBody] StoreDocumentRequest request)
    {
        try
        {
            var txHash = await _blockchainService.StoreDocumentHashAsync(
                request.DocumentHash, 
                request.UserId
            );

            return Ok(new
            {
                success = true,
                transactionHash = txHash,
                message = "Document hash stored successfully on blockchain"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error storing document to blockchain");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Verify document hash from blockchain
    /// </summary>
    [HttpPost("VerifyDocument")]
    [Authorize]
    public async Task<ActionResult> VerifyDocument([FromBody] VerifyDocumentRequest request)
    {
        try
        {
            var isValid = await _blockchainService.VerifyDocumentHashAsync(
                request.TransactionHash,
                request.DocumentHash
            );

            return Ok(new
            {
                success = true,
                isValid = isValid,
                message = isValid ? "Document is valid" : "Document verification failed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying document from blockchain");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Get transaction details
    /// </summary>
    [HttpGet("Transaction/{txHash}")]
    [Authorize]
    public async Task<ActionResult> GetTransactionDetails(string txHash)
    {
        try
        {
            var details = await _blockchainService.GetTransactionDetailsAsync(txHash);
            return Ok(new { success = true, data = details });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting transaction details");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Generate document hash from URL or file
    /// </summary>
    [HttpPost("GenerateHash")]
    [Authorize]
    public async Task<ActionResult> GenerateDocumentHash([FromBody] GenerateHashRequest request)
    {
        try
        {
            var hash = await _blockchainService.GenerateDocumentHashAsync(request.DocumentUrl);
            return Ok(new
            {
                success = true,
                documentHash = hash,
                documentUrl = request.DocumentUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating document hash");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    /// <summary>
    /// Get or create wallet address for user
    /// </summary>
    [HttpGet("Wallet/{userId}")]
    [Authorize]
    public async Task<ActionResult> GetWalletAddress(int userId)
    {
        try
        {
            var walletAddress = await _blockchainService.GetOrCreateWalletAddressAsync(userId);
            return Ok(new
            {
                success = true,
                walletAddress = walletAddress,
                userId = userId
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting wallet address");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }
}

public class StoreDocumentRequest
{
    public string DocumentHash { get; set; } = null!;
    public int UserId { get; set; }
}

public class VerifyDocumentRequest
{
    public string TransactionHash { get; set; } = null!;
    public string DocumentHash { get; set; } = null!;
}

public class GenerateHashRequest
{
    public string DocumentUrl { get; set; } = null!;
}

