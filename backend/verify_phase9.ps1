# verify_phase9.ps1
# Integration test script for Phase 9 - Discount & Coupon System

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 9 DISCOUNT & COUPON VERIFICATION" -ForegroundColor Cyan
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

# Helper function to parse error response message
function Get-ErrorMessage($errors) {
    if (-not $errors -or $errors.Count -eq 0) { return "" }
    $e = $errors[0]
    try {
        if ($e.Response) {
            $reader = New-Object System.IO.StreamReader($e.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            $jsonObj = ConvertFrom-Json $body
            return $jsonObj.Message
        }
        if ($e.InnerException -and $e.InnerException.Response) {
            $reader = New-Object System.IO.StreamReader($e.InnerException.Response.GetResponseStream())
            $body = $reader.ReadToEnd()
            $jsonObj = ConvertFrom-Json $body
            return $jsonObj.Message
        }
    } catch {
        return $_.Exception.Message
    }
    return ""
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
    firstName = "Promo"
    lastName = "Architect"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Apex Promo Shop $emailSuffix"
    subdomain = "apexpromo$emailSuffix"
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

# 3. Create Branch and Staff (Cashier Cathy)
Write-Host "`n[3/11] Creating Branch and Cashier..." -ForegroundColor Yellow
$branchBody = @{ name = "Promo Branch"; address = "101 Promo Rd"; phone = "555-9999" } | ConvertTo-Json
$branch = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Branch creation failed." -ForegroundColor Red; Exit 1
}
$branchId = $branch.id
Write-Host "[SUCCESS] Branch Created: $branchId" -ForegroundColor Green

$cashierEmail = "cathy_$emailSuffix@example.com"
$cshBody = @{ firstName = "Cathy"; lastName = "Cashier"; email = $cashierEmail; password = "Password123!"; role = "Cashier"; branchId = $branchId } | ConvertTo-Json
$csh = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cshBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Cashier creation failed." -ForegroundColor Red; Exit 1 }
Write-Host "[SUCCESS] Cashier Cathy created." -ForegroundColor Green

# 4. Authenticate Cashier Cathy
Write-Host "`n[4/11] Logging in as Cathy..." -ForegroundColor Yellow
$cshLoginBody = @{ email = $cashierEmail; password = "Password123!" } | ConvertTo-Json
$cshRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cshLoginBody -Headers $headers
$cshToken = $cshRes.token
$cshHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $cshToken" }
Write-Host "[SUCCESS] Cathy Logged in." -ForegroundColor Green

# 5. Create Category and Product (Laptop, $1000)
Write-Host "`n[5/11] Creating Products..." -ForegroundColor Yellow
$categoryBody = @{ name = "Electronics"; description = "Gadgets" } | ConvertTo-Json
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $categoryBody -Headers $ownerHeaders
$categoryId = $catRes.id

$laptopBody = @{
    name = "Apex Laptop"
    sku = "LAPTOP-X1"
    price = 1000.00
    costPrice = 600.00
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchId; quantity = 10; minStockLevel = 1 }
    )
} | ConvertTo-Json
$laptopRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $laptopBody -Headers $ownerHeaders
$laptopId = $laptopRes.id
Write-Host "[SUCCESS] Laptop created (ID: $laptopId) with stock 10." -ForegroundColor Green

# 6. Cashier Cathy attempts discount > $50.00 (should be blocked)
Write-Host "`n[6/11] Cashier Cathy attempts manual discount of `$60.00 (should fail)..." -ForegroundColor Yellow
$overAmountBody = @{
    paymentMethod = "Cash"
    discountAmount = 60.00
    taxAmount = 0.00
    items = @( @{ productId = $laptopId; quantity = 1; unitPrice = 1000.00; discountAmount = 0.00 } )
} | ConvertTo-Json

$checkoutErr = $null
$resOverAmount = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/sales" -Method Post -Body $overAmountBody -Headers $cshHeaders -ErrorAction SilentlyContinue -ErrorVariable checkoutErr
$status = Get-ErrorStatusCode $checkoutErr
$msg = Get-ErrorMessage $checkoutErr
Write-Host "  - Checkout status: $status (Expected: 400)" -ForegroundColor Gray
Write-Host "  - Error message: '$msg'" -ForegroundColor Gray
if ($status -ne 400 -or $msg -notlike "*exceeding `$50.00*") {
    Write-Host "[ERROR] Limit validation for absolute dollar limit failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Cashier absolute dollar limit check successfully blocked transaction." -ForegroundColor Green

# 7. Cashier Cathy attempts discount > 15% (e.g. $40.00 on $200.00 subtotal, which is 20%)
Write-Host "`n[7/11] Cashier Cathy attempts manual discount of `$40.00 on `$200.00 subtotal (should fail)..." -ForegroundColor Yellow
$overPercentageBody = @{
    paymentMethod = "Cash"
    discountAmount = 40.00
    taxAmount = 0.00
    items = @( @{ productId = $laptopId; quantity = 1; unitPrice = 200.00; discountAmount = 0.00 } )
} | ConvertTo-Json

$checkoutErr = $null
$resOverPct = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/sales" -Method Post -Body $overPercentageBody -Headers $cshHeaders -ErrorAction SilentlyContinue -ErrorVariable checkoutErr
$status = Get-ErrorStatusCode $checkoutErr
$msg = Get-ErrorMessage $checkoutErr
Write-Host "  - Checkout status: $status (Expected: 400)" -ForegroundColor Gray
Write-Host "  - Error message: '$msg'" -ForegroundColor Gray
if ($status -ne 400 -or $msg -notlike "*exceeding 15%*") {
    Write-Host "[ERROR] Limit validation for percentage limit failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Cashier percentage limit check successfully blocked transaction." -ForegroundColor Green

# 8. Create Coupon (SAVE10, Percentage 10%, usageLimit = 2)
Write-Host "`n[8/11] Owner creating coupon SAVE10 (Limit: 2 usages)..." -ForegroundColor Yellow
$now = [DateTime]::UtcNow
$couponBody = @{
    code = "SAVE10"
    type = "Percentage"
    value = 10.00
    minCartAmount = 100.00
    usageLimit = 2
    startDate = $now.ToString("yyyy-MM-ddTHH:mm:ssZ")
    endDate = $now.AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
    isActive = $true
} | ConvertTo-Json

$couponRes = Invoke-RestMethod -Uri "$baseUrl/api/coupons" -Method Post -Body $couponBody -Headers $ownerHeaders
$couponId = $couponRes.id
Write-Host "[SUCCESS] Coupon SAVE10 created (ID: $couponId)." -ForegroundColor Green

# 9. Perform Coupon Validation endpoint check
Write-Host "`n[9/11] Testing Coupon Validation Endpoint..." -ForegroundColor Yellow
$validateRes = Invoke-RestMethod -Uri "$baseUrl/api/coupons/validate/SAVE10?cartTotal=500" -Method Get -Headers $cshHeaders
Write-Host "  - Coupon is valid: $($validateRes.isValid) (Expected: True)" -ForegroundColor Gray
Write-Host "  - Coupon type: $($validateRes.type) (Expected: Percentage)" -ForegroundColor Gray
Write-Host "  - Coupon value: $($validateRes.value) (Expected: 10)" -ForegroundColor Gray
if (-not $validateRes.isValid -or $validateRes.type -ne "Percentage" -or $validateRes.value -ne 10) {
    Write-Host "[ERROR] Coupon validation endpoint failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Coupon validation endpoint matches expected output." -ForegroundColor Green

# 10. Test Coupon usage limit exhaustion (Limit: 2 usages)
Write-Host "`n[10/11] Checkout with coupon (Usages 1 & 2)..." -ForegroundColor Yellow

$checkoutWithCouponBody = @{
    paymentMethod = "Cash"
    discountAmount = 10.00 # 10% coupon discount
    taxAmount = 0.00
    couponCode = "SAVE10"
    items = @( @{ productId = $laptopId; quantity = 1; unitPrice = 100.00; discountAmount = 0.00 } )
} | ConvertTo-Json

# Usage 1
$sale1 = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $checkoutWithCouponBody -Headers $cshHeaders
Write-Host "  - Sale 1 Completed. Sale ID: $($sale1.id). Coupon Audit Code: $($sale1.appliedCouponCode)" -ForegroundColor Gray

# Usage 2
$sale2 = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $checkoutWithCouponBody -Headers $cshHeaders
Write-Host "  - Sale 2 Completed. Sale ID: $($sale2.id). Coupon Audit Code: $($sale2.appliedCouponCode)" -ForegroundColor Gray

# Usage 3 (should fail due to usage limit)
Write-Host "  - Attempting Usage 3 (should fail)..." -ForegroundColor Gray
$checkoutErr = $null
$resUsage3 = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/sales" -Method Post -Body $checkoutWithCouponBody -Headers $cshHeaders -ErrorAction SilentlyContinue -ErrorVariable checkoutErr
$status = Get-ErrorStatusCode $checkoutErr
$msg = Get-ErrorMessage $checkoutErr
Write-Host "  - Checkout status: $status (Expected: 400)" -ForegroundColor Gray
Write-Host "  - Error message: '$msg'" -ForegroundColor Gray
if ($status -ne 400 -or $msg -notlike "*usage limit*") {
    Write-Host "[ERROR] Coupon usage limits not enforced correctly." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Coupon usage count enforcement verified." -ForegroundColor Green

# 11. Owner Checkout overriding limits (Owner checkout with $150 discount)
Write-Host "`n[11/11] Owner checkout with `$150.00 discount (overriding Cashier limit checks)..." -ForegroundColor Yellow

# Owner switches context to Branch
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/$branchId" -Method Post -Headers $ownerHeaders
$ownerActiveHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $($switchRes.token)"
}

$ownerOverrideBody = @{
    paymentMethod = "Cash"
    discountAmount = 150.00
    taxAmount = 0.00
    items = @( @{ productId = $laptopId; quantity = 1; unitPrice = 1000.00; discountAmount = 0.00 } )
} | ConvertTo-Json

$ownerSale = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $ownerOverrideBody -Headers $ownerActiveHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Owner override checkout failed. Message: '$(Get-ErrorMessage $err)'" -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "[SUCCESS] Owner successfully checked out with `$150.00 discount override. Sale ID: $($ownerSale.id)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  PHASE 9 DISCOUNT & COUPON VERIFICATION COMPLETED: ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
