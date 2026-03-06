using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using SriPayroll.Services.LDAP;
using Novell.Directory.Ldap;

namespace SriPayroll.Services.LDAP
{
    public class LdapServer : ILdapServer
    {
        public LdapServer(string hostName, int port, string baseDn, string filter)
        {
            this.HostName = hostName;
            this.Port = port;
            this.BaseDn = baseDn;
            this.Filter = filter;
        }

        public string HostName { get; private set; }
        public int Port { get; private set; }
        public string BaseDn { get; set; }
        public string Filter { get; set; }

        public LdapUser Authenticate(string userName, string password)
        {
            userName = _sanitizeUsername(userName);
            if (string.IsNullOrEmpty(userName) || string.IsNullOrEmpty(password))
            {
                throw new LdapAuthenticationException("Empty user or password");
            }
            using (var ldap = new LdapConnection())
            {
                try
                {
                    ldap.Connect(this.HostName, this.Port);
                    ldap.Bind(null, null); // anonymous bind
                }
                catch (LdapException)
                {
                    throw new Exception("Error connecting to LDAP server");
                }

                var entry = GetEntry(ldap, userName);
#if DEBUG
                return LdapUser.FromEntry(entry);
#endif
                var dn = entry.DN;
                try
                {
                    ldap.Bind(dn, password);
                    return LdapUser.FromEntry(entry);
                }
                catch (LdapException)
                {
                    throw new LdapAuthenticationException("Invalid user or password");
                }
            }
        }

        public LdapUser GetUserByUid(string uid)
        {
            var userName = _sanitizeUsername(uid);
            if (string.IsNullOrEmpty(userName))
            {
                throw new LdapAuthenticationException("Empty user or password");
            }
            using (var ldap = new LdapConnection())
            {
                try
                {
                    ldap.Connect(this.HostName, this.Port);
                    ldap.Bind(null, null); // anonymous bind
                }
                catch (LdapException)
                {
                    throw new Exception("Error connecting to LDAP server");
                }

                var entry = GetEntry(ldap, userName);
                return LdapUser.FromEntry(entry);
            }
        }

        protected LdapEntry GetEntry(LdapConnection ldap, string userName)
        {
            var search = ldap.Search(this.BaseDn, LdapConnection.SCOPE_SUB, string.Format(CultureInfo.InvariantCulture, this.Filter, userName), null, false);
            var entries = new List<LdapEntry>();
            foreach (var entry in search)
            {
                entries.Add(entry);
            }

            if (entries.Count == 1)
            {
                return entries.First();
            }
            throw new LdapAuthenticationException("Error getting distinguished name");
        }

        protected static string _sanitizeUsername(string username)
        {
            var arr = username.Where(c => char.IsLetterOrDigit(c) ||
                                          c == '_' ||
                                          c == '-' ||
                                          c == '.').ToArray();
            return new string(arr);
        }
    }
}
