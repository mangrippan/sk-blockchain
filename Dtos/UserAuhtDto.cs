namespace SriPayroll.Dtos;

public class UserAuhtDto
{
    public int? PenggunaId { get; set; }
    public int OrangId { get; set; }
    public string Username { get; set; } = null!;
    public string Nama { get; set; } = null!;
    public string? Nip { get; set; }
    public int? StrukturOrganisasiId { get; set; }
    public int? StrataId { get; set; }
    public string? StrukturOrganisasi { get; set; }
    public string? Jwt { get; set; }
    public string? JenisPenggunaId { get; set; }
    public string? JenisPengguna { get; set; }
    public List<RoleUserDto> Roles { get; set; }
}