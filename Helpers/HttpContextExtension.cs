using System.Security.Claims;
using SriPayroll.Dtos;

namespace SriPayroll.Helpers;

public static class HttpContextExtension
{
    public static UserAuhtDto GetUserClaimDto(this ClaimsPrincipal claimsPrincipal)
    {
        try
        {
            var penggunaId = claimsPrincipal.FindFirstValue("penggunaId");
            var nama = claimsPrincipal.FindFirstValue("nama");
            var orangId = claimsPrincipal.FindFirstValue("orangId");
            var username = claimsPrincipal.FindFirstValue("username");
            var nip = claimsPrincipal.FindFirstValue("nip");
            var strukturOrganisasiId = claimsPrincipal.FindFirstValue("strukturOrganisasiId");
            var strukturOrganisasi = claimsPrincipal.FindFirstValue("strukturOrganisasi");
            var jenisPenggunaId = claimsPrincipal.FindFirstValue("jenisPenggunaId");
            var jenisPengguna = claimsPrincipal.FindFirstValue("jenisPengguna");
            var dataUser = new UserAuhtDto()
            {
                PenggunaId = int.Parse(string.IsNullOrWhiteSpace(penggunaId) ? "0" : penggunaId),
                Nama = nama ?? "",
                OrangId = int.Parse(string.IsNullOrWhiteSpace(orangId) ? "0" : orangId),
                Username = username ?? "",
                Nip = nip ?? "",
                StrukturOrganisasiId = int.Parse(string.IsNullOrWhiteSpace(strukturOrganisasiId) ? "0" : strukturOrganisasiId),
                StrukturOrganisasi = strukturOrganisasi ?? "",
                JenisPenggunaId = string.IsNullOrWhiteSpace(jenisPenggunaId) ? "0" : jenisPenggunaId,
                JenisPengguna = jenisPengguna ?? ""
            };
            return dataUser;
        }
        catch(Exception e)
        {
            var msg = e.InnerException?.Message ?? e.Message;
            return new UserAuhtDto();
        }
    }
}