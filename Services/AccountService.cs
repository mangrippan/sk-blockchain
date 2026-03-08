using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Backend.Dtos;
using Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public interface IAccountService
{
    Task<List<RoleUserDto>> Authorize(string username);
    Task<UserAuhtDto> Login(string username, string password);
    Task<UserAuhtDto> GetAuthorize(UserAuhtDto user, int hakAksesId);
}

public class AccountService : IAccountService
{
    private readonly SkContext _db;
    private readonly IConfiguration _configuration;
    
    public AccountService(SkContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }
    
    public async Task<UserAuhtDto> Login(string nip, string password)
    {
        // Verify user credentials from database
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.NipNidn == nip);
    
        if (user == null)
            throw new UnauthorizedAccessException("Username atau password salah");
    
        // Verify password using BCrypt
        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Username atau password salah");
    
        var roles = await Authorize(user.NipNidn);
    
        if (roles.Count == 0)
            throw new UnauthorizedAccessException("Anda tidak memiliki akses");
    
        return SetUserAuth(user, roles);
    }
    
    private UserAuhtDto SetUserAuth(User user, List<RoleUserDto> roles)
    {
        var role = roles.First();
        
        UserAuhtDto userAuth = new UserAuhtDto
        {
            OrangId = user.Id,
            Nama = user.NamaLengkap,
            Nip = user.NipNidn,
            Username = user.NipNidn,
            Roles = roles,
            StrukturOrganisasi = user.JabatanSaatIni,
            StrukturOrganisasiId = role.StrukturOrganisasiId,
            StrataId = role.StrataId,
            JenisPengguna = user.Role,
            JenisPenggunaId = role.JenisPenggunaId.ToString(),
            PenggunaId = user.Id
        };
    
        userAuth.Jwt = GenerateToken(userAuth);
    
        return userAuth;
    }

    private string GenerateToken(UserAuhtDto member, bool isToken5Min = false)
    {
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey)) throw new Exception("JWT Key is not set");
    
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);
    
        var claims = new List<Claim>
        {
            new("penggunaId", member.PenggunaId.ToString() ?? "0", ClaimValueTypes.Integer),
            new("nama", member.Nama),
            new("nip", member.Nip ?? string.Empty),
            new("strukturOrganisasiId", member.StrukturOrganisasiId.ToString() ?? "0",
                ClaimValueTypes.Integer),
            new("strataId", member.StrataId.ToString() ?? "0", ClaimValueTypes.Integer),
            new("orangId", member.OrangId.ToString(), ClaimValueTypes.Integer),
            new("strukturOrganisasi", member.StrukturOrganisasi ?? "0"),
            new("roles", JsonSerializer.Serialize(member.Roles)),
            new("jenisPenggunaId", member.JenisPenggunaId ?? "0", ClaimValueTypes.Integer),
            new("jenisPengguna", member.JenisPengguna ?? string.Empty),
            new(ClaimTypes.Role, member.JenisPenggunaId ?? "0")
        };
    
        var defaultExpiration =
            DateTime.Now.AddMinutes(
                _configuration.GetValue<int>("Jwt:ExpiryInMinutes"));
    
        var jwtSecurityToken = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: defaultExpiration,
            signingCredentials: credentials,
            claims: claims
        );
        return new JwtSecurityTokenHandler().WriteToken(jwtSecurityToken);
    }
    
    public async Task<List<RoleUserDto>> Authorize(string nip)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.NipNidn == nip);
        
        if (user == null)
            return new List<RoleUserDto>();
        
        // Map user role to RoleUserDto
        var roles = new List<RoleUserDto>
        {
            new RoleUserDto
            {
                PenggunaId = user.Id,
                OrangId = user.Id,
                HakAksesId = 1, // Default access
                StrukturOrganisasi = user.JabatanSaatIni ?? string.Empty,
                StrukturOrganisasiId = 0, // Can be updated based on your organization structure
                StrataId = null,
                JenisPengguna = user.Role,
                JenisPenggunaId = GetRoleId(user.Role),
                Nama = user.NamaLengkap,
                Nip = user.NipNidn
            }
        };
        
        return roles;
    }
    
    private int GetRoleId(string role)
    {
        return role.ToLower() switch
        {
            "admin" => 1,
            "dosen" => 2,
            "reviewer" => 3,
            _ => 0
        };
    }
    
    public async Task<UserAuhtDto> GetAuthorize(UserAuhtDto user, int hakAksesId)
    {
        var penggunaId = user.PenggunaId ?? 0;
        var dbUser = await _db.Users.FirstOrDefaultAsync(x => x.Id == penggunaId);
    
        if (dbUser is null) 
            throw new Exception("Anda tidak memiliki akses");
    
        user.OrangId = dbUser.Id;
        user.Nama = dbUser.NamaLengkap;
        user.StrukturOrganisasi = dbUser.JabatanSaatIni;
        user.JenisPengguna = dbUser.Role;
        user.Username = dbUser.NipNidn;
        user.Nip = dbUser.NipNidn;
        user.PenggunaId = dbUser.Id;
        user.Roles = await Authorize(user.Username);
        user.Jwt = GenerateToken(user);
    
        return user;
    }
}