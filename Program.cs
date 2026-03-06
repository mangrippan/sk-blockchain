using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using SriPayroll;
using SriPayroll.Helpers;
using SriPayroll.Services.LDAP;
using Microsoft.EntityFrameworkCore;
using SriPayroll.Services;
using Gelf.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SriPayroll.Models;

var builder = WebApplication.CreateBuilder(args);

var ldapSettings = builder.Configuration.GetSection("Ldap");
builder.Services.AddTransient<ILdapServer>(s => new LdapServer(ldapSettings["Host"], int.Parse(ldapSettings["Port"]),
    ldapSettings["BaseDn"], ldapSettings["Filter"]));


builder.Services.AddDbContext<DbPayrollContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DbPayroll")));

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = null;
    });
builder.Services.AddHttpClient();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var reportServerUsername = builder.Configuration["ReportServer:Username"];
var reportServerPassword = builder.Configuration["ReportServer:Password"];
builder.Services.AddHttpClient("ReportServerClient")
    .ConfigureHttpClient(client => { client.BaseAddress = new Uri(builder.Configuration["ReportServer:BaseUrl"]!); })
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler()
    {
        Credentials = new NetworkCredential(reportServerUsername, reportServerPassword)
    });
builder.Services.AddTransient<IReportServerService, ReportServerService>();

builder.Services.AddTransient<IAccountService, AccountService>();

builder.Services.AddProblemDetails();
builder.Services.AddHttpContextAccessor();

var signingKey = new SymmetricSecurityKey(
    Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]));

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                RequireExpirationTime = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = signingKey,
                ClockSkew = TimeSpan.Zero,
            });

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "All New SPMI API", Version = "v1" });
    options.OperationFilter<AuthorizationHeaderParameterOperationFilter>();
    options.UseInlineDefinitionsForEnums();
    options.AddSecurityDefinition(name: "Bearer", securityScheme: new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Description = "Enter the Bearer Authorization string as following: `Bearer Generated-JWT-Token`",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
});

#if DEBUG
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder =>
        {
            builder.WithOrigins("http://localhost:5018") // Replace with your frontend URL
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});
#endif

builder.Services.AddControllers(options => options.Filters
    .Add(typeof(ValidationFilter)));

var sfkey = builder.Configuration.GetSection("SyncfusionLicenseKey").Value;
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(sfkey);

builder.Logging.AddGelf();

var app = builder.Build();

app.UseMiddleware(typeof(ErrorHandlingMiddleware));


app.UseSwagger();
app.UseSwaggerUI();
app.UseStaticFiles();

app.UsePathBase("/api");

app.UseRouting();

#if DEBUG
app.UseCors("AllowSpecificOrigin");
#endif

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();