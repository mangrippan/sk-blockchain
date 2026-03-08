using System;

namespace Backend.Utilities
{
    /// <summary>
    /// Utility class for password hashing operations
    /// </summary>
    public static class PasswordHashUtility
    {
        /// <summary>
        /// Generate a BCrypt hash for a given password
        /// </summary>
        /// <param name="password">Plain text password</param>
        /// <returns>BCrypt hashed password</returns>
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Verify a password against a BCrypt hash
        /// </summary>
        /// <param name="password">Plain text password</param>
        /// <param name="hash">BCrypt hash to verify against</param>
        /// <returns>True if password matches hash, false otherwise</returns>
        public static bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }

        /// <summary>
        /// Example usage - can be used in a test controller or console app
        /// </summary>
        public static void GenerateHashExample()
        {
            Console.WriteLine("Password Hash Generator");
            Console.WriteLine("======================");
            
            var passwords = new[] { "admin123", "dosen123", "reviewer123" };
            
            foreach (var password in passwords)
            {
                var hash = HashPassword(password);
                Console.WriteLine($"Password: {password}");
                Console.WriteLine($"Hash: {hash}");
                Console.WriteLine($"Verified: {VerifyPassword(password, hash)}");
                Console.WriteLine();
            }
        }
    }
}

