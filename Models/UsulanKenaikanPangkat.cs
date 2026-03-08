using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class UsulanKenaikanPangkat
{
    public Guid Id { get; set; }

    public int? DosenId { get; set; }

    public decimal TotalPoinDiajukan { get; set; }

    public string JabatanTujuan { get; set; } = null!;

    public string? SkDocumentUrl { get; set; }

    public string? SkDocumentHash { get; set; }

    public string? TxHashSk { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<DokumenAdministrasi> DokumenAdministrasis { get; set; } = new List<DokumenAdministrasi>();

    public virtual User? Dosen { get; set; }
}
