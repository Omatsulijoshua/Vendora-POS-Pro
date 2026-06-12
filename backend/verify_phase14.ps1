# verify_phase14.ps1
# Integration test script for Phase 14 - Subscription Billing & Stripe Integration

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 14 BILLING & STRIPE INTEGRATION"    -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Register a new Owner and Business
$emailSuffix = Get-Random
$ownerEmail = "oliver_billing_$emailSuffix@example.com"
$ownerPassword = "Password123!"
$subdomain = "olibill$emailSuffix"
$customerId = "cus_mock_$emailSuffix"
$subscriptionId = "sub_mock_$emailSuffix"
Write-Host "`n[1/6] Registering a new Owner ($ownerEmail) and Business..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Oliver"
    lastName = "BillingTest"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Oliver Billing Bakery $emailSuffix"
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

# 2. Get initial billing status
Write-Host "`n[2/6] Querying initial subscription status..." -ForegroundColor Yellow
$status = Invoke-RestMethod -Uri "$baseUrl/api/billing/status" -Method Get -Headers $ownerHeaders
Write-Host "Initial Plan: $($status.subscriptionTier), Status: $($status.subscriptionStatus), Expires: $($status.subscriptionExpiresAt)" -ForegroundColor Gray

if ($status.subscriptionTier -ne "Pro" -or $status.subscriptionStatus -ne "Inactive" -or $status.isMockMode -ne $true) {
    Write-Host "[ERROR] Default pricing/mock configuration is invalid." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Default subscription context verified." -ForegroundColor Green

# 3. Create a cashier for this business to test locking
Write-Host "`n[3/6] Creating a Cashier user under this business..." -ForegroundColor Yellow

$branchBody = @{
    name = "Main Branch"
    address = "123 Main Street"
    phone = "555-0199"
} | ConvertTo-Json
$branchRes = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchBody -Headers $ownerHeaders
$defaultBranchId = $branchRes.id
Write-Host "Created Branch ID: $defaultBranchId" -ForegroundColor Gray

$staffBody = @{
    firstName = "John"
    lastName = "Cashier"
    email = "cashier_$emailSuffix@example.com"
    password = "Password123!"
    role = "Cashier"
    branchId = $defaultBranchId
} | ConvertTo-Json

$staffRes = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $staffBody -Headers $ownerHeaders
Write-Host "[SUCCESS] Cashier John created." -ForegroundColor Green

# 4. Initiate a plan checkout (Basic)
Write-Host "`n[4/6] Creating a Stripe Checkout session for 'Basic' Monthly plan..." -ForegroundColor Yellow
$checkoutBody = @{
    tier = "Basic"
    billingCycle = "Monthly"
    successUrl = "http://localhost:3000/success"
    cancelUrl = "http://localhost:3000/cancel"
} | ConvertTo-Json

$checkoutRes = Invoke-RestMethod -Uri "$baseUrl/api/billing/checkout" -Method Post -Body $checkoutBody -Headers $ownerHeaders
Write-Host "Checkout Redirect URL: $($checkoutRes.checkoutUrl)" -ForegroundColor Gray

if ($checkoutRes.checkoutUrl -notlike "*mock_session_*") {
    Write-Host "[ERROR] Checkout URL did not match expected Mock format." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Mock checkout session URL generated successfully." -ForegroundColor Green

# 5. Simulate Webhook: checkout.session.completed (Upgrade/Downgrade to Basic)
Write-Host "`n[5/6] Simulating Stripe Webhook: checkout.session.completed..." -ForegroundColor Yellow
$webhookPayload = @{
    type = "checkout.session.completed"
    data = @{
        object = @{
            client_reference_id = $businessId
            customer = $customerId
            subscription = $subscriptionId
            metadata = @{
                tier = "Basic"
                billingCycle = "Monthly"
            }
        }
    }
} | ConvertTo-Json -Depth 5

# Webhook has AllowAnonymous
try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/webhooks/stripe" -Method Post -Body $webhookPayload -Headers $headers
    Write-Host "[SUCCESS] Webhook accepted." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Webhook rejected: $_" -ForegroundColor Red; Exit 1
}

# Verify billing status changed
$newStatus = Invoke-RestMethod -Uri "$baseUrl/api/billing/status" -Method Get -Headers $ownerHeaders
Write-Host "Updated Plan: $($newStatus.subscriptionTier), Status: $($newStatus.subscriptionStatus), Price: $($newStatus.subscriptionPrice), Customer: $($newStatus.stripeCustomerId)" -ForegroundColor Gray

if ($newStatus.subscriptionTier -ne "Basic" -or $newStatus.subscriptionStatus -ne "Active" -or $newStatus.subscriptionPrice -ne 99.00 -or $newStatus.stripeCustomerId -ne $customerId) {
    Write-Host "[ERROR] Billing status was not updated correctly by webhook." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Subscription webhook successfully updated business data." -ForegroundColor Green

# 6. Simulate Webhook: invoice.payment_failed (Delinquency check)
Write-Host "`n[6/6] Simulating Stripe Webhook: invoice.payment_failed (cancellation/delinquency)..." -ForegroundColor Yellow
$failedPayload = @{
    type = "invoice.payment_failed"
    data = @{
        object = @{
            subscription = $subscriptionId
        }
    }
} | ConvertTo-Json -Depth 5

try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/webhooks/stripe" -Method Post -Body $failedPayload -Headers $headers
    Write-Host "[SUCCESS] Delinquency Webhook accepted." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Delinquency Webhook rejected: $_" -ForegroundColor Red; Exit 1
}

# Verify status changed to Past Due
$delinquentStatus = Invoke-RestMethod -Uri "$baseUrl/api/billing/status" -Method Get -Headers $ownerHeaders
Write-Host "Delinquent Plan Status: $($delinquentStatus.subscriptionStatus)" -ForegroundColor Gray

if ($delinquentStatus.subscriptionStatus -ne "Past Due") {
    Write-Host "[ERROR] Plan status did not update to 'Past Due'." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Business status set to Past Due." -ForegroundColor Green

# Verify Cashier Login is Gated (402 Payment Required)
Write-Host "Verifying Cashier John login is blocked..." -ForegroundColor Gray
$cashierLogin = @{
    email = "cashier_$emailSuffix@example.com"
    password = "Password123!"
} | ConvertTo-Json

try {
    $null = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cashierLogin -Headers $headers
    Write-Host "[ERROR] Cashier login was allowed for a delinquent business!" -ForegroundColor Red; Exit 1
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 402) {
        Write-Host "[SUCCESS] Cashier login blocked with 402 Payment Required as expected." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Unexpected status code on cashier blocked login: $statusCode" -ForegroundColor Red; Exit 1
    }
}

# Verify Owner Login is allowed but flagged
Write-Host "Verifying Owner oliver login succeeds but is flagged..." -ForegroundColor Gray
$ownerLoginBody = @{
    email = $ownerEmail
    password = $ownerPassword
} | ConvertTo-Json

$ownerLoginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $ownerLoginBody -Headers $headers
if ($ownerLoginRes.token -ne $null -and $ownerLoginRes.isSubscriptionActive -eq $false) {
    Write-Host "[SUCCESS] Owner allowed to log in but flagged IsSubscriptionActive = False." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Owner login failed or was not flagged correctly. IsSubscriptionActive: $($ownerLoginRes.isSubscriptionActive)" -ForegroundColor Red; Exit 1
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL PHASE 14 BILLING INTEGRATION TESTS PASSED!"          -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
