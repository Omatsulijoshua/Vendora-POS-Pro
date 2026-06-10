# verify_phase14_auditing.ps1
# Integration test script for Phase 14 - Audit Log System

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 14 AUDIT LOG INTEGRATION TESTS"     -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Setup Tenant and Users
$emailSuffix = Get-Random
$ownerEmail = "audit_owner_$emailSuffix@example.com"
$ownerPassword = "Password123!"
$subdomain = "audit$emailSuffix"

Write-Host "`n[1] Registering a new Owner ($ownerEmail) and Business..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Audit"
    lastName = "Owner"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Audited Business $emailSuffix"
    subdomain = $subdomain
} | ConvertTo-Json

$registerRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $registerBody -Headers $headers
$ownerToken = $registerRes.token
$businessId = $registerRes.businessId
Write-Host "[SUCCESS] Owner registered. Business ID: $businessId" -ForegroundColor Green

$ownerHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerToken"
}

# 2. Test Login Auditing
Write-Host "`n[2] Testing Login Auditing (Failure & Success)..." -ForegroundColor Yellow

# Failure
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $ownerEmail; password = "WrongPassword" } | ConvertTo-Json) -Headers $headers
} catch {}

# Success
$null = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $ownerEmail; password = $ownerPassword } | ConvertTo-Json) -Headers $headers

# Wait to write
Start-Sleep -Seconds 1

# Query logs as Owner
$logs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $ownerHeaders

$loginFailureLog = $logs | Where-Object { $_.action -eq "LoginFailure" -and $_.actorEmail -eq $ownerEmail }
if ($null -eq $loginFailureLog) {
    Write-Host "[ERROR] LoginFailure audit log not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] LoginFailure audit log verified." -ForegroundColor Green

$loginSuccessLog = $logs | Where-Object { $_.action -eq "LoginSuccess" -and $_.actorEmail -eq $ownerEmail }
if ($null -eq $loginSuccessLog) {
    Write-Host "[ERROR] LoginSuccess audit log not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] LoginSuccess audit log verified." -ForegroundColor Green

# 3. Create Branch, Cashier, Category, Product, and Coupon for Sale Checkout
Write-Host "`n[3] Creating entities for sale checkout..." -ForegroundColor Yellow

# Create Branch
$branchRes = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body (@{ name = "Main Branch"; address = "123 Main St"; phone = "555-0199" } | ConvertTo-Json) -Headers $ownerHeaders
$branchId = $branchRes.id

# Create Cashier
$cashierEmail = "cashier_$emailSuffix@example.com"
$staffBody = @{
    firstName = "John"
    lastName = "Cashier"
    email = $cashierEmail
    password = "Password123!"
    role = "Cashier"
    branchId = $branchId
} | ConvertTo-Json
$staffRes = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $staffBody -Headers $ownerHeaders
Write-Host "Created Cashier: $cashierEmail" -ForegroundColor Gray

# Login as Cashier
$cashierLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $cashierEmail; password = "Password123!" } | ConvertTo-Json) -Headers $headers
$cashierToken = $cashierLogin.token
$cashierHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $cashierToken"
}

# Create Category
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body (@{ name = "AuditCat"; description = "Audit Category" } | ConvertTo-Json) -Headers $ownerHeaders
$categoryId = $catRes.id

# Create Product (with initial stock)
$prodBody = @{
    name = "Audit Product"
    sku = "AUD-SKU-$emailSuffix"
    barcode = "AUD-BARCODE-$emailSuffix"
    description = "Audit Product Description"
    price = 100.00
    costPrice = 60.00
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchId; quantity = 10; minStockLevel = 2 }
    )
} | ConvertTo-Json

$prodRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodBody -Headers $ownerHeaders
$productId = $prodRes.id
Write-Host "Created Product ID: $productId" -ForegroundColor Gray

# Create Coupon
$couponBody = @{
    code = "AUDIT10"
    type = "Percentage"
    value = 10.00
    minCartAmount = 50.00
    usageLimit = 5
    startDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    endDate = (Get-Date).AddDays(5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    isActive = $true
} | ConvertTo-Json
$couponRes = Invoke-RestMethod -Uri "$baseUrl/api/coupons" -Method Post -Body $couponBody -Headers $ownerHeaders
Write-Host "Created Coupon" -ForegroundColor Gray

# 4. Perform Checkout and Verify Audits
Write-Host "`n[4] Performing Checkout with Coupon..." -ForegroundColor Yellow

$checkoutBody = @{
    items = @(
        @{ productId = $productId; quantity = 2; unitPrice = 100.00; discountAmount = 0.00 }
    )
    discountAmount = 20.00
    taxAmount = 14.40
    paymentMethod = "Cash"
    couponCode = "AUDIT10"
} | ConvertTo-Json

$saleRes = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $checkoutBody -Headers $cashierHeaders
$saleId = $saleRes.id
Write-Host "Checkout complete. Sale ID: $saleId" -ForegroundColor Gray

# Verify Audit Logs
Start-Sleep -Seconds 1
$logs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $ownerHeaders

$saleProcessedLog = $logs | Where-Object { $_.action -eq "SaleProcessed" -and $_.details -like "*Processed sale $saleId*" }
if ($null -eq $saleProcessedLog) {
    Write-Host "[ERROR] SaleProcessed audit log not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] SaleProcessed audit log verified." -ForegroundColor Green

$couponAppliedLog = $logs | Where-Object { $_.action -eq "CouponApplied" -and $_.details -like "*Applied coupon 'AUDIT10'*" }
if ($null -eq $couponAppliedLog) {
    Write-Host "[ERROR] CouponApplied audit log not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] CouponApplied audit log verified." -ForegroundColor Green

# 5. Perform Refund and Verify Restocking / Audits
Write-Host "`n[5] Refunding Sale ID: $saleId..." -ForegroundColor Yellow

# Check stock before refund
$prodBefore = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId" -Method Get -Headers $ownerHeaders
Write-Host "Stock before refund (expected 8): $($prodBefore.totalStock)" -ForegroundColor Gray
if ($prodBefore.totalStock -ne 8) {
    Write-Host "[ERROR] Stock level is not 8 before refund." -ForegroundColor Red; Exit 1
}

# Refund
$refundRes = Invoke-RestMethod -Uri "$baseUrl/api/sales/$saleId/refund" -Method Post -Headers $ownerHeaders
Write-Host "Refund Response: $($refundRes.message)" -ForegroundColor Gray

# Check stock after refund (should be 10 again)
$prodAfter = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId" -Method Get -Headers $ownerHeaders
Write-Host "Stock after refund (expected 10): $($prodAfter.totalStock)" -ForegroundColor Gray
if ($prodAfter.totalStock -ne 10) {
    Write-Host "[ERROR] Stock level was not restored to 10." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Stock level successfully restored." -ForegroundColor Green

# Verify refund and stock adjustment log entries
Start-Sleep -Seconds 1
$logs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $ownerHeaders

$saleRefundedLog = $logs | Where-Object { $_.action -eq "SaleRefunded" -and $_.details -like "*Refunded sale $saleId*" }
if ($null -eq $saleRefundedLog) {
    Write-Host "[ERROR] SaleRefunded audit log not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] SaleRefunded audit log verified." -ForegroundColor Green

# 6. Test Promotions (Discounts/Coupons CRUD) Auditing
Write-Host "`n[6] Testing Discount CRUD Auditing..." -ForegroundColor Yellow

$discBody = @{
    name = "Audit Discount"
    description = "Test audit"
    type = "FixedAmount"
    value = 15.00
    target = "Cart"
    minCartAmount = 100.00
    startDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    endDate = (Get-Date).AddDays(2).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    isActive = $true
} | ConvertTo-Json

$discRes = Invoke-RestMethod -Uri "$baseUrl/api/discounts" -Method Post -Body $discBody -Headers $ownerHeaders
$discId = $discRes.id

$null = Invoke-RestMethod -Uri "$baseUrl/api/discounts/$discId" -Method Delete -Headers $ownerHeaders
Write-Host "Created and deleted discount." -ForegroundColor Gray

Start-Sleep -Seconds 1
$logs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $ownerHeaders

$discCreatedLog = $logs | Where-Object { $_.action -eq "DiscountCreated" -and $_.details -like "*Audit Discount*" }
$discDeletedLog = $logs | Where-Object { $_.action -eq "DiscountDeleted" -and $_.details -like "*Audit Discount*" }

if ($null -eq $discCreatedLog -or $null -eq $discDeletedLog) {
    Write-Host "[ERROR] Discount audit logs not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Discount CRUD audit logs verified." -ForegroundColor Green

# 7. Test Manual Stock Adjustments Auditing
Write-Host "`n[7] Testing Manual Stock Adjustments Auditing..." -ForegroundColor Yellow

$adjustBody = @{
    branchId = $branchId
    quantity = 15
    minStockLevel = 2
    reason = "Manual audit test adjust"
} | ConvertTo-Json

$adjustRes = Invoke-RestMethod -Uri "$baseUrl/api/products/$productId/adjust-stock" -Method Put -Body $adjustBody -Headers $ownerHeaders

Start-Sleep -Seconds 1
$logs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $ownerHeaders

$stockAdjustedLog = $logs | Where-Object { $_.action -eq "StockAdjusted" -and $_.details -like "*Manual audit test adjust*" }
if ($null -eq $stockAdjustedLog) {
    Write-Host "[ERROR] StockAdjusted audit log not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] StockAdjusted audit log verified." -ForegroundColor Green

# 8. Test Stock Transfers Auditing
Write-Host "`n[8] Testing Stock Transfers Auditing..." -ForegroundColor Yellow

# Create a second branch
$branch2Res = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body (@{ name = "Second Branch"; address = "456 Side St"; phone = "555-0200" } | ConvertTo-Json) -Headers $ownerHeaders
$branch2Id = $branch2Res.id

# Initiate Transfer
$transferBody = @{
    productId = $productId
    sourceBranchId = $branchId
    targetBranchId = $branch2Id
    quantity = 3
    notes = "Test Audit Transfer"
} | ConvertTo-Json

$transferRes = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $transferBody -Headers $ownerHeaders
$transferId = $transferRes.id

# Approve Transfer
$null = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers/$transferId/approve" -Method Put -Body (@{ notes = "Approving transfer" } | ConvertTo-Json) -Headers $ownerHeaders

Start-Sleep -Seconds 1
$logs = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $ownerHeaders

$transferInitiatedLog = $logs | Where-Object { $_.action -eq "StockTransferInitiated" -and $_.details -like "*transfer $transferId*" }
$transferApprovedLog = $logs | Where-Object { $_.action -eq "StockTransferApproved" -and $_.details -like "*transfer $transferId*" }

if ($null -eq $transferInitiatedLog -or $null -eq $transferApprovedLog) {
    Write-Host "[ERROR] Stock transfer audit logs not found." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Stock transfer audit logs verified." -ForegroundColor Green

# 9. Test Role Isolation for Audit Logs (Cashier should be forbidden)
Write-Host "`n[9] Testing Role Isolation for /api/audit-logs..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/audit-logs" -Method Get -Headers $cashierHeaders
    Write-Host "[ERROR] Cashier was allowed to retrieve audit logs!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Cashier access to audit logs is correctly forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier access: $statusCode" -ForegroundColor Red; Exit 1
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL AUDIT LOG SYSTEM INTEGRATION TESTS PASSED!"           -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
