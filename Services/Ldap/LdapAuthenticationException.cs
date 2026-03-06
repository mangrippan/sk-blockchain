using System;

namespace SriPayroll.Services.LDAP
{
    public class LdapAuthenticationException : Exception
    {
        public LdapAuthenticationException()
        {
        }

        public LdapAuthenticationException(string message) : base(message)
        {
        }
    }
}
