using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class DokumenAdministrasi
{
    public int Id { get; set; }

    public Guid? UsulanId { get; set; }

    public int? JenisDokumen { get; set; }

    public string DocumentUrl { get; set; } = null!;

    public DateTime? UploadedAt { get; set; }

    public virtual RefJenisDokuman? JenisDokumenNavigation { get; set; }

    public virtual UsulanKenaikanPangkat? Usulan { get; set; }
}
