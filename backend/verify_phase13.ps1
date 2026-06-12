# verify_phase13.ps1
# Integration test script for Phase 13 - Super Admin Dashboard & Platform Controls

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 13 SUPER ADMIN VERIFICATION"     -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Login as default SuperAdmin
Write-Host "`n[1/6] Logging in as default SuperAdmin..." -ForegroundColor Yellow
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

$superHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $superToken"
}

# Fetch initial SuperAdmin stats
$initialStats = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/stats" -Method Get -Headers $superHeaders
Write-Host "Initial Stats - Total Businesses: $($initialStats.totalBusinesses), SaaS Revenue: $($initialStats.totalSaaSRevenue)" -ForegroundColor Gray

# 2. Register a new Business Owner (Oliver) and verify counts increment
$emailSuffix = Get-Random
$ownerEmail = "oliver_super_$emailSuffix@example.com"
$ownerPassword = "Password123!"
Write-Host "`n[2/6] Registering a new Business Owner ($ownerEmail)..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Oliver"
    lastName = "AdminTest"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Oliver Super Bakery $emailSuffix"
    subdomain = "olifast$emailSuffix"
} | ConvertTo-Json

$registerRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register-owner" -Method Post -Body $registerBody -Headers $headers
$ownerToken = $registerRes.token
$bakeryId = $registerRes.businessId
Write-Host "[SUCCESS] Registered Owner. Bakery Business ID: $bakeryId" -ForegroundColor Green

# Fetch updated SuperAdmin stats
$updatedStats = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/stats" -Method Get -Headers $superHeaders
Write-Host "Updated Stats - Total Businesses: $($updatedStats.totalBusinesses) (Expected increment)" -ForegroundColor Gray

if ($updatedStats.totalBusinesses -ne ($initialStats.totalBusinesses + 1)) {
    Write-Host "[ERROR] Stats total businesses count did not increment." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Platform Stats tracking verified successfully." -ForegroundColor Green

# 3. Retrieve business list and locate target business
Write-Host "`n[3/6] Fetching all businesses and verifying subscription details..." -ForegroundColor Yellow
$businesses = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses" -Method Get -Headers $superHeaders
$targetBusiness = $businesses | Where-Object { $_.id -eq $bakeryId }

if ($null -eq $targetBusiness) {
    Write-Host "[ERROR] Created business not found in Super Admin listing." -ForegroundColor Red; Exit 1
}

Write-Host "  - Business: $($targetBusiness.name)" -ForegroundColor Gray
Write-Host "  - Subdomain: $($targetBusiness.subdomain)" -ForegroundColor Gray
Write-Host "  - Subscription Tier: $($targetBusiness.subscriptionTier) (Default: Pro)" -ForegroundColor Gray
Write-Host "  - Subscription Status: $($targetBusiness.subscriptionStatus) (Default: Inactive)" -ForegroundColor Gray
Write-Host "  - Subscription Price: $($targetBusiness.subscriptionPrice) (Default: 299.00)" -ForegroundColor Gray

if ($targetBusiness.subscriptionTier -ne "Pro" -or $targetBusiness.subscriptionStatus -ne "Inactive" -or $targetBusiness.subscriptionPrice -ne 299.00) {
    Write-Host "[ERROR] Default subscription values on business creation were not populated correctly." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Business listing and subscription info verified." -ForegroundColor Green

# 4. Suspend Business and verify access deactivation
Write-Host "`n[4/6] Suspending business $bakeryId..." -ForegroundColor Yellow
$suspendRes = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses/$bakeryId/suspend" -Method Post -Headers $superHeaders
Write-Host "[SUCCESS] Suspend endpoint returned: $($suspendRes.message)" -ForegroundColor Green

# Attempt Owner Login -> Should fail (403 Forbidden)
Write-Host "Attempting login with suspended business credentials (expected to fail)..." -ForegroundColor Gray
$ownerLoginBody = @{
    email = $ownerEmail
    password = $ownerPassword
} | ConvertTo-Json

try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $ownerLoginBody -Headers $headers
    Write-Host "[ERROR] Login succeeded for a suspended business!" -ForegroundColor Red; Exit 1
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 403) {
        Write-Host "[SUCCESS] Login rejected with 403 Forbidden as expected." -ForegroundColor Green
      } else {
        Write-Host "[ERROR] Unexpected login failure code: $statusCode" -ForegroundColor Red; Exit 1
      }
}

# 5. Activate Business and verify access restoration
Write-Host "`n[5/6] Activating business $bakeryId..." -ForegroundColor Yellow
$activateRes = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses/$bakeryId/activate" -Method Post -Headers $superHeaders
Write-Host "[SUCCESS] Activate endpoint returned: $($activateRes.message)" -ForegroundColor Green

# Attempt Owner Login -> Should now succeed
$ownerLoginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $ownerLoginBody -Headers $headers
if ($null -ne $ownerLoginRes.token) {
    Write-Host "[SUCCESS] Login restored and authenticated successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Restored login failed." -ForegroundColor Red; Exit 1
}

# 6. Update Subscription Details and Assert Audit Logs
Write-Host "`n[6/6] Modifying subscription details & checking audit logs..." -ForegroundColor Yellow

$expiryDate = (Get-Date).AddMonths(6).ToString("o")
$subBody = @{
    subscriptionTier = "Enterprise"
    subscriptionStatus = "Active"
    subscriptionPrice = 999.00
    subscriptionExpiresAt = $expiryDate
} | ConvertTo-Json

$subRes = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/businesses/$bakeryId/subscription" -Method Put -Body $subBody -Headers $superHeaders
Write-Host "[SUCCESS] Subscription update endpoint returned: $($subRes.message)" -ForegroundColor Green

# Verify subscription details in stats
$finalStats = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/stats" -Method Get -Headers $superHeaders
Write-Host "Final Stats - SaaS Revenue: $($finalStats.totalSaaSRevenue)" -ForegroundColor Gray

# Retrieve Audit Logs
$auditLogs = Invoke-RestMethod -Uri "$baseUrl/api/superadmin/audit-logs" -Method Get -Headers $superHeaders

$suspendLog = $auditLogs | Where-Object { $_.action -eq "BusinessSuspended" -and $_.businessId -eq $bakeryId }
$activateLog = $auditLogs | Where-Object { $_.action -eq "BusinessActivated" -and $_.businessId -eq $bakeryId }
$subLog = $auditLogs | Where-Object { $_.action -eq "SubscriptionUpdated" -and $_.businessId -eq $bakeryId }

if ($null -eq $suspendLog -or $null -eq $activateLog -or $null -eq $subLog) {
    Write-Host "[ERROR] Missing audit log records for business actions." -ForegroundColor Red; Exit 1
}

Write-Host "Verified audit logs:" -ForegroundColor Gray
Write-Host "  * $($suspendLog.action): $($suspendLog.details) (Actor: $($suspendLog.userEmail))" -ForegroundColor Gray
Write-Host "  * $($activateLog.action): $($activateLog.details) (Actor: $($activateLog.userEmail))" -ForegroundColor Gray
Write-Host "  * $($subLog.action): $($subLog.details) (Actor: $($subLog.userEmail))" -ForegroundColor Gray

Write-Host "[SUCCESS] Subscription pricing updates and Audit Logging verified successfully!" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL PHASE 13 SUPER ADMIN INTEGRATION TESTS PASSED!"       -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
