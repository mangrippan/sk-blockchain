using System.Globalization;

namespace Backend.Helpers;

public static class StringExtension
{
    public static string ToTitleCase(this string s) 
    {
        return CultureInfo.CurrentCulture.TextInfo.ToTitleCase(s.ToLower());
    }

    public static string Truncate(this string value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) { return value; }
        return value.Substring(0, System.Math.Min(value.Length, maxLength));
    }

    public static string MakeSafeFilename(this string filename, char replaceChar)
    {
        foreach (char c in System.IO.Path.GetInvalidFileNameChars())
        {
            filename = filename.Replace(c, replaceChar);
        }
        return filename;
    }
}