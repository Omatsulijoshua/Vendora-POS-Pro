# verify_phase8.ps1
# Integration test script for Phase 8 - POS Sales System Core

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 8 VERIFICATION SUITE" -ForegroundColor Cyan
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
Write-Host "`n[1/11] Logging in as default SuperAdmin..." -ForegroundColor Yellow
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
$ownerEmail = "owner_$emailSuffix@example.com"
$ownerPassword = "Password123!"
Write-Host "`n[2/11] Registering a new Business Owner ($ownerEmail)..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "POS"
    lastName = "Architect"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Apex Store $emailSuffix"
    subdomain = "apexstore$emailSuffix"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $registerBody -Headers $headers -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Registration failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$ownerToken = $res.token
$businessId = $res.businessId
Write-Host "[SUCCESS] Registered Business Owner. Business ID: $businessId" -ForegroundColor Green

$ownerHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerToken"
}

# 3. Create Branches (A and B)
Write-Host "`n[3/11] Creating Branch A and Branch B..." -ForegroundColor Yellow
$branchABody = @{ name = "Branch Alpha"; address = "101 Alpha Rd"; phone = "555-1111" } | ConvertTo-Json
$branchBBody = @{ name = "Branch Beta"; address = "202 Beta St"; phone = "555-2222" } | ConvertTo-Json

$branchA = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchABody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Branch Alpha creation failed." -ForegroundColor Red; Exit 1
}
$branchB = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchBBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Branch Beta creation failed." -ForegroundColor Red; Exit 1
}
$branchAId = $branchA.id
$branchBId = $branchB.id
Write-Host "[SUCCESS] Branch Alpha Created: $branchAId" -ForegroundColor Green
Write-Host "[SUCCESS] Branch Beta Created: $branchBId" -ForegroundColor Green

# 4. Register Staff (Cashier B at Branch Beta, Manager A at Branch Alpha)
Write-Host "`n[4/11] Creating Staff members..." -ForegroundColor Yellow

$managerAEmail = "mgr_a_$emailSuffix@example.com"
$cashierBEmail = "csh_b_$emailSuffix@example.com"

$mgrABody = @{ firstName = "Amy"; lastName = "Manager"; email = $managerAEmail; password = "Password123!"; role = "Manager"; branchId = $branchAId } | ConvertTo-Json
$cshBBody = @{ firstName = "Cathy"; lastName = "Cashier"; email = $cashierBEmail; password = "Password123!"; role = "Cashier"; branchId = $branchBId } | ConvertTo-Json

$mgrA = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $mgrABody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Manager A creation failed." -ForegroundColor Red; Exit 1 }
$cshB = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cshBBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Cashier B creation failed." -ForegroundColor Red; Exit 1 }

Write-Host "[SUCCESS] Staff members created successfully." -ForegroundColor Green

# 5. Authenticate Staff Users
Write-Host "`n[5/11] Logging in as Staff..." -ForegroundColor Yellow

$mgrALoginBody = @{ email = $managerAEmail; password = "Password123!" } | ConvertTo-Json
$mgrARes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $mgrALoginBody -Headers $headers
$mgrAToken = $mgrARes.token
$mgrAHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $mgrAToken" }

$cshBLoginBody = @{ email = $cashierBEmail; password = "Password123!" } | ConvertTo-Json
$cshBRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cshBLoginBody -Headers $headers
$cshBToken = $cshBRes.token
$cshBHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $cshBToken" }

Write-Host "[SUCCESS] Staff tokens generated." -ForegroundColor Green

# 6. Create Category and Coke product with initial stocks
Write-Host "`n[6/11] Creating Beverages category and Coke product..." -ForegroundColor Yellow

$categoryBody = @{ name = "Beverages"; description = "Drinks" } | ConvertTo-Json
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $categoryBody -Headers $ownerHeaders
$categoryId = $catRes.id

$cokeBody = @{
    name = "Coca Cola"
    sku = "COKE-01"
    barcode = "123456789012"
    price = 2.00
    costPrice = 1.20
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchAId; quantity = 50; minStockLevel = 10 }
        @{ branchId = $branchBId; quantity = 10; minStockLevel = 5 }
    )
} | ConvertTo-Json

$cokeRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $cokeBody -Headers $ownerHeaders
$cokeId = $cokeRes.id
Write-Host "[SUCCESS] Created Coca Cola (ID: $cokeId) with stock A: 50, B: 10" -ForegroundColor Green

# 7. Cashier checkout: Cathy (Branch Beta) checks out 3 Cokes using Mixed Payment Mode
Write-Host "`n[7/11] Cathy Cashier (Branch Beta) checkout 3 Cokes ($2.00 each) via Mixed Payments..." -ForegroundColor Yellow

$checkoutBody = @{
    paymentMethod = "Mixed"
    paymentDetails = '{"cash": 2.00, "transfer": 4.00, "pos": 0.00}'
    discountAmount = 0.00
    taxAmount = 0.00
    items = @(
        @{
            productId = $cokeId
            quantity = 3
            unitPrice = 2.00
            discountAmount = 0.00
        }
    )
} | ConvertTo-Json

$saleRes = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $checkoutBody -Headers $cshBHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Checkout failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$saleId = $saleRes.id
Write-Host "[SUCCESS] Sale created successfully! Receipt ID: $saleId" -ForegroundColor Green
Write-Host "  - Total Amount: $($saleRes.total)" -ForegroundColor Gray
Write-Host "  - Cashier: $($saleRes.cashierName)" -ForegroundColor Gray
Write-Host "  - Branch: $($saleRes.branchName)" -ForegroundColor Gray

# Verify stock of Branch Beta decreased from 10 to 7
$prodB = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $cshBHeaders
$cokeB = $prodB | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch Beta Coke Stock after checkout: $($cokeB.totalStock) (Expected: 7)" -ForegroundColor Gray
if ($cokeB.totalStock -ne 7) {
    Write-Host "[ERROR] Branch Beta stock not deducted correctly." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Atomic stock deduction verified." -ForegroundColor Green

# 8. Insufficient Stock Validation Check: Cathy checkout 10 Cokes (Only 7 available)
Write-Host "`n[8/11] Cathy checks out 10 Cokes (should fail due to insufficient stock)..." -ForegroundColor Yellow

$overdraftBody = @{
    paymentMethod = "Cash"
    discountAmount = 0.00
    taxAmount = 0.00
    items = @(
        @{
            productId = $cokeId
            quantity = 10
            unitPrice = 2.00
            discountAmount = 0.00
        }
    )
} | ConvertTo-Json

$overdraftErr = $null
$resOverdraft = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/sales" -Method Post -Body $overdraftBody -Headers $cshBHeaders -ErrorAction SilentlyContinue -ErrorVariable overdraftErr
$status = Get-ErrorStatusCode $overdraftErr
Write-Host "  - Checkout status code: $status (Expected: 400)" -ForegroundColor Gray
if ($status -ne 400) {
    Write-Host "[ERROR] Checkout succeeded or did not return 400 Bad Request." -ForegroundColor Red
    Exit 1
}

# Verify stock of Branch Beta remains 7
$prodB2 = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $cshBHeaders
$cokeB2 = $prodB2 | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch Beta Coke Stock after failed checkout: $($cokeB2.totalStock) (Expected: 7)" -ForegroundColor Gray
if ($cokeB2.totalStock -ne 7) {
    Write-Host "[ERROR] Stock level changed during failed transaction." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Insufficient stock check rejected and transaction rolled back." -ForegroundColor Green

# 9. Verify Cost Price Logging (for Profit/Cost reporting accuracy)
Write-Host "`n[9/11] Verifying item cost price is locked at the time of sale..." -ForegroundColor Yellow
$saleDetail = Invoke-RestMethod -Uri "$baseUrl/api/sales/$saleId" -Method Get -Headers $cshBHeaders
$saleItem = $saleDetail.items[0]
Write-Host "  - Locked Cost Price: $($saleItem.costPrice) (Expected: 1.2)" -ForegroundColor Gray
if ($saleItem.costPrice -ne 1.20) {
    Write-Host "[ERROR] Cost price was not correctly captured on checkout." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Cost price successfully logged." -ForegroundColor Green

# 10. Authorization & Multi-Branch Isolation Checks
Write-Host "`n[10/11] Verifying branch access isolation constraints..." -ForegroundColor Yellow

# Owner logs in and creates a sale at Branch Alpha
$ownerCheckoutBody = @{
    paymentMethod = "Cash"
    discountAmount = 0.00
    taxAmount = 0.00
    items = @(
        @{
            productId = $cokeId
            quantity = 5
            unitPrice = 2.00
            discountAmount = 0.00
        }
    )
} | ConvertTo-Json

# Owner switches context to Branch Alpha
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/$branchAId" -Method Post -Headers $ownerHeaders
$ownerActiveHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $($switchRes.token)"
}

$alphaSale = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $ownerCheckoutBody -Headers $ownerActiveHeaders
$alphaSaleId = $alphaSale.id
Write-Host "[SUCCESS] Owner created sale at Branch Alpha. Receipt ID: $alphaSaleId" -ForegroundColor Green

# Cashier Cathy (Branch Beta) attempts to view details of Branch Alpha's sale (should fail with 403 Forbidden)
$crossBranchErr = $null
$resCross = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/sales/$alphaSaleId" -Method Get -Headers $cshBHeaders -ErrorAction SilentlyContinue -ErrorVariable crossBranchErr
$status = Get-ErrorStatusCode $crossBranchErr
Write-Host "  - Cashier B reading Branch A's sale detail status: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) {
    Write-Host "[ERROR] Cashier B was not blocked from reading other branch's sale detail." -ForegroundColor Red
    Exit 1
}

# Cashier Cathy lists sales (should only see Branch Beta sales, not Branch Alpha sales)
$cshSalesList = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Get -Headers $cshBHeaders
$hasAlphaSale = $cshSalesList | Where-Object { $_.id -eq $alphaSaleId }
Write-Host "  - Cashier B sales list contains Branch A sale: $(if ($hasAlphaSale) { "Yes" } else { "No" }) (Expected: No)" -ForegroundColor Gray
if ($hasAlphaSale) {
    Write-Host "[ERROR] Cashier sales history list was not isolated to their branch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Cashier access isolation constraints verified." -ForegroundColor Green

# 11. Verify StockAdjustmentLog generated
Write-Host "`n[11/11] Verifying StockAdjustmentLog audit logs exist..." -ForegroundColor Yellow
$logsB = Invoke-RestMethod -Uri "$baseUrl/api/products/$cokeId/adjustment-logs" -Method Get -Headers $cshBHeaders
$checkoutLog = $logsB | Where-Object { $_.reason -like "*Checkout Sale*" }
Write-Host "  - Log Count for Branch Beta Coke: $($logsB.Count)" -ForegroundColor Gray
Write-Host "  - Checkout sale audit log details: $($checkoutLog.reason)" -ForegroundColor Gray
if (-not $checkoutLog) {
    Write-Host "[ERROR] No stock adjustment log recorded for the sale checkout." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Audit logging verified." -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  PHASE 8 VERIFICATION COMPLETED: ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
