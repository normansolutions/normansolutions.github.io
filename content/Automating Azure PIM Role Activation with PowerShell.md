---
layout: post
title: "Automating Azure PIM Role Activation with PowerShell"
date: 2025-09-27 13:40:20
type: post
tags:
  - PowerShell
  - Azure
  - SysAdmin
---

Recently, I've been looking into ways to automate the elevation of roles in Azure Privileged Identity Management (PIM). The idea was to explore whether it's possible to streamline the activation process—particularly when juggling multiple admin roles—without compromising the just-in-time access model that PIM is built around.

## Why PIM?

[PIM](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure) is designed to reduce standing access to sensitive roles in Microsoft Entra ID (formerly Azure AD). Instead of assigning permanent admin rights, users activate roles temporarily when needed. This improves security, limits exposure, and provides a clear audit trail.

In practice, though, activating multiple roles manually—especially if you're eligible for several—can be repetitive. If you're jumping between Exchange, Teams, SharePoint, and Intune, the clicks add up.

## Initial Approach: Manual Activation

My first instinct was to stick with the portal. It's clean, intuitive, and works well for occasional use. But when role activation becomes part of your daily routine, it's worth exploring automation.

## PowerShell + Microsoft Graph

Using the Microsoft Graph PowerShell SDK, I built a script that connects to Graph, displays a Windows Form with checkboxes for common roles, and activates whichever ones you select—for a fixed duration.

This approach saves time without compromising the temporary nature of PIM access. It's not a replacement for governance—it's a helper for those who already have eligibility.

## Script Overview

### Authentication  
Connects to Microsoft Graph with the necessary scopes for role management.

### User Interface  
Displays a simple Windows Form with checkboxes for roles like Global Reader, Exchange Administrator, and Intune Administrator.

### Role Filtering  
Fetches eligible roles for the current user and filters based on selections made in the form.

### Activation Logic  
Loops through selected roles and submits activation requests with a justification and expiration time.

## Notes

- You can adjust the time elevated with the ```Duration``` value.
- It uses `New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest` to submit activation requests.
- You must already be eligible for the roles you want to activate.
- This is intended for interactive use—not background automation.

```PowerShell

# ----------------------------------------
# Connect to Microsoft Graph with required scopes
# ----------------------------------------
Connect-MgGraph -Scopes `
    RoleEligibilitySchedule.Read.Directory, `
    RoleEligibilitySchedule.ReadWrite.Directory, `
    RoleAssignmentSchedule.ReadWrite.Directory, `
    RoleManagement.ReadWrite.Directory, `
    RoleAssignmentSchedule.Remove.Directory

# ----------------------------------------
# Build a simple Windows Form UI for role selection
# ----------------------------------------

# Load necessary .NET assemblies for Windows Forms
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Create the main form
$form = New-Object System.Windows.Forms.Form
$form.Text = 'PIM Activation'
$form.Size = New-Object System.Drawing.Size(300, 430)
$form.StartPosition = 'CenterScreen'

# Create OK button
$okButton = New-Object System.Windows.Forms.Button
$okButton.Location = New-Object System.Drawing.Point(75, 345)
$okButton.Size = New-Object System.Drawing.Size(75, 23)
$okButton.Text = 'OK'
$okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
$form.AcceptButton = $okButton
$form.Controls.Add($okButton)

# Create Cancel button
$cancelButton = New-Object System.Windows.Forms.Button
$cancelButton.Location = New-Object System.Drawing.Point(150, 345)
$cancelButton.Size = New-Object System.Drawing.Size(75, 23)
$cancelButton.Text = 'Cancel'
$cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
$form.CancelButton = $cancelButton
$form.Controls.Add($cancelButton)

# ----------------------------------------
# Define roles and create checkboxes
# ----------------------------------------

# List of roles to offer for activation
$roles = @(
    "Global Reader",
    "SharePoint Administrator",
    "Teams Administrator",
    "Application Administrator",
    "Exchange Administrator",
    "Intune Administrator",
    "User Administrator"
)

# Create checkboxes for each role
$checkboxes = @{}
$top = 10
foreach ($role in $roles) {
    $checkbox = New-Object System.Windows.Forms.CheckBox
    $checkbox.Text = $role
    $checkbox.Left = 10
    $checkbox.Width = 300
    $checkbox.Top = $top
    $checkbox.CheckState = 'Checked'  # Default to checked
    $form.Controls.Add($checkbox)
    $checkboxes[$role] = $checkbox
    $top += 40
}

# Show the form and capture user input
$result = $form.ShowDialog()

# Exit if user cancels
if ($result -ne [System.Windows.Forms.DialogResult]::OK) { exit }

# ----------------------------------------
# Retrieve current user and eligible roles
# ----------------------------------------

# Get current user context
$context = Get-MgContext
$currentUser = (Get-MgUser -UserId $context.Account).Id
$currentName = (Get-MgUser -UserId $context.Account).DisplayName

# Get eligible roles for the current user
$myRoles = Get-MgRoleManagementDirectoryRoleEligibilitySchedule `
    -ExpandProperty RoleDefinition `
    -All `
    -Filter "principalId eq '$currentUser'"

# ----------------------------------------
# Filter selected roles based on checkbox input
# ----------------------------------------

$selectedRoles = @()
foreach ($role in $roles) {
    if ($checkboxes[$role].CheckState -eq 'Checked') {
        $selectedRole = $myRoles | Where-Object {
            $_.RoleDefinition.DisplayName -eq $role
        }
        if ($selectedRole) {
            $selectedRoles += $selectedRole
        }
    }
}

# ----------------------------------------
# Activate each selected role for 8 hours
# ----------------------------------------

foreach ($r in $selectedRoles) {
    $params = @{
        Action           = "selfActivate"
        PrincipalId      = $r.PrincipalId
        RoleDefinitionId = $r.RoleDefinitionId
        DirectoryScopeId = $r.DirectoryScopeId
        Justification    = "$currentName Enable $($r.RoleDefinition.DisplayName)"
        ScheduleInfo     = @{
            StartDateTime = Get-Date
            Expiration    = @{
                Type     = "AfterDuration"
                Duration = "PT1H"  # ISO 8601 format for 1 hour
            }
        }
    }

    # Submit activation request
    New-MgRoleManagementDirectoryRoleAssignmentScheduleRequest `
        -BodyParameter $params `
        -ErrorAction 'SilentlyContinue'
}


```

## Final Thoughts

Automating PIM role activation can be a real time-saver, especially for admins who frequently need access across multiple services. That said, it's important to use this approach responsibly. Automating too aggressively risks undermining the very purpose of PIM.

---