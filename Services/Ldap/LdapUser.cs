using SriPayroll.Services.LDAP;
using Novell.Directory.Ldap;

namespace SriPayroll.Services.LDAP
{
    public class LdapUser
    {
        public static LdapUser FromEntry(LdapEntry entry)
        {
            var attributes = entry.getAttributeSet();
            var iter = attributes.GetEnumerator();
            var user = new LdapUser();
            while (iter.MoveNext())
            {
                var attribute = (LdapAttribute)iter.Current;
                var attributeName = attribute.Name.ToUpper();
                var values = attribute.StringValueArray;
                switch (attributeName)
                {
                    case "UID":
                        user.Uid = values[0]; break;
                    case "CN":
                        user.Name = values[0]; break;
                    case "MAIL":
                        user.Email = values[0]; break;
                    case "NIP":
                        user.Nip = values[0]; break;
                    case "NRP":
                        user.Nim = values[0]; break;
                    case "ORANGID":
                        user.OrangId = values[0]; break;
                    case "MAHASISWAID":
                        user.MahasiswaId = values[0]; break;
                    case "OBJECTCLASS":
                        foreach (var v in values)
                        {
                            switch (v.ToLower())
                            {
                                case "student":
                                    user.TipeAkun = TipeAkunLdap.Student;
                                    break;
                                case "staff":
                                case "tendik":
                                    user.TipeAkun = TipeAkunLdap.Staff;
                                    break;
                                case "dosen":
                                    user.TipeAkun = TipeAkunLdap.Dosen;
                                    break;
                            }
                        }
                        break;
                }
            }

            return user;
        }

        public string Uid { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Nip { get; set; }
        public string Nim { get; set; }
        public string OrangId { get; set; }
        public string MahasiswaId { get; set; }
        public TipeAkunLdap TipeAkun { get; set; }
    }
}
