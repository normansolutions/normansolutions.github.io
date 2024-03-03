---
layout: post
title: "Automating Azure App Registrations with PowerShell"
date: 2024-03-01 21:38:20
type: post
tags:
  - PowerShell
  - Azure
  - SysAdmin
---

# **Automating Azure App Registrations with PowerShell**


It has been a while since I last blogged - life has certainly been busy!

Over the past two years I've somewhat immersed myself in PowerShell. While I wouldn't claim to be a PowerShell Guru, my knowledge has substantially grown, thanks in part to splendid collaboration with some exceptional colleagues.

In this post, I'll aim to demonstrate how you can leverage PowerShell (on-prem) to automate the creation of Azure App Registrations. 

## **The Problem: Manual App Registration**

Creating Azure App Registrations manually can be time-consuming and error-prone. This can be addressed by automating the process using PowerShell.

The purpose of this script:
* Take a list (CSV) of App Registration requirements
* For each item, automate the creation of Azure App Registrations
* Update the appropriate Azure App Registration Notes field (as required)
* Create a local certificate and upload this to the newly created App Registration
* Export PFX certificate

_Please be advised this is more a reference script; I have removed any logging aspects (which are usually an absolute must for auditing and debugging) and of course you may wish to <b>not</b> create certificates etc - this should be seen as a proof of concept starting point for your own requirements._


## **The Solution: PowerShell Magic**

### **1. Prepare Your CSV List**

Start by compiling a CSV list containing the necessary details for your App Registrations. In this example the CSV is expected to have the below columns, but of course, you can adjust to your own requirements:

* <strong>Name</strong> (Name of Azure App Registration)
* <strong>Operational_Location</strong> (Location where script will be used)
* <strong>Script_Owned_By</strong> (Who owns the script)
* <strong>Script_Author</strong> (Who wrote the script)
* <strong>Status</strong> (This columns is left blank and automatically updated by the script as each App Registration completes)

### **2. Write Your PowerShell Script**

Here's a simplified version of the script: 

```powershell

# Script to RunAs Administrator for certificate generation
#Requires -RunAsAdministrator

# Initialize variables
$appFile = $null
$app = ""
$count = 0
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Connect to MgGraph with appropriate scope
Connect-MgGraph -Scopes "Application.ReadWrite.All"

# Import CSV Data from $scriptPath\AppData.csv
$appFile = Import-Csv -Path "$scriptPath\AppData.csv"

# Loop through CSV where Status is not 'Done'
foreach ($app in ($appFile | Where-Object Status -ne 'Done')) {

    ## CREATE AAD APPLICATION ##
    # Initialize variables in loop
    $appName = ""
    $appExist = ""
    $operationLocation = ""
    $scriptOwnedBy = ""
    $scriptAuthor = ""
    $appNotes = ""
    $appCreate = ""
    $appObjectID = ""
    $date = ""
    $certName = ""
    $cert = ""
    $keyCreds = ""

    $appName = $app.Name.Trim()

    # Check if $appName has any problem characters in title
    $pattern = '[a-zA-Z0-9-_]'
    $nonAplhaDetected = $appName -replace $pattern, ''

    If (($nonAplhaDetected).Length -gt 0) {
        Add-Type -AssemblyName PresentationCore, PresentationFramework

        <# If $appName does have problem characters in title
        show appropriate message on screen and exit script #>
        $buttonType = [System.Windows.MessageBoxButton]::Ok
        $messageIcon = [System.Windows.MessageBoxImage]::Error
        $messageBody = "You have some non-alphanumeric characters in your App Reg $appName which could cause issues - suggestion is to remove these characters in the csv file and restart the script.  Please Note: No action has been taken, no App Reg or Certificate has been created at this stage."
        $messageTitle = "Potential Problem Characters Detected in $appName"
        [System.Windows.MessageBox]::Show($messageBody, $messageTitle, $buttonType, $messageIcon)
        Exit
    }

    # Check that $appName doesn't exist in Azure
    $appExist = (Get-MgApplication | Where-Object { $_.DisplayName -eq $appName }).Count

    if ($appExist -lt 1) {

        $count++
        $operationLocation = $app.Operational_Location
        $scriptOwnedBy = $app.Script_Owned_By
        $scriptAuthor = $app.Script_Author

        # Create new App Reg and build up Notes field
        $appCreate = New-MgApplication -DisplayName $appName

        $appObjectID = $appCreate.Id
        $appNotes = 'Operational Location: ' + $operationLocation + [System.Environment]::NewLine + 'Script Owned By: ' + $scriptOwnedBy + [System.Environment]::NewLine + 'Script Author: ' + $scriptAuthor | Out-String

        # Wait 5 seconds after $appName has been created
        Start-Sleep -Seconds 5

        ## CREATE & ADD CERTIFICATE TO AZURE APP ##

        # Create Self-Signed Certificate for $appName
        $date = (Get-Date).ToString("yyyyMMdd-hhmmss")
        $certName = "$appName-$date"
        $cert = New-SelfSignedCertificate -Subject "CN=$certName" -CertStoreLocation "Cert:\LocalMachine\My" -KeyExportPolicy Exportable -KeySpec Signature -KeyLength 2048 -KeyAlgorithm RSA -HashAlgorithm SHA256

        # Set cert file path based on script path and cert folder
        $certFilePath = "$scriptPath\Certificates"
        # Check if cert folder exists and if not create it"
        if (-not(Test-Path $certFilePath)) {
            New-Item $certFilePath -ItemType Directory | Out-Null
        }

        # Export Self-Signed Certificate for $appName
        Export-Certificate -Cert $cert -FilePath "$scriptPath\Certificates\$certName.cer"

        $graphAPICertificate = Get-ChildItem -Path "Cert:\LocalMachine\MY" | Where-Object { $_.Subject -match $certName } | Select-Object Thumbprint
        $graphAPICertificateThumbprint = $graphAPICertificate.Thumbprint
        $graphClientcertificate = Get-ChildItem "Cert:\LocalMachine\My\$graphAPICertificateThumbprint"

        # Create pfx Export for importing onto another server

        # General certificate password and copy to clipboard"
        $mytxtpwd = -join ('abcdefghkmnrstuvwxyzABCDEFGHKLMNPRSTUVWXYZ23456789$%&*#'.ToCharArray() | Get-Random -Count 10)
        Add-Type -AssemblyName PresentationCore, PresentationFramework
        $buttonType = [System.Windows.MessageBoxButton]::Ok
        $messageIcon = [System.Windows.MessageBoxImage]::Information
        $messageBody = "Your certificate password is $mytxtpwd - this has been copied to your clipboard - you will need this to import the pfx"
        $messageTitle = "PFX Certificate Password"
        [System.Windows.MessageBox]::Show($messageBody, $messageTitle, $buttonType, $messageIcon)
        $mytxtpwd | clip
        $mypwd = ConvertTo-SecureString -String $mytxtpwd -Force -AsPlainText

        # Export Self-Signed PFX Exportable Certificate for $appName
        $graphClientcertificate | Export-PfxCertificate -FilePath $scriptPath\Certificates\$certName.pfx -Password $mypwd

        # Create a keyCredential (Certificate) for App
        $keyCreds = @{
            Type  = "AsymmetricX509Cert";
            Usage = "Verify";
            key   = $graphClientcertificate.RawData
        }

        try {
            # Update $appName Notes
            Update-MgApplication -ApplicationId $aPPObjectID -Notes $appNotes
            # Wait 5 seconds after $appName has updated 'Notes' field
            Start-Sleep -Seconds 5
            # Update $appName Certificate
            Update-MgApplication -ApplicationId $appObjectID -KeyCredentials $keyCreds
            # Set $appName Status in csv as 'Done'
            $app.Status = "Done"
        }
        catch {
            # Log and handle error
        }
        # Wait 5 seconds after $appName has updated certificate and completed process
        Start-Sleep -Seconds 5

    }
    else {
        # Log and handle error that $appName already exists in Azure - no further action taken
    }
}
# Save CSV
$appFile | Export-Csv -Path "$scriptPath\AppData.csv"

Disconnect-MgGraph

```

## **Conclusion**

By automating Azure App Registrations with PowerShell, this will save time, reduce errors, and maintain consistency. Please remember to adapt this approach to fit your unique scenarios.


---