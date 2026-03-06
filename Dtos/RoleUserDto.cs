namespace SriPayroll.Dtos;

public class RoleUserDto
{
    public int PenggunaId { get; set; }
    public int OrangId { get; set; }
    public int HakAksesId { get; set; }
    public string StrukturOrganisasi { get; set; } = string.Empty;
    public int StrukturOrganisasiId { get; set; }
    public int? StrataId { get; set; }
    public string? PathFoto { set; get; } 
    public string JenisPengguna { set; get; } = string.Empty;
    public int JenisPenggunaId { get; set; }
    public string Nama { get; set; } = string.Empty;
    public string? Nip { get; set; }
}

public class AccountDto
{
    public int Id { get; set; }
    public int PegawaiId { get; set; }
    public string Username { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Nip { get; set; } = null!;
    public int? StrukturOrganisasiId { get; set; }
    public string StrukturOrganisasi { get; set; } = null!;
    public string? PathFoto { set; get; } 
    public string JenisPengguna { set; get; } = null!;
    public int JenisPenggunaId { get; set; }
}