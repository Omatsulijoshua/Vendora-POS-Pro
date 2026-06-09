# verify_phase10.ps1
# Integration test script for Phase 10 - Receipt System (Customizable)

$baseUrl = "http://localhost:5149"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  VENDORA POS PRO - PHASE 10 RECEIPT SYSTEM VERIFICATION"   -ForegroundColor Cyan
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

# Helper function to upload logo file
function Upload-LogoFile($token, $filePath) {
    $uri = "$baseUrl/api/receipts/upload-logo"
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = [System.IO.Path]::GetFileName($filePath)
    
    $LF = "`r`n"
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: image/png",
        "",
        ""
    ) -join $LF
    
    $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyLines)
    $footerBytes = [System.Text.Encoding]::UTF8.GetBytes("$LF--$boundary--$LF")
    
    $requestBytes = New-Object Byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
    [System.Buffer]::BlockCopy($headerBytes, 0, $requestBytes, 0, $headerBytes.Length)
    [System.Buffer]::BlockCopy($fileBytes, 0, $requestBytes, $headerBytes.Length, $fileBytes.Length)
    [System.Buffer]::BlockCopy($footerBytes, 0, $requestBytes, ($headerBytes.Length + $fileBytes.Length), $footerBytes.Length)
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "multipart/form-data; boundary=$boundary"
    }
    
    return Invoke-RestMethod -Uri $uri -Method Post -Body $requestBytes -Headers $headers
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
$ownerEmail = "owner_receipt_$emailSuffix@example.com"
$ownerPassword = "Password123!"
Write-Host "`n[2/11] Registering a new Business Owner ($ownerEmail)..." -ForegroundColor Yellow

$registerBody = @{
    firstName = "Receipt"
    lastName = "Architect"
    email = $ownerEmail
    password = $ownerPassword
    businessName = "Apex Receipt Shop $emailSuffix"
    subdomain = "apexreceipt$emailSuffix"
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

# 3. Create Branch and Staff (Manager Mandy, Cashier Cathy)
Write-Host "`n[3/11] Creating Branch, Manager, and Cashier..." -ForegroundColor Yellow
$branchBody = @{ name = "Receipt Branch 1"; address = "101 Receipt Rd"; phone = "555-1234" } | ConvertTo-Json
$branch = Invoke-RestMethod -Uri "$baseUrl/api/branches" -Method Post -Body $branchBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Branch creation failed." -ForegroundColor Red; Exit 1
}
$branchId = $branch.id
Write-Host "[SUCCESS] Branch Created: $branchId" -ForegroundColor Green

$managerEmail = "mandy_$emailSuffix@example.com"
$mngBody = @{ firstName = "Mandy"; lastName = "Manager"; email = $managerEmail; password = "Password123!"; role = "Manager"; branchId = $branchId } | ConvertTo-Json
$mng = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $mngBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Manager creation failed." -ForegroundColor Red; Exit 1 }
Write-Host "[SUCCESS] Manager Mandy created." -ForegroundColor Green

$cashierEmail = "cathy_$emailSuffix@example.com"
$cshBody = @{ firstName = "Cathy"; lastName = "Cashier"; email = $cashierEmail; password = "Password123!"; role = "Cashier"; branchId = $branchId } | ConvertTo-Json
$csh = Invoke-RestMethod -Uri "$baseUrl/api/staff" -Method Post -Body $cshBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) { Write-Host "[ERROR] Cashier creation failed." -ForegroundColor Red; Exit 1 }
Write-Host "[SUCCESS] Cashier Cathy created." -ForegroundColor Green

# 4. Fetch default receipt settings (should be created on the fly)
Write-Host "`n[4/11] Fetching default receipt settings..." -ForegroundColor Yellow
$settings = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method Get -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Fetching receipt settings failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Default Settings Fetched: layout = $($settings.receiptLayout), businessName = $($settings.businessName), showLogo = $($settings.showLogo)" -ForegroundColor Green
if ($settings.businessName -ne "Apex Receipt Shop $emailSuffix") {
    Write-Host "[ERROR] Business name did not match expected value." -ForegroundColor Red; Exit 1
}

# 5. Upload Custom Logo
Write-Host "`n[5/11] Uploading custom logo image..." -ForegroundColor Yellow
$dummyPath = Join-Path $PSScriptRoot "dummy_logo.png"
[System.IO.File]::WriteAllBytes($dummyPath, (New-Object Byte[] 100))

$uploadRes = Upload-LogoFile $ownerToken $dummyPath
Remove-Item $dummyPath -Force

if (-not $uploadRes.logoUrl) {
    Write-Host "[ERROR] Logo upload failed." -ForegroundColor Red; Exit 1
}
$logoUrl = $uploadRes.logoUrl
Write-Host "[SUCCESS] Custom logo uploaded. Logo URL: $logoUrl" -ForegroundColor Green

# 6. Update business default settings
Write-Host "`n[6/11] Updating business default settings with custom logo and headers..." -ForegroundColor Yellow
$updateBody = @{
    branchId = $null
    logoUrl = $logoUrl
    headerText = "Custom Welcome Header Text"
    footerText = "Custom Thank You Footer Text"
    showLogo = $true
    showBranchDetails = $true
    showCashierInfo = $true
    showQRCode = $true
    receiptLayout = "A4"
    customBrandingColor = "#123456"
} | ConvertTo-Json

$updatedSettings = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method Put -Body $updateBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Updating settings failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Business default settings updated successfully. Layout: $($updatedSettings.receiptLayout)" -ForegroundColor Green
if ($updatedSettings.headerText -ne "Custom Welcome Header Text" -or $updatedSettings.receiptLayout -ne "A4") {
    Write-Host "[ERROR] Settings values did not match expected." -ForegroundColor Red; Exit 1
}

# 7. Create branch override settings
Write-Host "`n[7/11] Creating branch override settings (Thermal roll layout)..." -ForegroundColor Yellow
$overrideBody = @{
    branchId = $branchId
    logoUrl = $logoUrl
    headerText = "Branch Override Welcome"
    footerText = "Branch Override Footer"
    showLogo = $false
    showBranchDetails = $false
    showCashierInfo = $false
    showQRCode = $true
    receiptLayout = "Thermal"
    customBrandingColor = "#987654"
} | ConvertTo-Json

$branchSettings = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method Put -Body $overrideBody -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Creating branch override failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Branch override settings updated successfully. Layout: $($branchSettings.receiptLayout)" -ForegroundColor Green

# 8. Retrieve branch override settings specifically
Write-Host "`n[8/11] Retrieving settings for specific branch override..." -ForegroundColor Yellow
$retrievedBranchSettings = Invoke-RestMethod -Uri "$baseUrl/api/receipts?branchId=$branchId" -Method Get -Headers $ownerHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Fetching branch settings failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Branch settings fetched: header = $($retrievedBranchSettings.headerText), layout = $($retrievedBranchSettings.receiptLayout)" -ForegroundColor Green
if ($retrievedBranchSettings.headerText -ne "Branch Override Welcome" -or $retrievedBranchSettings.receiptLayout -ne "Thermal") {
    Write-Host "[ERROR] Retrieved override settings did not match expected values." -ForegroundColor Red; Exit 1
}

# 9. Manager Mandy logs in and retrieves branch settings
Write-Host "`n[9/11] Logging in as Manager Mandy and retrieving branch settings..." -ForegroundColor Yellow
$mngLoginBody = @{ email = $managerEmail; password = "Password123!" } | ConvertTo-Json
$mngRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $mngLoginBody -Headers $headers
$mngToken = $mngRes.token
$mngHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $mngToken" }

$mngSettings = Invoke-RestMethod -Uri "$baseUrl/api/receipts" -Method Get -Headers $mngHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Manager failed to fetch settings." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Manager Mandy fetched settings. Header: $($mngSettings.headerText). Isolated to branch: $($mngSettings.branchId)" -ForegroundColor Green
if ($mngSettings.branchId -ne $branchId) {
    Write-Host "[ERROR] Manager was not isolated to their branchId." -ForegroundColor Red; Exit 1
}

# 10. Cashier Cathy logs in and processes a sale
Write-Host "`n[10/11] Logging in as Cashier Cathy and processing a sale..." -ForegroundColor Yellow
$cshLoginBody = @{ email = $cashierEmail; password = "Password123!" } | ConvertTo-Json
$cshRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $cshLoginBody -Headers $headers
$cshToken = $cshRes.token
$cshHeaders = @{ "Content-Type" = "application/json"; "Authorization" = "Bearer $cshToken" }

# Create Category & Product for sale
$categoryBody = @{ name = "Gifts"; description = "Wraps" } | ConvertTo-Json
$catRes = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method Post -Body $categoryBody -Headers $ownerHeaders
$categoryId = $catRes.id

$productBody = @{
    name = "Gift Mug"
    sku = "MUG-1"
    price = 20.00
    costPrice = 8.00
    categoryId = $categoryId
    initialStocks = @(
        @{ branchId = $branchId; quantity = 50; minStockLevel = 5 }
    )
} | ConvertTo-Json
$prodRes = Invoke-RestMethod -Uri "$baseUrl/api/products" -Method Post -Body $productBody -Headers $ownerHeaders
$productId = $prodRes.id

# Submit Checkout
$saleBody = @{
    paymentMethod = "Cash"
    discountAmount = 0.00
    taxAmount = 1.60
    items = @(
        @{ productId = $productId; quantity = 1; unitPrice = 20.00; discountAmount = 0.00 }
    )
} | ConvertTo-Json

$saleRes = Invoke-RestMethod -Uri "$baseUrl/api/sales" -Method Post -Body $saleBody -Headers $cshHeaders -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Processing sale failed." -ForegroundColor Red; Exit 1
}
$saleId = $saleRes.id
Write-Host "[SUCCESS] Sale processed successfully. Sale ID: $saleId" -ForegroundColor Green

# 11. Public receipt verification endpoint (unauthenticated)
Write-Host "`n[11/11] Verifying receipt publicly (unauthenticated)..." -ForegroundColor Yellow
$verifyRes = Invoke-RestMethod -Uri "$baseUrl/api/sales/verify/$saleId" -Method Get -ErrorAction SilentlyContinue -ErrorVariable err
if ($err) {
    Write-Host "[ERROR] Public verification lookup failed." -ForegroundColor Red; Exit 1
}
Write-Host "[SUCCESS] Public receipt verification succeeded!" -ForegroundColor Green
Write-Host "  Verified Business: $($verifyRes.businessName)" -ForegroundColor Green
Write-Host "  Verified Branch  : $($verifyRes.branchName)" -ForegroundColor Green
Write-Host "  Total Items Paid : $($verifyRes.items.Count)" -ForegroundColor Green
Write-Host "  Total Amount Paid: $($verifyRes.total)" -ForegroundColor Green

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "  ALL PHASE 10 RECEIPT SYSTEM INTEGRATION TESTS PASSED!"    -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
