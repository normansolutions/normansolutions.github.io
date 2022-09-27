---
layout: post
title: "Power Automate to populate a blood pressure spreadsheet - using an email subject field!"
date: 2022-09-27 16:55:20
type: post
tags:
  - Power Automate
  - QuickTip
  - Office 365
  - Outlook
---


>OK....that title was a bit of a mouthful - but it's a little difficult to categorise what is essentially a kind of hack!

Recently, I felt it was advisable to start regularly recording my blood pressure results *(comes with age I'm afraid)*.

I managed to locate a pretty decent BP Excel spreadsheet template [(here)](https://templates.office.com/en-gb/blood-pressure-tracker-tm03986884), which I slightly altered to suite my own requirements.  Whilst spreadsheets are clearly an excellent tool for this sort of data capture, I found the data entry process slightly frustrating - especially on mobile.

I fully accept that Excel data entry, even on a mobile device is *significantly* better than it ever used to be, but nevertheless it still felt a little clumsy.

My immediate go-to was Microsoft Forms - I would use Power Automate to populate the aforementioned spreadsheet with results.  This way I could also add any additional auto date/time calculations etc to reduce further data entry on the mobile device.

It was here that I hit a rather frustrating block; to my annoyance it transpires that personal Office 365 accounts **do not** have a Power Automate connector for Microsoft Forms.  In short, if it's not a school or enterprise Office account, you cannot seemingly use Power Automate to populate an existing spreadsheet from a Microsoft Form.

Not wishing to be beaten, I started to think of alterative approaches.  It could be argued that in many ways the solution I came up with is even easier than completing a MS Form - if a little unconventional.

In short, I'm using the **Subject Line** of an email to technically "send" data to the spreadsheet and I must say, it works beautifully.

So here's the process.

1. I send myself an email using the following format in the subject title: **MBP/125/87/60/L** - this format equates to:
      * **MBP** (My Blood Pressure)**/**
      * **Systolic** (higher reading)**/**
      * **Diastolic** (lower reading)**/**
      * **Heart Rate/**
      * **Left or Right Arm**
2. PowerAutomate is set to trigger when it receives an email with the Subject Title starting **MPB**.
   
{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail1.png" />
{{< /rawhtml >}}

3. I create an "ARM" string variable *(for use later in recording which "arm" was used)* and I extract the Subject Title field from the email (using "Html to text").
   
{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail2.png" />
{{< /rawhtml >}}

4. PowerAutomate then splits the Subject Title into an array of values - each value separated by the forward slash "**/**" in the email Subject Title field.
   
{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail3.png" />
{{< /rawhtml >}}

5. These values are assigned to four individual compose functions by extracting each appropriate array position from the previous Split function.

{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail4.png" />
{{< /rawhtml >}}


6. I then create an appropriate localised calculation for the current time.
   
{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail5.png" />
{{< /rawhtml >}}

8. Next I create a switch statement to decide whether the ARM variable should be set to "left arm" or "right arm" - based on whether a letter "**L**" was used in the email Subject Title field.

{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail6.png" />
{{< /rawhtml >}}

9.  PowerAutomate then populates the BP spreadsheet template with the compose output values, ARM variable and associated date/time fields.

{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail7.png" />
{{< /rawhtml >}}

10.  PowerAutomate finally deletes the email.


{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/PAEMail8.png" />
{{< /rawhtml >}}

---

The result, is a fully populated spreadsheet from just sending a **one line** subject email.

.....it also get's around the current lack of support for MS Forms integration.

*Ideally, you would include some error trapping and/or Try Catches etc to ensure a more robust solution - but the basic principle works very well indeed.*

