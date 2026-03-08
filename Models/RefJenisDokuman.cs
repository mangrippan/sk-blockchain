using System;
using System.Collections.Generic;

namespace Backend.Models;

public partial class RefJenisDokuman
{
    public int Id { get; set; }

    public string Nama { get; set; } = null!;

    public virtual ICollection<DokumenAdministrasi> DokumenAdministrasis { get; set; } = new List<DokumenAdministrasi>();
}
