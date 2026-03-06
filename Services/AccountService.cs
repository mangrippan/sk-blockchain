using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using SriPayroll.Dtos;
using SriPayroll.Models;
using SriPayroll.Services.LDAP;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace SriPayroll.Services;

public interface IAccountService
{
    Task<List<RoleUserDto>> Authorize(LdapUser user);
    Task<UserAuhtDto> Login(LdapUser ldapUser);
    Task<UserAuhtDto> GetAuthorize(UserAuhtDto user, int hakAksesId);
}

public class AccountService : IAccountService
{
    private readonly DbPayrollContext _db;
    private readonly IConfiguration _configuration;

    public AccountService(DbPayrollContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<UserAuhtDto> Login(LdapUser ldapUser)
    {
        var roles = await Authorize(ldapUser);

        if (roles.Count == 0)
            throw new UnauthorizedAccessException("Anda tidak memiliki akses");

        return SetUserAuth(ldapUser, roles);
    }

    private UserAuhtDto SetUserAuth(LdapUser ldapUser, List<RoleUserDto> roles)
    {
        var role = roles.First();
        var penggunaId = role.PenggunaId;
        UserAuhtDto user;

        if (roles.Count > 1)
        {
            user = new UserAuhtDto
            {
                PenggunaId = penggunaId,
                Roles = roles,
                Username = ldapUser.Uid,
                Nama = role.Nama
            };

            user.Jwt = GenerateToken(user);
            return user;
        }

        user = new UserAuhtDto
        {
            OrangId = role.OrangId,
            Nama = role.Nama,
            Nip = role.Nip,
            Username = ldapUser.Uid,
            Roles = roles,
            StrukturOrganisasi = role.StrukturOrganisasi,
            StrukturOrganisasiId = role.StrukturOrganisasiId,
            StrataId = role.StrataId,
            JenisPengguna = role.JenisPengguna,
            JenisPenggunaId = role.JenisPenggunaId.ToString(),
            PenggunaId = role.PenggunaId
        };

        user.Jwt = GenerateToken(user);

        return user;
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
            new("username", member.Username),
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

    private IQueryable<AccountViewModel> QueryHakAkses()
    {
        return new List<AccountViewModel>().AsQueryable(); // todo: Implement query to fetch hak akses
    }

    public async Task<List<RoleUserDto>> Authorize(LdapUser user)
    {
        return new List<RoleUserDto>(); // todo: Implement logic to fetch user roles
    }

    public async Task<UserAuhtDto> GetAuthorize(UserAuhtDto user, int hakAksesId)
    {
        var penggunaId = user.PenggunaId ?? 0;
        var account = await QueryHakAkses().FirstOrDefaultAsync(x => x.HakAksesId == hakAksesId && x.Id == penggunaId);

        if (account is null) throw new Exception("Anda tidak memiliki akses");

        user.OrangId = account.PegawaiId;
        user.Nama = account.Name;
        user.StrukturOrganisasiId = account.StrukturOrganisasiId;
        user.StrataId = account.StrataId;
        user.StrukturOrganisasi = account.StrukturOrganisasi;
        user.JenisPengguna = account.JenisPengguna;
        user.JenisPenggunaId = account.JenisPenggunaId.ToString();
        user.Username = account.Username;
        user.Nip = account.Nip;
        user.PenggunaId = account.Id;
        user.Roles = await Authorize(new LdapUser { OrangId = user.OrangId.ToString() });
        user.Jwt = GenerateToken(user);

        return user;
    }
    
    private class AccountViewModel
    {
        public int Id { get; set; }
        public int PegawaiId { get; set; }
        public string Username { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Nip { get; set; } = null!;
        public int? StrukturOrganisasiId { get; set; }
        public int? StrataId { get; set; }
        public string StrukturOrganisasi { get; set; } = null!;
        public string? PathFoto { set; get; } 
        public string JenisPengguna { set; get; } = null!;
        public int JenisPenggunaId { get; set; }
        public int HakAksesId { get; set; }
    }
}