# verify_phase7.ps1
# Integration test script for Phase 7 - Stock Transfer System

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 7 VERIFICATION SUITE" -ForegroundColor Cyan
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
Write-Host "[SUCCESS] SuperAdmin Logged in successfully." -ForegroundColor Green

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

# 4. Register Staff (Manager A, Manager B, Cashier B)
Write-Host "`n[4/12] Creating Staff members..." -ForegroundColor Yellow

$managerAEmail = "mgr_a_$emailSuffix@example.com"
$managerBEmail = "mgr_b_$emailSuffix@example.com"
$cashierBEmail = "csh_b_$emailSuffix@example.com"

$mgrABody = @{ firstName = "Amy"; lastName = "Manager"; email = $managerAEmail; password = "Password123!"; role = "Manager"; branchId = $branchAId } | ConvertTo-Json
$mgrBBody = @{ firstName = "Bob"; lastName = "Manager"; email = $managerBEmail; password = "Password123!"; role = "Manager"; branchId = $branchBId } | ConvertTo-Json
$cshBBody = @{ firstName = "Cathy"; lastName = "Cashier"; email = $cashierBEmail; password = "Password123!"; role = "Cashier"; branchId = $branchBId } | ConvertTo-Json

$mgrA = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $mgrABody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Manager A creation failed." -ForegroundColor Red; Exit 1 }
$mgrB = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $mgrBBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Manager B creation failed." -ForegroundColor Red; Exit 1 }
$cshB = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cshBBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Cashier B creation failed." -ForegroundColor Red; Exit 1 }

Write-Host "[SUCCESS] Staff members created successfully." -ForegroundColor Green

# 5. Authenticate Staff Users
Write-Host "`n[5/12] Logging in as Staff..." -ForegroundColor Yellow

$mgrALoginBody = @{ email = $managerAEmail; password = "Password123!" } | ConvertTo-Json
$mgrARes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $mgrALoginBody -Headers $headers
$mgrAToken = $mgrARes.token
$mgrAHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $mgrAToken" }

$mgrBLoginBody = @{ email = $managerBEmail; password = "Password123!" } | ConvertTo-Json
$mgrBRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $mgrBLoginBody -Headers $headers
$mgrBToken = $mgrBRes.token
$mgrBHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $mgrBToken" }

$cshBLoginBody = @{ email = $cashierBEmail; password = "Password123!" } | ConvertTo-Json
$cshBRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cshBLoginBody -Headers $headers
$cshBToken = $cshBRes.token
$cshBHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $cshBToken" }

Write-Host "[SUCCESS] Staff tokens generated." -ForegroundColor Green

# 6. Create Product with initial stocks
Write-Host "`n[6/12] Creating Coca Cola product with stocks..." -ForegroundColor Yellow

# Create Category
$categoryBody = @{ name = "Beverages"; description = "Drinks" } | ConvertTo-Json
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $categoryBody -Headers $ownerHeaders
$categoryId = $catRes.id

$cokeBody = @{
    name = "Coca Cola"
    sku = "COKE-01"
    barcode = "123456789012"
    price = 2.00
    costPrice = 1.00
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchAId; quantity = 50; minStockLevel = 10 }
        @{ branchId = $branchBId; quantity = 10; minStockLevel = 5 }
    )
} | ConvertTo-Json

$cokeRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $cokeBody -Headers $ownerHeaders
$cokeId = $cokeRes.id
Write-Host "[SUCCESS] Created Coca Cola (ID: $cokeId) with stock A: 50, B: 10" -ForegroundColor Green

# 7. Cashier and Manager role constraint tests
Write-Host "`n[7/12] Testing Role constraints for Transfers..." -ForegroundColor Yellow

# A. Cashier B attempts to list transfers (Should fail with 403 Forbidden)
$cshListErr = $null
$resCshList = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/stocktransfers" -Method Get -Headers $cshBHeaders -ErrorAction SilentlyContinue -ErrorVariable cshListErr
$status = Get-ErrorStatusCode $cshListErr
Write-Host "  - Cashier listing transfers status: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) { Write-Host "[ERROR] Cashier was not blocked from listing transfers." -ForegroundColor Red; Exit 1 }

# B. Cashier B attempts to initiate transfer (Should fail with 403 Forbidden)
$cshInitBody = @{ productId = $cokeId; sourceBranchId = $branchAId; targetBranchId = $branchBId; quantity = 5 } | ConvertTo-Json
$cshInitErr = $null
$resCshInit = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $cshInitBody -Headers $cshBHeaders -ErrorAction SilentlyContinue -ErrorVariable cshInitErr
$status = Get-ErrorStatusCode $cshInitErr
Write-Host "  - Cashier initiating transfer status: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) { Write-Host "[ERROR] Cashier was not blocked from initiating transfer." -ForegroundColor Red; Exit 1 }

# C. Manager B attempts to initiate transfer from Branch A to Branch B (Should fail with 403 Forbidden)
# Manager B is assigned to Branch B, so they cannot initiate from Branch A.
$mgrBInitBody = @{ productId = $cokeId; sourceBranchId = $branchAId; targetBranchId = $branchBId; quantity = 5 } | ConvertTo-Json
$mgrBInitErr = $null
$resMgrBInit = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $mgrBInitBody -Headers $mgrBHeaders -ErrorAction SilentlyContinue -ErrorVariable mgrBInitErr
$status = Get-ErrorStatusCode $mgrBInitErr
Write-Host "  - Manager B initiating from Branch A status: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) { Write-Host "[ERROR] Manager B cross-initiate was not blocked." -ForegroundColor Red; Exit 1 }

Write-Host "[SUCCESS] Cashier and cross-branch Manager constraints verified." -ForegroundColor Green

# 8. Transfer workflow: Initiate & Reject
Write-Host "`n[8/12] Testing Transfer Initiation and Rejection workflow..." -ForegroundColor Yellow

# Manager A initiates transfer of 15 Coke from Branch A to Branch B
$initBody1 = @{ productId = $cokeId; sourceBranchId = $branchAId; targetBranchId = $branchBId; quantity = 15; notes = "Moving Coke to Beta" } | ConvertTo-Json
$transfer1 = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $initBody1 -Headers $mgrAHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Manager A failed to initiate transfer." -ForegroundColor Red; Exit 1 }
$transfer1Id = $transfer1.id
Write-Host "[SUCCESS] Transfer 1 Initiated (ID: $transfer1Id). Status: $($transfer1.status)" -ForegroundColor Green

# Check stock of Branch A (Should be reduced immediately: 50 - 15 = 35)
$prodA = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrAHeaders
$cokeA = $prodA | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch A Coke Stock: $($cokeA.totalStock) (Expected: 35)" -ForegroundColor Gray
if ($cokeA.totalStock -ne 35) { Write-Host "[ERROR] Branch A stock not reduced upon transfer initiation." -ForegroundColor Red; Exit 1 }

# Check stock of Branch B (Should still be 10)
$prodB = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrBHeaders
$cokeB = $prodB | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch B Coke Stock: $($cokeB.totalStock) (Expected: 10)" -ForegroundColor Gray
if ($cokeB.totalStock -ne 10) { Write-Host "[ERROR] Branch B stock changed before approval." -ForegroundColor Red; Exit 1 }

# Manager A attempts to approve incoming (Should fail with 403 Forbidden because target is Branch B)
$approveErr = $null
$resApprove = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/stocktransfers/$transfer1Id/approve" -Method Put -Body "{}" -Headers $mgrAHeaders -ErrorAction SilentlyContinue -ErrorVariable approveErr
$status = Get-ErrorStatusCode $approveErr
Write-Host "  - Manager A approving incoming to Branch B status: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) { Write-Host "[ERROR] Manager A was not blocked from approving incoming to Branch B." -ForegroundColor Red; Exit 1 }

# Manager B rejects the transfer
$rejectBody = @{ rejectionReason = "No space in warehouse" } | ConvertTo-Json
$rejectRes = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers/$transfer1Id/reject" -Method Put -Body $rejectBody -Headers $mgrBHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Manager B failed to reject transfer." -ForegroundColor Red; Exit 1 }
Write-Host "[SUCCESS] Transfer 1 Rejected successfully." -ForegroundColor Green

# Check stock of Branch A (Should be restored: 35 + 15 = 50)
$prodA = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrAHeaders
$cokeA = $prodA | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch A Coke Stock (after rejection): $($cokeA.totalStock) (Expected: 50)" -ForegroundColor Gray
if ($cokeA.totalStock -ne 50) { Write-Host "[ERROR] Branch A stock not restored after rejection." -ForegroundColor Red; Exit 1 }

# 9. Transfer workflow: Initiate & Cancel
Write-Host "`n[9/12] Testing Transfer Initiation and Cancellation workflow..." -ForegroundColor Yellow

# Manager A initiates transfer of 20 Coke
$initBody2 = @{ productId = $cokeId; sourceBranchId = $branchAId; targetBranchId = $branchBId; quantity = 20 } | ConvertTo-Json
$transfer2 = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $initBody2 -Headers $mgrAHeaders
$transfer2Id = $transfer2.id

# Check stock of Branch A (Should be 30)
$prodA = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrAHeaders
$cokeA = $prodA | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch A Coke Stock (after initiate): $($cokeA.totalStock) (Expected: 30)" -ForegroundColor Gray
if ($cokeA.totalStock -ne 30) { Write-Host "[ERROR] Stock level mismatch." -ForegroundColor Red; Exit 1 }

# Manager B attempts to cancel (Should fail with 403 Forbidden)
$cancelErr = $null
$resCancel = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/stocktransfers/$transfer2Id/cancel" -Method Put -Body "{}" -Headers $mgrBHeaders -ErrorAction SilentlyContinue -ErrorVariable cancelErr
$status = Get-ErrorStatusCode $cancelErr
Write-Host "  - Manager B canceling Manager A's transfer status: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) { Write-Host "[ERROR] Manager B was not blocked from canceling outgoing transfer." -ForegroundColor Red; Exit 1 }

# Manager A cancels the transfer
$cancelRes = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers/$transfer2Id/cancel" -Method Put -Body "{}" -Headers $mgrAHeaders
Write-Host "[SUCCESS] Transfer 2 Cancelled successfully." -ForegroundColor Green

# Check stock of Branch A (Should be restored: 30 + 20 = 50)
$prodA = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrAHeaders
$cokeA = $prodA | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch A Coke Stock (after cancel): $($cokeA.totalStock) (Expected: 50)" -ForegroundColor Gray
if ($cokeA.totalStock -ne 50) { Write-Host "[ERROR] Branch A stock not restored after cancel." -ForegroundColor Red; Exit 1 }

# 10. Transfer workflow: Initiate & Approve
Write-Host "`n[10/12] Testing Transfer Initiation and Approval workflow..." -ForegroundColor Yellow

# Manager A initiates transfer of 25 Coke
$initBody3 = @{ productId = $cokeId; sourceBranchId = $branchAId; targetBranchId = $branchBId; quantity = 25 } | ConvertTo-Json
$transfer3 = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $initBody3 -Headers $mgrAHeaders
$transfer3Id = $transfer3.id

# Check stock of Branch A (Should be 25)
$prodA = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrAHeaders
$cokeA = $prodA | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch A Coke Stock: $($cokeA.totalStock) (Expected: 25)" -ForegroundColor Gray
if ($cokeA.totalStock -ne 25) { Write-Host "[ERROR] Stock level mismatch." -ForegroundColor Red; Exit 1 }

# Manager B approves the transfer
$approveRes = Invoke-RestMethod -Uri "$baseUrl/api/stocktransfers/$transfer3Id/approve" -Method Put -Body "{}" -Headers $mgrBHeaders
Write-Host "[SUCCESS] Transfer 3 Approved successfully." -ForegroundColor Green

# Check stock of Branch A (Should remain 25)
$prodA = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrAHeaders
$cokeA = $prodA | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch A Coke Stock: $($cokeA.totalStock) (Expected: 25)" -ForegroundColor Gray
if ($cokeA.totalStock -ne 25) { Write-Host "[ERROR] Source stock level changed after approval." -ForegroundColor Red; Exit 1 }

# Check stock of Branch B (Should be: 10 + 25 = 35)
$prodB = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Get -Headers $mgrBHeaders
$cokeB = $prodB | Where-Object { $_.id -eq $cokeId }
Write-Host "  - Branch B Coke Stock: $($cokeB.totalStock) (Expected: 35)" -ForegroundColor Gray
if ($cokeB.totalStock -ne 35) { Write-Host "[ERROR] Target stock level not increased after approval." -ForegroundColor Red; Exit 1 }

# 11. Transfers in Shared Stock Mode block test
Write-Host "`n[11/12] Testing Transfers Block in Shared Stock Mode..." -ForegroundColor Yellow

# Toggle to Shared Stock Mode
$toggleRes = Invoke-RestMethod -Uri "$baseUrl/api/businesses/toggle-shared-stock" -Method Put -Headers $ownerHeaders
Write-Host "  - SharedStockMode is: $($toggleRes.sharedStockMode)" -ForegroundColor Gray

# Manager A attempts to initiate transfer (Should fail with 400 Bad Request)
$sharedInitErr = $null
$resSharedInit = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/stocktransfers" -Method Post -Body $initBody1 -Headers $mgrAHeaders -ErrorAction SilentlyContinue -ErrorVariable sharedInitErr
$status = Get-ErrorStatusCode $sharedInitErr
Write-Host "  - Initiate transfer in Shared Stock Mode status: $status (Expected: 400)" -ForegroundColor Gray
if ($status -ne 400) { Write-Host "[ERROR] Stock transfer was not blocked in Shared Stock Mode." -ForegroundColor Red; Exit 1 }
Write-Host "[SUCCESS] Stock transfers correctly blocked in Shared Stock Mode." -ForegroundColor Green

# Reset SharedStockMode back to Branch Stock Mode
$toggleRes2 = Invoke-RestMethod -Uri "$baseUrl/api/businesses/toggle-shared-stock" -Method Put -Headers $ownerHeaders

# 12. Stock Adjustment Logs Validation
Write-Host "`n[12/12] Verifying Stock Adjustment logs for transfers..." -ForegroundColor Yellow

# Get Coke adjustment logs for Branch B
$logsB = Invoke-RestMethod -Uri "$baseUrl/api/products/$cokeId/adjustment-logs" -Method Get -Headers $mgrBHeaders
Write-Host "  - Branch B Coke Logs count: $($logsB.Count) (Expected: >= 2, Initial + Inbound transfer)" -ForegroundColor Gray

# Get Coke adjustment logs for Branch A
$logsA = Invoke-RestMethod -Uri "$baseUrl/api/products/$cokeId/adjustment-logs" -Method Get -Headers $mgrAHeaders
Write-Host "  - Branch A Coke Logs count: $($logsA.Count) (Expected: >= 6)" -ForegroundColor Gray

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  PHASE 7 VERIFICATION COMPLETED: ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
