using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class RefKategoriKum
{
    public int Id { get; set; }

    public string NamaKategori { get; set; } = null!;

    public string? Deskripsi { get; set; }

    public virtual ICollection<RefKegiatanKum> RefKegiatanKums { get; set; } = new List<RefKegiatanKum>();
}
