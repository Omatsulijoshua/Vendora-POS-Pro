# verify_phase6.ps1
# Integration test script for Phase 6 - Inventory Management System

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 6 VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Helper function to get status code from ErrorVariable
function Get-ErrorStatusCode($errors) {
    if (-not $errors -or $errors.Count -eq 0) { return $null }
    $e = $errors[0]
    
    # If it's a CmdletInvocationException or similar wrapping a WebException
    if ($e.InnerException -and $e.InnerException.Response) {
        return [int]$e.InnerException.Response.StatusCode
    }
    
    # If it's an ErrorRecord wrapping a WebException directly on its Exception
    if ($e.Exception -and $e.Exception.Response) {
        return [int]$e.Exception.Response.StatusCode
    }
    
    # Fallback to direct WebException property
    if ($e.Response) {
        return [int]$e.Response.StatusCode
    }
    
    return $null
}

# 1. Login as Platform Admin (SuperAdmin)
Write-Host "`n[1/12] Logging in as default SuperAdmin..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@vendorapos.com"
    password = "AdminPassword123!"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -Headers $headers -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] SuperAdmin login failed. Make sure DB is updated and seeded." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$superToken = $res.token
Write-Host "[SUCCESS] SuperAdmin Logged in successfully. ID: $($res.userId)" -ForegroundColor Green

# 2. Register a new Business Owner
$emailSuffix = Get-Random
$ownerEmail = "owner_$emailSuffix@example.com"
$ownerPassword = "Password123!"
Write-Host "`n[2/12] Registering a new Business Owner ($ownerEmail)..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Test"
    lastName = "Owner"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Test Business $emailSuffix"
    subdomain = "testbiz$emailSuffix"
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
Write-Host "`n[3/12] Creating Branch A and Branch B..." -ForegroundColor Yellow
$branchABody = @{ name = "Branch Alpha"; address = "101 Alpha Rd"; phone = "555-1111" } | ConvertTo-Json
$branchBBody = @{ name = "Branch Beta"; address = "202 Beta St"; phone = "555-2222" } | ConvertTo-Json

$branchA = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchABody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Branch Alpha creation failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$branchB = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchBBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Branch Beta creation failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$branchAId = $branchA.id
$branchBId = $branchB.id
Write-Host "[SUCCESS] Branch Alpha Created: $branchAId" -ForegroundColor Green
Write-Host "[SUCCESS] Branch Beta Created: $branchBId" -ForegroundColor Green

# 4. Register Staff (Manager for Branch A, Cashier for Branch B)
$managerEmail = "manager_$emailSuffix@example.com"
$cashierEmail = "cashier_$emailSuffix@example.com"
Write-Host "`n[4/12] Creating Staff members..." -ForegroundColor Yellow

$managerBody = @{
    firstName = "Mark"
    lastName = "Manager"
    email = $managerEmail
    password = "Password123!"
    role = "Manager"
    branchId = $branchAId
} | ConvertTo-Json

$cashierBody = @{
    firstName = "Cathy"
    lastName = "Cashier"
    email = $cashierEmail
    password = "Password123!"
    role = "Cashier"
    branchId = $branchBId
} | ConvertTo-Json

$manager = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $managerBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Manager registration failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$cashier = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cashierBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Cashier registration failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "[SUCCESS] Created Manager ($managerEmail) for Branch Alpha" -ForegroundColor Green
Write-Host "[SUCCESS] Created Cashier ($cashierEmail) for Branch Beta" -ForegroundColor Green

# 5. Authenticate Staff Users
Write-Host "`n[5/12] Logging in as Manager and Cashier..." -ForegroundColor Yellow

$mgrLoginBody = @{ email = $managerEmail; password = "Password123!" } | ConvertTo-Json
$mgrRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $mgrLoginBody -Headers $headers
$mgrToken = $mgrRes.token
$mgrHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $mgrToken"
}

$cshLoginBody = @{ email = $cashierEmail; password = "Password123!" } | ConvertTo-Json
$cshRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cshLoginBody -Headers $headers
$cshToken = $cshRes.token
$cshHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $cshToken"
}
Write-Host "[SUCCESS] Staff authentication tokens generated." -ForegroundColor Green

# 6. Category CRUD Operations & Validation
Write-Host "`n[6/12] Testing Category Management..." -ForegroundColor Yellow

$categoryBody1 = @{ name = "Beverages"; description = "Cold drinks, sodas, and juices" } | ConvertTo-Json
$catRes1 = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $categoryBody1 -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Category creation failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$categoryId = $catRes1.id
Write-Host "[SUCCESS] Category Created: $($catRes1.name) (ID: $categoryId)" -ForegroundColor Green

# Test duplicate category name validation
$catErr = $null
$resDuplicate = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/categories" -Method Post -Body $categoryBody1 -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable catErr
$status = Get-ErrorStatusCode $catErr
Write-Host "  - Duplicate Category creation response code: $status (Expected: 400)" -ForegroundColor Gray
if ($status -ne 400) {
    Write-Host "[ERROR] Category uniqueness validation failed." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Category duplicate name validation rejected correctly." -ForegroundColor Green

# Update category name
$updateCatBody = @{ name = "Drinks"; description = "Cold sodas, drinks, and juices" } | ConvertTo-Json
$catResUpdate = Invoke-RestMethod -Uri "$baseUrl/api/categories/$categoryId" -Method Put -Body $updateCatBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Category update failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "[SUCCESS] Category name updated to: $($catResUpdate.name)" -ForegroundColor Green

# 7. Product CRUD and Constraint Validations
Write-Host "`n[7/12] Testing Product Creation and Constraints (Branch Stock Mode)..." -ForegroundColor Yellow

# Create Coca Cola product with stock in both branches
$cokeBody = @{
    name = "Coca Cola"
    sku = "COKE-01"
    barcode = "123456789012"
    description = "Refreshing Coca Cola beverage"
    price = 1.50
    costPrice = 0.80
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchAId; quantity = 50; minStockLevel = 10 }
        @{ branchId = $branchBId; quantity = 20; minStockLevel = 5 }
    )
} | ConvertTo-Json

$cokeRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $cokeBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Coca Cola product creation failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$cokeId = $cokeRes.id
Write-Host "[SUCCESS] Product Created: $($cokeRes.name) (ID: $cokeId)" -ForegroundColor Green

# Test SKU Uniqueness Validation
$skuBody = @{
    name = "Pepsi Fake"
    sku = "COKE-01"
    barcode = "999999999999"
    price = 1.40
    costPrice = 0.75
} | ConvertTo-Json

$skuErr = $null
$resSku = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/products" -Method Post -Body $skuBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable skuErr
$status = Get-ErrorStatusCode $skuErr
Write-Host "  - Duplicate SKU creation response code: $status (Expected: 400)" -ForegroundColor Gray
if ($status -ne 400) {
    Write-Host "[ERROR] SKU uniqueness validation failed." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Duplicate SKU rejected successfully." -ForegroundColor Green

# Test Barcode Uniqueness Validation
$barcodeBody = @{
    name = "Pepsi Fake 2"
    sku = "PEPSI-FAKE"
    barcode = "123456789012"
    price = 1.40
    costPrice = 0.75
} | ConvertTo-Json

$barcodeErr = $null
$resBarcode = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/products" -Method Post -Body $barcodeBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable barcodeErr
$status = Get-ErrorStatusCode $barcodeErr
Write-Host "  - Duplicate Barcode creation response code: $status (Expected: 400)" -ForegroundColor Gray
if ($status -ne 400) {
    Write-Host "[ERROR] Barcode uniqueness validation failed." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Duplicate Barcode rejected successfully." -ForegroundColor Green

# Create Pepsi product with Low Stock in Branch A
$pepsiBody = @{
    name = "Pepsi Cola"
    sku = "PEPSI-01"
    barcode = "987654321098"
    description = "Sleek Pepsi beverage"
    price = 1.40
    costPrice = 0.75
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchAId; quantity = 3; minStockLevel = 5 } # Low Stock
        @{ branchId = $branchBId; quantity = 10; minStockLevel = 2 }
    )
} | ConvertTo-Json

$pepsiRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $pepsiBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Pepsi product creation failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$pepsiId = $pepsiRes.id
Write-Host "[SUCCESS] Product Created: $($pepsiRes.name) (ID: $pepsiId)" -ForegroundColor Green

# 8. Test Stock Retrieval in Different Contexts (Global vs Branch contexts)
Write-Host "`n[8/12] Testing Stock Retrieval Contexts..." -ForegroundColor Yellow

# A. Global View (Owner default)
$productsGlobal = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $ownerHeaders
Write-Host "  - Owner Global Products count: $($productsGlobal.Count) (Expected: 2)" -ForegroundColor Gray
if ($productsGlobal.Count -ne 2) {
    Write-Host "[ERROR] Expected 2 products in global view." -ForegroundColor Red
    Exit 1
}
$cokeGlobal = $productsGlobal | Where-Object { $_.id -eq $cokeId }
$pepsiGlobal = $productsGlobal | Where-Object { $_.id -eq $pepsiId }

Write-Host "  - Coke Global Stock: $($cokeGlobal.totalStock) (Expected: 70)" -ForegroundColor Gray
Write-Host "  - Pepsi Global Stock: $($pepsiGlobal.totalStock) (Expected: 13)" -ForegroundColor Gray
Write-Host "  - Pepsi UnderStockAlert (Global): $($pepsiGlobal.underStockAlert) (Expected: True due to Branch A)" -ForegroundColor Gray

if ($cokeGlobal.totalStock -ne 70 -or $pepsiGlobal.totalStock -ne 13 -or $pepsiGlobal.underStockAlert -ne $true) {
    Write-Host "[ERROR] Global stock aggregation/alert mismatch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Global Stock consolidation verified." -ForegroundColor Green

# B. Manager A View (Branch Alpha context)
$productsMgrA = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrHeaders
$cokeMgrA = $productsMgrA | Where-Object { $_.id -eq $cokeId }
$pepsiMgrA = $productsMgrA | Where-Object { $_.id -eq $pepsiId }

Write-Host "  - Manager A: Coke Stock: $($cokeMgrA.totalStock) (Expected: 50)" -ForegroundColor Gray
Write-Host "  - Manager A: Coke UnderStockAlert: $($cokeMgrA.underStockAlert) (Expected: False)" -ForegroundColor Gray
Write-Host "  - Manager A: Pepsi Stock: $($pepsiMgrA.totalStock) (Expected: 3)" -ForegroundColor Gray
Write-Host "  - Manager A: Pepsi UnderStockAlert: $($pepsiMgrA.underStockAlert) (Expected: True)" -ForegroundColor Gray

if ($cokeMgrA.totalStock -ne 50 -or $cokeMgrA.underStockAlert -ne $false -or $pepsiMgrA.totalStock -ne 3 -or $pepsiMgrA.underStockAlert -ne $true) {
    Write-Host "[ERROR] Manager A branch stock context mismatch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Branch Alpha stock context isolated correctly." -ForegroundColor Green

# C. Cashier B View (Branch Beta context)
$productsCshB = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $cshHeaders
$cokeCshB = $productsCshB | Where-Object { $_.id -eq $cokeId }
$pepsiCshB = $productsCshB | Where-Object { $_.id -eq $pepsiId }

Write-Host "  - Cashier B: Coke Stock: $($cokeCshB.totalStock) (Expected: 20)" -ForegroundColor Gray
Write-Host "  - Cashier B: Pepsi Stock: $($pepsiCshB.totalStock) (Expected: 10)" -ForegroundColor Gray
Write-Host "  - Cashier B: Pepsi UnderStockAlert: $($pepsiCshB.underStockAlert) (Expected: False)" -ForegroundColor Gray

if ($cokeCshB.totalStock -ne 20 -or $pepsiCshB.totalStock -ne 10 -or $pepsiCshB.underStockAlert -ne $false) {
    Write-Host "[ERROR] Cashier B branch stock context mismatch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Branch Beta stock context isolated correctly." -ForegroundColor Green

# 9. Low Stock Filter
Write-Host "`n[9/12] Testing Low Stock Filter..." -ForegroundColor Yellow

# Retrieve for Manager A (where Pepsi is low stock, Coke is not)
$lowStockMgrA = Invoke-RestMethod -Uri "$baseUrl/api/products?lowStockOnly=true" -Method Get -Headers $mgrHeaders
Write-Host "  - Manager A Low Stock products: $($lowStockMgrA.Count) (Expected: 1, Pepsi)" -ForegroundColor Gray
if ($lowStockMgrA.Count -ne 1 -or $lowStockMgrA[0].id -ne $pepsiId) {
    Write-Host "[ERROR] Manager A low stock filter failed." -ForegroundColor Red
    Exit 1
}

# Retrieve for Cashier B (where no product is low stock)
$lowStockCshB = Invoke-RestMethod -Uri "$baseUrl/api/products?lowStockOnly=true" -Method Get -Headers $cshHeaders
Write-Host "  - Cashier B Low Stock products: $($lowStockCshB.Count) (Expected: 0)" -ForegroundColor Gray
if ($lowStockCshB.Count -ne 0) {
    Write-Host "[ERROR] Cashier B low stock filter failed." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Low Stock filters verified successfully." -ForegroundColor Green

# 10. Search and Barcode Lookup
Write-Host "`n[10/12] Testing Product Search and Barcode Lookup..." -ForegroundColor Yellow

# Text search
$searchRes = Invoke-RestMethod -Uri "$baseUrl/api/products?search=pep" -Method Get -Headers $cshHeaders
Write-Host "  - Search 'pep' count: $($searchRes.Count) (Expected: 1, Pepsi)" -ForegroundColor Gray
if ($searchRes.Count -ne 1 -or $searchRes[0].id -ne $pepsiId) {
    Write-Host "[ERROR] Product search by text failed." -ForegroundColor Red
    Exit 1
}

# Barcode lookup
$barcodeRes = Invoke-RestMethod -Uri "$baseUrl/api/products/barcode/123456789012" -Method Get -Headers $cshHeaders
Write-Host "  - Barcode '123456789012' Name: $($barcodeRes.name) (Expected: Coca Cola)" -ForegroundColor Gray
if ($barcodeRes.id -ne $cokeId) {
    Write-Host "[ERROR] Product lookup by barcode failed." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Search and barcode lookup verified." -ForegroundColor Green

# 11. Stock Adjustments & Audit Trail
Write-Host "`n[11/12] Testing Stock Adjustments and Audit Trail..." -ForegroundColor Yellow

# A. Cashier tries to adjust stock (Should fail with 403 Forbidden)
$adjBody = @{
    branchId = $branchAId
    quantity = 15
    minStockLevel = 5
    reason = "Cashier adjust test"
} | ConvertTo-Json

$cshAdjErr = $null
$resCshAdj = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/products/$pepsiId/adjust-stock" -Method Put -Body $adjBody -Headers $cshHeaders -ErrorAction SilentlyContinue -ErrorVariable cshAdjErr
$status = Get-ErrorStatusCode $cshAdjErr
Write-Host "  - Cashier adjusting stock response: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) {
    Write-Host "[ERROR] Cashier role bypass: adjusted stock successfully." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Cashier stock adjustment blocked correctly." -ForegroundColor Green

# B. Manager A adjusts stock in Branch A (Should succeed)
$mgrAdjBody = @{
    branchId = $branchAId
    quantity = 15
    minStockLevel = 5
    reason = "Restocked from main distributor"
} | ConvertTo-Json

$mgrAdjRes = Invoke-RestMethod -Uri "$baseUrl/api/products/$pepsiId/adjust-stock" -Method Put -Body $mgrAdjBody -Headers $mgrHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Manager A adjusting stock failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Adjusted stock: Previous: $($mgrAdjRes.previousQuantity), New: $($mgrAdjRes.newQuantity) (Expected New: 15)" -ForegroundColor Gray
if ($mgrAdjRes.newQuantity -ne 15 -or $mgrAdjRes.previousQuantity -ne 3) {
    Write-Host "[ERROR] Adjusted stock values mismatch." -ForegroundColor Red
    Exit 1
}

# Verify update reflected in catalog
$pepsiRes2 = Invoke-RestMethod -Uri "$baseUrl/api/products/$pepsiId" -Method Get -Headers $mgrHeaders
Write-Host "  - Pepsi New Stock Manager A view: $($pepsiRes2.totalStock) (Expected: 15)" -ForegroundColor Gray
Write-Host "  - Pepsi UnderStockAlert Manager A view: $($pepsiRes2.underStockAlert) (Expected: False)" -ForegroundColor Gray
if ($pepsiRes2.totalStock -ne 15 -or $pepsiRes2.underStockAlert -ne $false) {
    Write-Host "[ERROR] Adjusted stock did not update or alert state didn't clear." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Manager A adjusted branch stock successfully." -ForegroundColor Green

# C. Manager A tries to adjust stock in Branch B (Should fail with 403 Forbidden)
$mgrAdjBBody = @{
    branchId = $branchBId
    quantity = 50
    minStockLevel = 5
    reason = "Manager cross-adjust test"
} | ConvertTo-Json

$mgrBAdjErr = $null
$resMgrBAdj = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/products/$pepsiId/adjust-stock" -Method Put -Body $mgrAdjBBody -Headers $mgrHeaders -ErrorAction SilentlyContinue -ErrorVariable mgrBAdjErr
$status = Get-ErrorStatusCode $resMgrBAdjErr
if (-not $mgrBAdjErr) {
    Write-Host "[ERROR] Manager was allowed to adjust stock of another branch." -ForegroundColor Red
    Exit 1
}
$status = Get-ErrorStatusCode $mgrBAdjErr
Write-Host "  - Manager adjusting other branch stock response: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) {
    Write-Host "[ERROR] Manager was not blocked with 403 when adjusting another branch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Cross-branch stock adjustment blocked correctly." -ForegroundColor Green

# D. Verify Stock Adjustment Audit Logs
$logs = Invoke-RestMethod -Uri "$baseUrl/api/products/$pepsiId/adjustment-logs" -Method Get -Headers $mgrHeaders
Write-Host "  - Pepsi Adjustment Logs count: $($logs.Count) (Expected: >= 2, Initial + Restock)" -ForegroundColor Gray
if ($logs.Count -lt 2) {
    Write-Host "[ERROR] Expected at least 2 logs." -ForegroundColor Red
    Exit 1
}
# First log in list is the most recent (restock)
$latestLog = $logs[0]
Write-Host "  - Latest Log - Prev: $($latestLog.previousQuantity), New: $($latestLog.newQuantity), Reason: '$($latestLog.reason)'" -ForegroundColor Gray
Write-Host "  - Latest Log - Adjusted By: $($latestLog.adjustedByUserName)" -ForegroundColor Gray

if ($latestLog.previousQuantity -ne 3 -or $latestLog.newQuantity -ne 15 -or $latestLog.reason -ne "Restocked from main distributor") {
    Write-Host "[ERROR] Audit log contents mismatch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Stock adjustment audit logs verified." -ForegroundColor Green

# 12. Shared Stock Mode Settings Toggle & Mechanics
Write-Host "`n[12/12] Testing Shared Stock Mode Toggle & Dynamics..." -ForegroundColor Yellow

# A. Toggle to Shared Stock Mode
$toggleRes = Invoke-RestMethod -Uri "$baseUrl/api/businesses/toggle-shared-stock" -Method Put -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Toggle to Shared Stock Mode failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Business SharedStockMode after toggle: $($toggleRes.sharedStockMode) (Expected: True)" -ForegroundColor Gray
if ($toggleRes.sharedStockMode -ne $true) {
    Write-Host "[ERROR] SharedStockMode is not True." -ForegroundColor Red
    Exit 1
}

# B. Verify Stock Aggregation under Shared Mode
# Coke had: Branch A (50), Branch B (20) -> Global/Shared should be 70
# Pepsi had: Branch A (15), Branch B (10) -> Global/Shared should be 25
$productsShared = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $ownerHeaders
$cokeShared = $productsShared | Where-Object { $_.id -eq $cokeId }
$pepsiShared = $productsShared | Where-Object { $_.id -eq $pepsiId }

Write-Host "  - Coca Cola Shared Stock: $($cokeShared.totalStock) (Expected: 70)" -ForegroundColor Gray
Write-Host "  - Pepsi Shared Stock: $($pepsiShared.totalStock) (Expected: 25)" -ForegroundColor Gray

if ($cokeShared.totalStock -ne 70 -or $pepsiShared.totalStock -ne 25) {
    Write-Host "[ERROR] Shared mode stock aggregation mismatch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Shared stock aggregation verified." -ForegroundColor Green

# C. Owner adjusts stock in Shared Mode (BranchId = null)
$ownerSharedAdjBody = @{
    branchId = $null
    quantity = 35
    minStockLevel = 5
    reason = "Consolidated count correction"
} | ConvertTo-Json

$ownerSharedAdjRes = Invoke-RestMethod -Uri "$baseUrl/api/products/$pepsiId/adjust-stock" -Method Put -Body $ownerSharedAdjBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Owner failed to adjust stock in Shared Mode." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Pepsi Adjusted Shared Stock: Previous: $($ownerSharedAdjRes.previousQuantity), New: $($ownerSharedAdjRes.newQuantity) (Expected New: 35)" -ForegroundColor Gray
if ($ownerSharedAdjRes.newQuantity -ne 35 -or $ownerSharedAdjRes.previousQuantity -ne 25) {
    Write-Host "[ERROR] Shared stock adjustment value mismatch." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Owner adjusted shared stock successfully." -ForegroundColor Green

# D. Manager tries to adjust stock in Shared Mode (Should fail with 400 Bad Request)
$mgrSharedAdjBody = @{
    branchId = $branchAId
    quantity = 40
    minStockLevel = 5
    reason = "Manager shared adjust attempt"
} | ConvertTo-Json

$mgrSharedAdjErr = $null
$resMgrSharedAdj = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/products/$pepsiId/adjust-stock" -Method Put -Body $mgrSharedAdjBody -Headers $mgrHeaders -ErrorAction SilentlyContinue -ErrorVariable mgrSharedAdjErr
$status = Get-ErrorStatusCode $mgrSharedAdjErr
Write-Host "  - Manager adjusting stock in Shared Mode response: $status (Expected: 400)" -ForegroundColor Gray
if ($status -ne 400) {
    Write-Host "[ERROR] Manager stock adjustment in Shared Mode was not blocked with 400." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Manager shared stock adjustment blocked correctly." -ForegroundColor Green

# Reset SharedStockMode back to Branch Stock Mode so subsequent runs/manual verification starts clean
$toggleRes2 = Invoke-RestMethod -Uri "$baseUrl/api/businesses/toggle-shared-stock" -Method Put -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[WARNING] Resetting SharedStockMode failed." -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  PHASE 6 VERIFICATION COMPLETED: ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
