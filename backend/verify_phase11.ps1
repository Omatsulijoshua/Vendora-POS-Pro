# verify_phase11.ps1
# Integration test script for Phase 11 - Cashier Dashboard Analytics and Isolation

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 11 CASHIER DASHBOARD VERIFICATION"   -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Helper function to get status code from ErrorVariable
function Get-ErrorStatusCode($errors) {
    if (-not $errors -or $errors.Count -eq 0) { return $null }
    $e = $errors[0]
    
    if ($e.InnerException -and $e.InnerException.Response) {
        return [int]$e.InnerException.Response.StatusCode
    }
    
    if ($e.Exception -and $e.Exception.Response) {
        return [int]$e.Exception.Response.StatusCode
    }
    
    if ($e.Response) {
        return [int]$e.Response.StatusCode
    }
    
    return $null
}

# 1. Login as Platform Admin (SuperAdmin)
Write-Host "`n[1/7] Logging in as default SuperAdmin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@vendorapos.com"
    password = "AdminPassword123!"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -Headers $headers -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] SuperAdmin login failed. Make sure Web API is running." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$superToken = $res.token
Write-Host "[SUCCESS] SuperAdmin Logged in successfully." -ForegroundColor Green

# 2. Register a new Business Owner
$emailSuffix = Get-Random
$ownerEmail = "owner_stats_$emailSuffix@example.com"
$ownerPassword = "Password123!"
Write-Host "`n[2/7] Registering a new Business Owner ($ownerEmail)..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Stats"
    lastName = "Architect"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Apex Stats Shop $emailSuffix"
    subdomain = "apexstats$emailSuffix"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $registerBody -Headers $headers -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Registration failed." -ForegroundColor Red; Exit 1
}
$ownerToken = $res.token
$businessId = $res.businessId
Write-Host "[SUCCESS] Registered Business Owner. Business ID: $businessId" -ForegroundColor Green

$ownerHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerToken"
}

# 3. Create Branch and two Cashiers (Cathy and Charlie)
Write-Host "`n[3/7] Creating Branch and Cashiers Cathy & Charlie..." -ForegroundColor Yellow
$branchBody = @{ name = "Stats Branch"; address = "202 Stats St"; phone = "555-4321" } | ConvertTo-Json
$branch = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Branch creation failed." -ForegroundColor Red; Exit 1 }
$branchId = $branch.id
Write-Host "[SUCCESS] Branch Created: $branchId" -ForegroundColor Green

$cathyEmail = "cathy_stats_$emailSuffix@example.com"
$cathyBody = @{ firstName = "Cathy"; lastName = "Cashier"; email = $cathyEmail; password = "Password123!"; role = "Cashier"; branchId = $branchId } | ConvertTo-Json
$cathyUser = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cathyBody -Headers $ownerHeaders
Write-Host "[SUCCESS] Cashier Cathy created ($cathyEmail)." -ForegroundColor Green

$charlieEmail = "charlie_stats_$emailSuffix@example.com"
$charlieBody = @{ firstName = "Charlie"; lastName = "Cashier"; email = $charlieEmail; password = "Password123!"; role = "Cashier"; branchId = $branchId } | ConvertTo-Json
$charlieUser = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $charlieBody -Headers $ownerHeaders
Write-Host "[SUCCESS] Cashier Charlie created ($charlieEmail)." -ForegroundColor Green

# Create Category and Products
$categoryBody = @{ name = "Hardware"; description = "Tools" } | ConvertTo-Json
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $categoryBody -Headers $ownerHeaders
$categoryId = $catRes.id

$productBody1 = @{
    name = "Hammer"
    sku = "HAM-01"
    price = 15.00
    costPrice = 6.00
    categoryId = $categoryId
    initialStocks = @(@{ branchId = $branchId; quantity = 100; minStockLevel = 5 })
} | ConvertTo-Json
$prod1 = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $productBody1 -Headers $ownerHeaders
$productId1 = $prod1.id

$productBody2 = @{
    name = "Wrench"
    sku = "WRE-02"
    price = 25.00
    costPrice = 10.00
    categoryId = $categoryId
    initialStocks = @(@{ branchId = $branchId; quantity = 100; minStockLevel = 5 })
} | ConvertTo-Json
$prod2 = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $productBody2 -Headers $ownerHeaders
$productId2 = $prod2.id

# 4. Cathy processes a sale (1 Hammer, total $15.00 + tax $1.20 = $16.20)
Write-Host "`n[4/7] Logging in as Cathy and processing a checkout..." -ForegroundColor Yellow
$cathyLoginBody = @{ email = $cathyEmail; password = "Password123!" } | ConvertTo-Json
$cathyRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cathyLoginBody -Headers $headers
$cathyToken = $cathyRes.token
$cathyHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $cathyToken" }

$saleBody1 = @{
    paymentMethod = "Cash"
    discountAmount = 0.00
    taxAmount = 1.20
    items = @(@{ productId = $productId1; quantity = 1; unitPrice = 15.00; discountAmount = 0.00 })
} | ConvertTo-Json
$sale1 = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $saleBody1 -Headers $cathyHeaders
$cathySaleId = $sale1.id
Write-Host "[SUCCESS] Cathy checked out Sale: $cathySaleId" -ForegroundColor Green

# 5. Charlie processes a sale (1 Wrench, total $25.00 + tax $2.00 = $27.00)
Write-Host "`n[5/7] Logging in as Charlie and processing a checkout..." -ForegroundColor Yellow
$charlieLoginBody = @{ email = $charlieEmail; password = "Password123!" } | ConvertTo-Json
$charlieRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $charlieLoginBody -Headers $headers
$charlieToken = $charlieRes.token
$charlieHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $charlieToken" }

$saleBody2 = @{
    paymentMethod = "POS"
    discountAmount = 0.00
    taxAmount = 2.00
    items = @(@{ productId = $productId2; quantity = 1; unitPrice = 25.00; discountAmount = 0.00 })
} | ConvertTo-Json
$sale2 = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $saleBody2 -Headers $charlieHeaders
$charlieSaleId = $sale2.id
Write-Host "[SUCCESS] Charlie checked out Sale: $charlieSaleId" -ForegroundColor Green

# 6. Verify Sales Isolation
Write-Host "`n[6/7] Verifying sales isolation rules for cashiers..." -ForegroundColor Yellow

# Cathy lists sales
$cathySales = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Get -Headers $cathyHeaders
Write-Host "  - Cathy retrieved $($cathySales.Count) sales. (Expected: 1)" -ForegroundColor Gray
if ($cathySales.Count -ne 1) {
    Write-Host "[ERROR] Sales list size mismatch for Cathy." -ForegroundColor Red; Exit 1
}
if ($cathySales[0].id -ne $cathySaleId) {
    Write-Host "[ERROR] Cathy's retrieved sale did not match her processed sale." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Cashier sales listing successfully isolated." -ForegroundColor Green

# Cathy attempts to load Charlie's sale details
$null = Invoke-RestMethod -Uri "$baseUrl/api/sales/$charlieSaleId" -Method Get -Headers $cathyHeaders -ErrorAction SilentlyContinue -ErrorVariable cathyDetailErr
$cathyDetailStatus = Get-ErrorStatusCode $cathyDetailErr
Write-Host "  - Cathy lookup of Charlie's sale details status: $cathyDetailStatus (Expected: 403)" -ForegroundColor Gray
if ($cathyDetailStatus -ne 403) {
    Write-Host "[ERROR] Cathy was not forbidden from loading Charlie's sale details." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Cashier detail lookup restriction verified." -ForegroundColor Green

# 7. Verify Stats Calculations
Write-Host "`n[7/7] Verifying stats calculation endpoints..." -ForegroundColor Yellow
$cathyStats = Invoke-RestMethod -Uri "$baseUrl/api/sales/cashier-stats" -Method Get -Headers $cathyHeaders

Write-Host "  - Today's Sales Amount : $($cathyStats.todaySalesAmount) (Expected: 16.20)" -ForegroundColor Gray
Write-Host "  - Today's Sales Count  : $($cathyStats.todaySalesCount) (Expected: 1)" -ForegroundColor Gray
Write-Host "  - Lifetime Sales Count : $($cathyStats.lifetimeSalesCount) (Expected: 1)" -ForegroundColor Gray
Write-Host "  - Average Transaction  : $($cathyStats.averageTransactionValue) (Expected: 16.20)" -ForegroundColor Gray
Write-Host "  - Cash Payments Total  : $($cathyStats.paymentMethodAmounts.Cash) (Expected: 16.20)" -ForegroundColor Gray
Write-Host "  - Top Product Name     : $($cathyStats.topProducts[0].productName) (Expected: Hammer)" -ForegroundColor Gray
Write-Host "  - Top Product Quantity : $($cathyStats.topProducts[0].quantitySold) (Expected: 1)" -ForegroundColor Gray

if ($cathyStats.todaySalesAmount -ne 16.20 -or $cathyStats.todaySalesCount -ne 1) {
    Write-Host "[ERROR] Cathy stats values mismatch." -ForegroundColor Red; Exit 1
}
if ($cathyStats.topProducts[0].productName -ne "Hammer") {
    Write-Host "[ERROR] Top products grouping mismatch." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Cashier analytics and metrics calculated perfectly!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL PHASE 11 CASHIER DASHBOARD INTEGRATION TESTS PASSED!"    -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
