#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
#USER app
WORKDIR /app
EXPOSE 8080

RUN apt-get update \
    && apt-get install -y --allow-unauthenticated \
        libc6-dev \
        libgdiplus \
        libx11-dev \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
RUN curl -sL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -yq nodejs

WORKDIR /src
COPY ["Frontend/nuget.config", "Frontend/"]
COPY ["SriPayroll.csproj", "."]
COPY ["Frontend/frontend.esproj", "Frontend/"]
ENV DOTNET_NUGET_SIGNATURE_VERIFICATION=false
RUN dotnet restore "./SriPayroll.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "SriPayroll.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SriPayroll.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SriPayroll.dll"]