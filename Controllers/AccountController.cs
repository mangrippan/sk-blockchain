using System.ComponentModel.DataAnnotations;
using Backend.Dtos;
using Backend.Helpers;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[Route("[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly IHttpContextAccessor _httpContext;

    public AccountController(IAccountService accountService, IHttpContextAccessor httpContext)
    {
        _accountService = accountService;
        _httpContext = httpContext;
    }

    [HttpPost("Login")]
    public async Task<ActionResult> Login(LoginDto dto)
    {
        if (!ModelState.IsValid) throw new ValidationException("Error: Terjadi kesalahan pada saat login.");

        try
        {
            dto.Username = dto.Username.Replace("@apps.ipb.ac.id", "");

            var role = await _accountService.Login(dto.Username, dto.Password);
            return Ok(role);
        }
        catch (UnauthorizedAccessException ex)
        {
            throw new BadHttpRequestException(ex.Message, StatusCodes.Status400BadRequest);
        }
    }

    [Authorize]
    [HttpGet("GetAuthorize")]
    public async Task<ActionResult> GetAuthorize(int hakAksesId)
    {
        var user = _httpContext.HttpContext!.User.GetUserClaimDto();
        var data = await _accountService.GetAuthorize(user, hakAksesId);
        return Ok(data);
    }
}