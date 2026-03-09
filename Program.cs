using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Backend;
using Backend.Helpers;
using Microsoft.EntityFrameworkCore;
using Backend.Services;
using Gelf.Extensions.Logging;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Backend.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<SkContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Db")));

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

builder.Services.AddTransient<IAccountService, AccountService>();
builder.Services.AddScoped<IBlockchainService, BlockchainService>();

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
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Sk Kenaikan Pangkat", Version = "v1" });
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