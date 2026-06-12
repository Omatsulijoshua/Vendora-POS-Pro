# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files for caching package restore
COPY ["backend/VendoraPOS.slnx", "backend/"]
COPY ["backend/src/VendoraPOS.Domain/VendoraPOS.Domain.csproj", "backend/src/VendoraPOS.Domain/"]
COPY ["backend/src/VendoraPOS.Application/VendoraPOS.Application.csproj", "backend/src/VendoraPOS.Application/"]
COPY ["backend/src/VendoraPOS.Infrastructure/VendoraPOS.Infrastructure.csproj", "backend/src/VendoraPOS.Infrastructure/"]
COPY ["backend/src/VendoraPOS.WebApi/VendoraPOS.WebApi.csproj", "backend/src/VendoraPOS.WebApi/"]

# Restore dependencies
RUN dotnet restore "backend/src/VendoraPOS.WebApi/VendoraPOS.WebApi.csproj"

# Copy all files and publish WebApi
COPY backend/ ./backend/
WORKDIR "/src/backend/src/VendoraPOS.WebApi"
RUN dotnet publish "VendoraPOS.WebApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Expose HTTP port
EXPOSE 80
ENV ASPNETCORE_URLS=http://+:80

ENTRYPOINT ["dotnet", "VendoraPOS.WebApi.dll"]
