using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class KegiatanDosen
{
    public Guid Id { get; set; }

    public int? DosenId { get; set; }

    public int? RefKegiatanId { get; set; }

    public decimal PoinKum { get; set; }

    public string DocumentUrl { get; set; } = null!;

    public string DocumentHash { get; set; } = null!;

    public string? TxHashStore { get; set; }

    public string? TxHashVerify { get; set; }

    public string? Status { get; set; }

    public string? KeteranganAdmin { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User? Dosen { get; set; }

    public virtual RefKegiatanKum? RefKegiatan { get; set; }
}
