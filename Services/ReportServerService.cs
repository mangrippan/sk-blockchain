namespace SriPayroll.Services;

public interface IReportServerService
{
    Task<byte[]?> GetReportForm(string formType, int? formId);
}

public class ReportServerService : IReportServerService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ReportServerService> _logger;

    public ReportServerService(IHttpClientFactory httpClientFactory, ILogger<ReportServerService> logger)
    {
        _logger = logger;

        _httpClient = httpClientFactory.CreateClient("ReportServerClient");
    }

    public async Task<byte[]?> GetReportForm(string formType, int? formId)
    {
        var url = $"/ReportServer2016/Pages/ReportViewer.aspx?%2fSPMI%2f{formType}&{formType}ID={formId}&rs:Format=PDF";
        var request = new HttpRequestMessage(HttpMethod.Get, url);

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError($"Failed to get report from report server. Status code: {response.StatusCode}");
            return null;
        }

        return await response.Content.ReadAsByteArrayAsync();
    }
}