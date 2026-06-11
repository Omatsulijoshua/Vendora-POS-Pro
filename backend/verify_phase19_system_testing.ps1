# verify_phase19_system_testing.ps1
# Integration test script for Phase 19 - Full System Testing

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 19 FULL SYSTEM INTEGRATION TESTS"    -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# --------------------------------------------------------
# SECTION 1: Setup & Registrations
# --------------------------------------------------------
Write-Host "`n[1] Setting up two separate businesses & staff..." -ForegroundColor Yellow

$rand = Get-Random
$ownerAEmail = "ownera_$rand@example.com"
$ownerBEmail = "ownerb_$rand@example.com"
$password = "Password123!"

# Register Business A (Owner A)
$regABody = @{
    firstName = "Owner"
    lastName = "A"
    email = $ownerAEmail
    password = $password
    businessName = "Tenant Business A $rand"
    subdomain = "tenanta$rand"
} | ConvertTo-Json

$regARes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $regABody -Headers $headers
$ownerAToken = $regARes.token
$businessAId = $regARes.businessId
Write-Host "[SUCCESS] Tenant A Registered. Business ID: $businessAId" -ForegroundColor Green

$ownerAHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerAToken"
}

# Register Business B (Owner B)
$regBBody = @{
    firstName = "Owner"
    lastName = "B"
    email = $ownerBEmail
    password = $password
    businessName = "Tenant Business B $rand"
    subdomain = "tenantb$rand"
} | ConvertTo-Json

$regBRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $regBBody -Headers $headers
$ownerBToken = $regBRes.token
$businessBId = $regBRes.businessId
Write-Host "[SUCCESS] Tenant B Registered. Business ID: $businessBId" -ForegroundColor Green

$ownerBHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerBToken"
}

# Under Business A: Create Branch A1 and Branch A2
$branch1Res = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body (@{ name = "Branch A1"; address = "100 A1 St"; phone = "555-0001" } | ConvertTo-Json) -Headers $ownerAHeaders
$branchA1Id = $branch1Res.id

$branch2Res = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body (@{ name = "Branch A2"; address = "200 A2 St"; phone = "555-0002" } | ConvertTo-Json) -Headers $ownerAHeaders
$branchA2Id = $branch2Res.id
Write-Host "Created Branch A1 ($branchA1Id) and Branch A2 ($branchA2Id)" -ForegroundColor Gray

# Under Business A: Register Manager A1 and Cashier A1 for Branch A1
$mgrEmail = "manager_a1_$rand@example.com"
$mgrBody = @{
    firstName = "John"
    lastName = "Manager"
    email = $mgrEmail
    password = $password
    role = "Manager"
    branchId = $branchA1Id
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $mgrBody -Headers $ownerAHeaders

$cashierEmail = "cashier_a1_$rand@example.com"
$cashierBody = @{
    firstName = "Jane"
    lastName = "Cashier"
    email = $cashierEmail
    password = $password
    role = "Cashier"
    branchId = $branchA1Id
} | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cashierBody -Headers $ownerAHeaders
Write-Host "Created Manager A1 ($mgrEmail) and Cashier A1 ($cashierEmail)" -ForegroundColor Gray

# Authenticate Manager A1 and Cashier A1
$mgrLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $mgrEmail; password = $password } | ConvertTo-Json) -Headers $headers
$mgrToken = $mgrLogin.token
$mgrHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $mgrToken"
}

$cashierLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $cashierEmail; password = $password } | ConvertTo-Json) -Headers $headers
$cashierToken = $cashierLogin.token
$cashierHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $cashierToken"
}

# Authenticate SuperAdmin
$superLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = "admin@vendorapos.com"; password = "AdminPassword123!" } | ConvertTo-Json) -Headers $headers
$superToken = $superLogin.token
$superHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $superToken"
}


# --------------------------------------------------------
# SECTION 2: Multi-Business Isolation
# --------------------------------------------------------
Write-Host "`n[2] Testing Multi-Business Tenant Isolation..." -ForegroundColor Yellow

# Owner A creates Category A and Product A
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body (@{ name = "Cat A"; description = "Category of Tenant A" } | ConvertTo-Json) -Headers $ownerAHeaders
$categoryAId = $catRes.id

$prodBody = @{
    name = "Product A"
    sku = "SKU-A-$rand"
    barcode = "BARCODE-A-$rand"
    description = "Product of Tenant A"
    price = 100.00
    costPrice = 60.00
    categoryId = $categoryAId
    initialStocks = @(
        @{ branchId = $branchA1Id; quantity = 10; minStockLevel = 2 }
    )
} | ConvertTo-Json

$prodRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $prodBody -Headers $ownerAHeaders
$productAId = $prodRes.id
Write-Host "Owner A created Product A ($productAId) in Category A ($categoryAId)" -ForegroundColor Gray

# Owner B attempts to list categories -> Should not see Category A
$ownerBCats = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Get -Headers $ownerBHeaders
$foundCatA = $ownerBCats | Where-Object { $_.id -eq $categoryAId }
if ($null -ne $foundCatA) {
    Write-Host "[ERROR] Tenant B was able to view Category A belonging to Tenant A!" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Tenant B cannot view Tenant A's Category list." -ForegroundColor Green

# Owner B attempts to retrieve Product A details -> Should return 404
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId" -Method Get -Headers $ownerBHeaders
    Write-Host "[ERROR] Tenant B was allowed to fetch Product A details!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "[SUCCESS] Tenant B access to Product A returns correctly 404 (Not Found)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cross-tenant product fetch: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Owner B attempts to update Product A -> Should return 404 (or 403)
try {
    $updateBody = @{ name = "Updated Product A"; sku = "SKU-A-$rand"; price = 150.00; costPrice = 80.00; categoryId = $categoryAId } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId" -Method Put -Body $updateBody -Headers $ownerBHeaders
    Write-Host "[ERROR] Tenant B was allowed to update Product A!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404 -or $statusCode -eq 403) {
        Write-Host "[SUCCESS] Tenant B update on Product A is correctly Blocked ($statusCode)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cross-tenant product update: $statusCode" -ForegroundColor Red; Exit 1
    }
}


# --------------------------------------------------------
# SECTION 3: Multi-Branch Isolation
# --------------------------------------------------------
Write-Host "`n[3] Testing Multi-Branch Context Isolation..." -ForegroundColor Yellow

# Ensure Branch A2 stock record exists for Product A
# Owner A switches context to Branch A2 to setup stock (or manages globally)
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/$branchA2Id" -Method Post -Headers $ownerAHeaders
$ownerAToken = $switchRes.token
$ownerAHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerAToken"
}

# Owner A adds initial stock of 10 in Branch A2
$adjustBodyA2 = @{ quantity = 10; minStockLevel = 2; branchId = $branchA2Id; reason = "Initial Branch A2 stock" } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId/adjust-stock" -Method Put -Body $adjustBodyA2 -Headers $ownerAHeaders
Write-Host "Set initial stock of 10 for Product A in Branch A2" -ForegroundColor Gray

# Switch Owner A back to global view
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/global" -Method Post -Headers $ownerAHeaders
$ownerAToken = $switchRes.token
$ownerAHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerAToken"
}

# Manager A1 (Branch A1) tries to adjust stock in Branch A2 -> Should return 403
try {
    $adjustBodyCross = @{ quantity = 20; minStockLevel = 2; branchId = $branchA2Id; reason = "Manager cross adjust" } | ConvertTo-Json
    $null = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId/adjust-stock" -Method Put -Body $adjustBodyCross -Headers $mgrHeaders
    Write-Host "[ERROR] Manager A1 was allowed to adjust stock in Branch A2!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Manager stock adjustment in another branch is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cross-branch adjustment: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Create a sale in Branch A2 (Owner A switches context to Branch A2, performs sale)
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/$branchA2Id" -Method Post -Headers $ownerAHeaders
$ownerAToken = $switchRes.token
$ownerAHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerAToken"
}

$saleA2Body = @{
    items = @(
        @{ productId = $productAId; quantity = 1; unitPrice = 100.00; discountAmount = 0.00 }
    )
    discountAmount = 0.00
    taxAmount = 0.00
    paymentMethod = "Cash"
} | ConvertTo-Json

$saleA2Res = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $saleA2Body -Headers $ownerAHeaders
$saleA2Id = $saleA2Res.id
Write-Host "Created sale $saleA2Id in Branch A2" -ForegroundColor Gray

# Switch Owner A back to global
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/global" -Method Post -Headers $ownerAHeaders
$ownerAToken = $switchRes.token
$ownerAHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerAToken"
}

# Manager A1 (Branch A1) tries to retrieve Sale A2 (Branch A2) -> Should return 403
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/sales/$saleA2Id" -Method Get -Headers $mgrHeaders
    Write-Host "[ERROR] Manager A1 was allowed to view Branch A2 Sale!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Manager retrieval of another branch's Sale is correctly Forbidden (403)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cross-branch sale retrieve: $statusCode" -ForegroundColor Red; Exit 1
    }
}


# --------------------------------------------------------
# SECTION 4: POS Flow & Inventory Accuracy
# --------------------------------------------------------
Write-Host "`n[4] Testing POS Flow & Inventory Accuracy..." -ForegroundColor Yellow

# Cashier A1 checks out 3 units of Product A
$checkoutBody = @{
    items = @(
        @{ productId = $productAId; quantity = 3; unitPrice = 100.00; discountAmount = 0.00 }
    )
    discountAmount = 0.00
    taxAmount = 5.00
    paymentMethod = "POS"
} | ConvertTo-Json

$saleRes = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $checkoutBody -Headers $cashierHeaders
$saleId = $saleRes.id
Write-Host "Checkout complete. Sale ID: $saleId | Total: $($saleRes.total)" -ForegroundColor Gray

# Retrieve Product A details to verify stock reduction in Branch A1 (Initial 10, sold 3 -> should be 7)
$prodDetails = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId" -Method Get -Headers $ownerAHeaders
$branchA1Stock = $prodDetails.branchStocks | Where-Object { $_.branchId -eq $branchA1Id }
Write-Host "Product A Stock in Branch A1 after checkout: $($branchA1Stock.quantity)" -ForegroundColor Gray
if ($branchA1Stock.quantity -ne 7) {
    Write-Host "[ERROR] Stock not deducted correctly in Branch A1! Expected 7, got $($branchA1Stock.quantity)" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] POS checkout successfully deducted stock in assigned branch." -ForegroundColor Green

# Manager A1 adjusts stock of Product A in Branch A1 to 15
$adjustBody = @{ quantity = 15; minStockLevel = 2; branchId = $branchA1Id; reason = "Manager manual stock adjustment" } | ConvertTo-Json
$adjustRes = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId/adjust-stock" -Method Put -Body $adjustBody -Headers $mgrHeaders
Write-Host "Manager adjusted stock. New Quantity: $($adjustRes.newQuantity)" -ForegroundColor Gray
if ($adjustRes.newQuantity -ne 15) {
    Write-Host "[ERROR] Stock level adjustment failed. Expected 15, got $($adjustRes.newQuantity)" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Manager successfully adjusted stock level." -ForegroundColor Green

# Initiate Stock Transfer: Manager A1 transfers 5 units of Product A to Branch A2
$transferBody = @{
    productId = $productAId
    sourceBranchId = $branchA1Id
    targetBranchId = $branchA2Id
    quantity = 5
    notes = "Transfer 5 units to Branch A2"
} | ConvertTo-Json

$transferRes = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $transferBody -Headers $mgrHeaders
$transferId = $transferRes.id
Write-Host "Manager A1 initiated stock transfer ($transferId) of 5 units." -ForegroundColor Gray

# Verify immediate stock deduction in source branch Branch A1 (15 - 5 = 10)
$prodDetails2 = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId" -Method Get -Headers $ownerAHeaders
$branchA1Stock2 = $prodDetails2.branchStocks | Where-Object { $_.branchId -eq $branchA1Id }
Write-Host "Branch A1 Stock immediately after transfer initiation: $($branchA1Stock2.quantity)" -ForegroundColor Gray
if ($branchA1Stock2.quantity -ne 10) {
    Write-Host "[ERROR] Reservation lock failed! Expected source branch stock to be 10, got $($branchA1Stock2.quantity)" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Source branch reservation lock applied successfully." -ForegroundColor Green

# Retrieve Branch A2 stock before approval
$branchA2StockBefore = $prodDetails2.branchStocks | Where-Object { $_.branchId -eq $branchA2Id }
Write-Host "Branch A2 Stock before transfer approval: $($branchA2StockBefore.quantity)" -ForegroundColor Gray

# Owner A approves the transfer (switch active branch context to Target Branch A2 first to mock manager A2, or Owner can do it)
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/$branchA2Id" -Method Post -Headers $ownerAHeaders
$ownerAToken = $switchRes.token
$ownerAHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerAToken"
}

$approveRes = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers/$transferId/approve" -Method Put -Body (@{ notes = "Approved" } | ConvertTo-Json) -Headers $ownerAHeaders
Write-Host "Transfer approved: $($approveRes.message)" -ForegroundColor Gray

# Switch Owner A back to global
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/global" -Method Post -Headers $ownerAHeaders
$ownerAToken = $switchRes.token
$ownerAHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $ownerAToken"
}

# Verify stock addition in target branch Branch A2 (Should increase by 5)
$prodDetails3 = Invoke-RestMethod -Uri "$baseUrl/api/products/$productAId" -Method Get -Headers $ownerAHeaders
$branchA2StockAfter = $prodDetails3.branchStocks | Where-Object { $_.branchId -eq $branchA2Id }
Write-Host "Branch A2 Stock after transfer approval: $($branchA2StockAfter.quantity)" -ForegroundColor Gray
$expectedA2Stock = $branchA2StockBefore.quantity + 5
if ($branchA2StockAfter.quantity -ne $expectedA2Stock) {
    Write-Host "[ERROR] Target stock not increased! Expected $expectedA2Stock, got $($branchA2StockAfter.quantity)" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Stock transfer approved and quantities successfully updated." -ForegroundColor Green


# --------------------------------------------------------
# SECTION 5: Receipt Customization & Verification
# --------------------------------------------------------
Write-Host "`n[5] Testing Receipt Customization & Public Receipt Verification..." -ForegroundColor Yellow

# Owner A updates receipt settings
$receiptBody = @{
    logoUrl = "http://example.com/logo.png"
    headerText = "Welcome to Tenant Business A"
    footerText = "Thank you for shopping with us!"
    showLogo = $true
    showBranchDetails = $true
    showCashierInfo = $true
    showQRCode = $true
    receiptLayout = "Thermal"
    customBrandingColor = "#6366F1"
} | ConvertTo-Json

$receiptRes = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method Put -Body $receiptBody -Headers $ownerAHeaders
Write-Host "Receipt setting updated. Footer: $($receiptRes.footerText)" -ForegroundColor Gray

# Verify unauthenticated public verification
$verifyRes = Invoke-RestMethod -Uri "$baseUrl/api/sales/verify/$saleId" -Method Get
Write-Host "Verified Sale Business Name: $($verifyRes.businessName)" -ForegroundColor Gray
Write-Host "Verified Sale Cashier Name: $($verifyRes.cashierName)" -ForegroundColor Gray
if ($verifyRes.businessName -notmatch "Tenant Business A") {
    Write-Host "[ERROR] Verification sale business name mismatch! Expected Tenant Business A, got $($verifyRes.businessName)" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Receipt settings and public sale verification check passed." -ForegroundColor Green


# --------------------------------------------------------
# SECTION 6: Coupon Validation
# --------------------------------------------------------
Write-Host "`n[6] Testing Coupon Validation & Checkout Limits..." -ForegroundColor Yellow

# Create coupon TESTPROMO (min spend $50.00, value $10.00)
$couponBody = @{
    code = "TESTPROMO"
    type = "FixedAmount"
    value = 10.00
    minCartAmount = 50.00
    usageLimit = 2
    startDate = (Get-Date).AddDays(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    endDate = (Get-Date).AddDays(5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json

$couponRes = Invoke-RestMethod -Uri "$baseUrl/api/coupons" -Method Post -Body $couponBody -Headers $ownerAHeaders
Write-Host "Created Coupon Code: $($couponRes.code) | ID: $($couponRes.id)" -ForegroundColor Gray

# Validate coupon (specify cartTotal=100 to satisfy min spend and keep discount ratio within cashier 15% limit)
$validRes = Invoke-RestMethod -Uri "$baseUrl/api/coupons/validate/TESTPROMO?cartTotal=100" -Method Get -Headers $cashierHeaders
Write-Host "Validation Response. Valid: $($validRes.isValid) | Type: $($validRes.type) | Value: $($validRes.value) | Message: $($validRes.message)" -ForegroundColor Gray
if ($validRes.isValid -ne $true) {
    Write-Host "[ERROR] Coupon validation failed! Expected isValid = true." -ForegroundColor Red; Exit 1
}

# Cashier attempts checkout with total spend $40 (Less than min spend of $50) -> Should fail
$badCheckout = @{
    items = @(
        @{ productId = $productAId; quantity = 1; unitPrice = 40.00; discountAmount = 0.00 }
    )
    discountAmount = 0.00
    taxAmount = 0.00
    paymentMethod = "Cash"
    couponCode = "TESTPROMO"
} | ConvertTo-Json

try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $badCheckout -Headers $cashierHeaders
    Write-Host "[ERROR] Checkout was allowed even though spend was below coupon min spend!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) {
        Write-Host "[SUCCESS] Checkout blocked correctly with spend below coupon min spend (400)." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on invalid coupon spend: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Cashier attempts checkout with spend $100 -> Should succeed (discount of $10 represents 10% which is <= 15% cashier limit)
$goodCheckout = @{
    items = @(
        @{ productId = $productAId; quantity = 1; unitPrice = 100.00; discountAmount = 0.00 }
    )
    discountAmount = 10.00 # applied coupon discount
    taxAmount = 0.00
    paymentMethod = "Cash"
    couponCode = "TESTPROMO"
} | ConvertTo-Json

$goodRes = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $goodCheckout -Headers $cashierHeaders
Write-Host "Good checkout total: $($goodRes.total) | Coupon: $($goodRes.appliedCouponCode)" -ForegroundColor Gray
if ($goodRes.total -ne 90.00) {
    Write-Host "[ERROR] Discount not applied correctly! Expected total 90.00, got $($goodRes.total)" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Coupon successfully applied to checkout." -ForegroundColor Green


# --------------------------------------------------------
# SECTION 7: Subscription Enforcement
# --------------------------------------------------------
Write-Host "`n[7] Testing Subscription Operational Gating..." -ForegroundColor Yellow

# SuperAdmin expires Business A subscription (set expires to 1 day ago)
$expiresAt = (Get-Date).AddDays(-1).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$subBody = @{
    subscriptionTier = "Pro"
    subscriptionStatus = "Active"
    subscriptionPrice = 299.00
    subscriptionExpiresAt = $expiresAt
} | ConvertTo-Json

$null = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses/$businessAId/subscription" -Method Put -Body $subBody -Headers $superHeaders
Write-Host "SuperAdmin expired Business A subscription." -ForegroundColor Gray

# Attempt Cashier A1 login -> Should return 402 Payment Required
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $cashierEmail; password = $password } | ConvertTo-Json) -Headers $headers
    Write-Host "[ERROR] Cashier login was allowed with expired subscription!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 402) {
        Write-Host "[SUCCESS] Cashier login correctly blocked with 402 Payment Required." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier login block: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Attempt Owner A login -> Should succeed (200 OK) but return isSubscriptionActive = false
$ownerLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $ownerAEmail; password = $password } | ConvertTo-Json) -Headers $headers
Write-Host "Owner A login status. Token: $($ownerLogin.token | Out-String | Select-String "eyJ" -Quiet) | isSubscriptionActive: $($ownerLogin.isSubscriptionActive)" -ForegroundColor Gray
if ($ownerLogin.isSubscriptionActive -ne $false) {
    Write-Host "[ERROR] Owner login did not flag active subscription as false!" -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Owner login succeeds with inactive subscription flag." -ForegroundColor Green

# SuperAdmin suspends Business A
$null = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses/$businessAId/suspend" -Method Post -Headers $superHeaders
Write-Host "SuperAdmin suspended Business A." -ForegroundColor Gray

# Attempt Owner A login -> Should return 403 Forbidden
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body (@{ email = $ownerAEmail; password = $password } | ConvertTo-Json) -Headers $headers
    Write-Host "[ERROR] Owner login was allowed with suspended business!" -ForegroundColor Red; Exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Suspended business login correctly blocked with 403 Forbidden." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on suspended business login: $statusCode" -ForegroundColor Red; Exit 1
    }
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL PHASE 19 SYSTEM INTEGRATION TESTS PASSED!"               -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
