namespace SriPayroll.Services.LDAP
{
    public interface ILdapServer
    {
        LdapUser Authenticate(string username, string password);
        LdapUser GetUserByUid(string uid);
        string Filter { get; set; }
    }
}
