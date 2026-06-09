# verify_phase5.ps1
# Integration test script for Phase 5 - User & Staff Management (RBAC Expansion)

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 5 VERIFICATION SUITE" -ForegroundColor Cyan
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
Write-Host "`n[1/9] Logging in as default SuperAdmin..." -ForegroundColor Yellow
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
Write-Host "`n[2/9] Registering a new Business Owner ($ownerEmail)..." -ForegroundColor Yellow

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
Write-Host "`n[3/9] Creating Branch A and Branch B..." -ForegroundColor Yellow
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
Write-Host "`n[4/9] Creating Staff members..." -ForegroundColor Yellow

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
$managerId = $manager.id
$cashierId = $cashier.id
Write-Host "[SUCCESS] Created Manager ($managerEmail) for Branch Alpha" -ForegroundColor Green
Write-Host "[SUCCESS] Created Cashier ($cashierEmail) for Branch Beta" -ForegroundColor Green

# 5. Verify Branch-Level Data Isolation (Owner switching branch contexts)
Write-Host "`n[5/9] Verifying branch context data isolation for Owner..." -ForegroundColor Yellow

# A. Global View (Default) - Should list both staff members
$staffGlobal = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Get -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Global view check failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Global Staff Count: $($staffGlobal.Count) (Expected: 2)" -ForegroundColor Gray
if ($staffGlobal.Count -ne 2) {
    Write-Host "[ERROR] Global staff count did not match." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Global staff list isolated correctly." -ForegroundColor Green

# B. Switch to Branch Alpha
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/$branchAId" -Method Post -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Switch to Branch Alpha failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$alphaToken = $switchRes.token
$alphaHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $alphaToken"
}
$staffAlpha = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Get -Headers $alphaHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Fetch staff for Branch Alpha failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Branch Alpha Staff Count: $($staffAlpha.Count) (Expected: 1, Manager only)" -ForegroundColor Gray
if ($staffAlpha.Count -ne 1 -or $staffAlpha[0].role -ne "Manager") {
    Write-Host "[ERROR] Branch Alpha staff list did not isolate correctly." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Branch Alpha context isolated correctly." -ForegroundColor Green

# C. Switch to Branch Beta
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/$branchBId" -Method Post -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Switch to Branch Beta failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
$betaToken = $switchRes.token
$betaHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $betaToken"
}
$staffBeta = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Get -Headers $betaHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Fetch staff for Branch Beta failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Branch Beta Staff Count: $($staffBeta.Count) (Expected: 1, Cashier only)" -ForegroundColor Gray
if ($staffBeta.Count -ne 1 -or $staffBeta[0].role -ne "Cashier") {
    Write-Host "[ERROR] Branch Beta staff list did not isolate correctly." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Branch Beta context isolated correctly." -ForegroundColor Green

# 6. Authenticate Staff Users and Verify Role Restrictions
Write-Host "`n[6/9] Logging in as staff and testing branch authorization restrictions..." -ForegroundColor Yellow

# A. Log in Manager
$mgrLoginBody = @{ email = $managerEmail; password = "Password123!" } | ConvertTo-Json
$mgrRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $mgrLoginBody -Headers $headers
$mgrToken = $mgrRes.token
$mgrHeaders = @{ "Authorization" = "Bearer $mgrToken" }

# B. Log in Cashier
$cshLoginBody = @{ email = $cashierEmail; password = "Password123!" } | ConvertTo-Json
$cshRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cshLoginBody -Headers $headers
$cshToken = $cshRes.token
$cshHeaders = @{ "Authorization" = "Bearer $cshToken" }

# C. Verify Manager can access Branch A details, but NOT Branch B
$mgrErr = $null
$resA = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/branches/$branchAId" -Method Get -Headers $mgrHeaders -ErrorAction SilentlyContinue -ErrorVariable mgrErr
if ($mgrErr) {
    Write-Host "[ERROR] Manager failed to access their assigned Branch Alpha details." -ForegroundColor Red
    Write-Error $mgrErr[0]
    Exit 1
}
Write-Host "  - Manager access to assigned Branch Alpha: $($resA.StatusCode) OK (Expected: 200)" -ForegroundColor Gray

$mgrErr = $null
$resB = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/branches/$branchBId" -Method Get -Headers $mgrHeaders -ErrorAction SilentlyContinue -ErrorVariable mgrErr
if (-not $mgrErr) {
    Write-Host "[ERROR] Error: Manager was allowed to access Branch Beta (Expected: Forbidden)" -ForegroundColor Red
    Exit 1
}
$status = Get-ErrorStatusCode $mgrErr
Write-Host "  - Manager access to other Branch Beta: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) {
    Write-Host "[ERROR] Manager was not blocked with 403 Forbidden." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Manager branch access validation passed." -ForegroundColor Green

# D. Verify Cashier can access Branch B details, but NOT Branch A
$cshErr = $null
$resB = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/branches/$branchBId" -Method Get -Headers $cshHeaders -ErrorAction SilentlyContinue -ErrorVariable cshErr
if ($cshErr) {
    Write-Host "[ERROR] Cashier failed to access their assigned Branch Beta details." -ForegroundColor Red
    Write-Error $cshErr[0]
    Exit 1
}
Write-Host "  - Cashier access to assigned Branch Beta: $($resB.StatusCode) OK (Expected: 200)" -ForegroundColor Gray

$cshErr = $null
$resA = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/branches/$branchAId" -Method Get -Headers $cshHeaders -ErrorAction SilentlyContinue -ErrorVariable cshErr
if (-not $cshErr) {
    Write-Host "[ERROR] Error: Cashier was allowed to access Branch Alpha (Expected: Forbidden)" -ForegroundColor Red
    Exit 1
}
$status = Get-ErrorStatusCode $cshErr
Write-Host "  - Cashier access to other Branch Alpha: $status (Expected: 403)" -ForegroundColor Gray
if ($status -ne 403) {
    Write-Host "[ERROR] Cashier was not blocked with 403 Forbidden." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Cashier branch access validation passed." -ForegroundColor Green

# 7. Verify Staff Deactivation Lockout Flow
Write-Host "`n[7/9] Verifying staff deactivation lockout flow..." -ForegroundColor Yellow

# A. Owner deactivates Manager
$deactivateRes = Invoke-RestMethod -Uri "$baseUrl/api/staff/$managerId/toggle-active" -Method Put -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Deactivation action failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Manager IsActive state set to: $($deactivateRes.isActive) (Expected: False)" -ForegroundColor Gray
if ($deactivateRes.isActive -ne $false) {
    Write-Host "[ERROR] Manager isActive was not false." -ForegroundColor Red
    Exit 1
}

# B. Attempt Manager Login -> Should fail with 400 Bad Request
$loginErr = $null
$loginFail = Invoke-WebRequest -UseBasicParsing -Uri "$baseUrl/api/auth/login" -Method Post -Body $mgrLoginBody -Headers $headers -ErrorAction SilentlyContinue -ErrorVariable loginErr
if (-not $loginErr) {
    Write-Host "[ERROR] Error: Deactivated manager was allowed to login successfully." -ForegroundColor Red
    Exit 1
}
$status = Get-ErrorStatusCode $loginErr
Write-Host "  - Deactivated Manager Login: $status (Expected: 400)" -ForegroundColor Gray
if ($status -ne 400) {
    Write-Host "[ERROR] Login was not blocked with 400 Bad Request." -ForegroundColor Red
    Exit 1
}
Write-Host "[SUCCESS] Deactivated Manager lockout validation passed." -ForegroundColor Green

# 8. Verify Staff Reactivation Flow
Write-Host "`n[8/9] Verifying staff reactivation flow..." -ForegroundColor Yellow

# A. Owner reactivates Manager
$reactivateRes = Invoke-RestMethod -Uri "$baseUrl/api/staff/$managerId/toggle-active" -Method Put -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Reactivation action failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Manager IsActive state set to: $($reactivateRes.isActive) (Expected: True)" -ForegroundColor Gray
if ($reactivateRes.isActive -ne $true) {
    Write-Host "[ERROR] Manager isActive was not true." -ForegroundColor Red
    Exit 1
}

# B. Attempt Manager Login -> Should succeed
$loginSuccess = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $mgrLoginBody -Headers $headers -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Reactivated Manager login failed." -ForegroundColor Red
    Write-Error $err[0]
    Exit 1
}
Write-Host "  - Reactivated Manager Login: OK (Expected: Success)" -ForegroundColor Gray
Write-Host "[SUCCESS] Reactivated Manager login validation passed." -ForegroundColor Green

# 9. Clean Up Context Switches
Write-Host "`n[9/9] Resetting active branch context to Global..." -ForegroundColor Yellow
$switchRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/switch-branch/global" -Method Post -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Context reset failed." -ForegroundColor Red
    Write-Error $err[0]
}
if (-not $err) {
    Write-Host "[SUCCESS] Active context reset to Global successfully." -ForegroundColor Green
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  PHASE 5 VERIFICATION COMPLETED: ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
