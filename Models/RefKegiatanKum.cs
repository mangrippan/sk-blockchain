using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class RefKegiatanKum
{
    public int Id { get; set; }

    public int? KategoriId { get; set; }

    public string NamaKegiatan { get; set; } = null!;

    public decimal PoinMaksimal { get; set; }

    public string? SyaratDokumen { get; set; }

    public bool? IsActive { get; set; }

    public virtual RefKategoriKum? Kategori { get; set; }

    public virtual ICollection<KegiatanDosen> KegiatanDosens { get; set; } = new List<KegiatanDosen>();
}
