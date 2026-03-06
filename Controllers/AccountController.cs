using System.ComponentModel.DataAnnotations;
using SriPayroll.Dtos;
using SriPayroll.Helpers;
using SriPayroll.Services;
using SriPayroll.Services.LDAP;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SriPayroll.Controllers;

[Route("[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly IAccountService _accountService;
    private readonly ILdapServer _ldapServer;
    private readonly IHttpContextAccessor _httpContext;

    public AccountController(IAccountService accountService, ILdapServer ldapServer,
        IHttpContextAccessor httpContext)
    {
        _accountService = accountService;
        _ldapServer = ldapServer;
        _httpContext = httpContext;
    }

    [HttpPost("Login")]
    public async Task<ActionResult> Login(LoginDto dto)
    {
        if (!ModelState.IsValid) throw new ValidationException("Error: Terjadi kesalahan pada saat login.");

        try
        {
            dto.Username = dto.Username.Replace("@apps.ipb.ac.id", "");

            var password = dto.Password;

            var user = _ldapServer.Authenticate(dto.Username, password);

            var role = await _accountService.Login(user);
            return Ok(role);
        }
        catch (LdapAuthenticationException)
        {
            throw new BadHttpRequestException("Email atau password salah", StatusCodes.Status400BadRequest);
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