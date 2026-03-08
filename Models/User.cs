using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class User
{
    public int Id { get; set; }

    public Guid? PublicId { get; set; }

    public string NipNidn { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string NamaLengkap { get; set; } = null!;

    public string Role { get; set; } = null!;

    public string? WalletAddress { get; set; }

    public string? JabatanSaatIni { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<KegiatanDosen> KegiatanDosens { get; set; } = new List<KegiatanDosen>();

    public virtual ICollection<UsulanKenaikanPangkat> UsulanKenaikanPangkats { get; set; } = new List<UsulanKenaikanPangkat>();
}
