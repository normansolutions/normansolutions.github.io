---
layout: post
title: "Using Power Automate with the iSAMS API"
date: 2021-02-19 08:49:20
type: post
tags:
  - Power Automate
  - iSAMS
  - MIS
---


I've recently being getting deeper into the weeds *(so to speak)* with Power Automate.  Whilst this product clearly isn't a fully fledged programming model, it does sit very nicely in that "low code" methodology, and can be extremely  effective when there is a need to quickly create and perform a specific task.

My aim was to connect Power Automate to the iSAMS API with a view to:

1. Extract data *(from multiple API end points)*.
2. Create *(and populate with iSAMS data)* a document in a SharePoint library.
3. Apply appropriate security permissions to each document.
4. Update a spreadsheet with an audit of applied permissions.

The primary purpose of this exercise is that to the best of my knowledge, there isn't a clear method of allowing staff to check their own details in iSAMS without having access to the HR module.  This process would enable staff to view their details from a secure SharePoint library, enabling them to clarify whether any amendments were required.

>Below is a video overview / walkthrough  of how I approached this Power Automate.  **What it isn't** is a granular, blow by blow description of every function and process involved, as that would potentially be a very long and arguably boring video!

Several lessons were learnt along this journey, such as how to implement a Try/Catch approach in Power Automate, being aware of the need to reset variables and arrays in addition to understanding some of the inbuilt restrictions of Power Automate looping etc.

I've also posted some of useful links below the video that further explain how some of the more specific aspects can be achieved.

{{< youtube nmhC_PZD644 >}}
<br/>

### Useful Links

- [iSAMS API Swagger Documentation ](https://developerdemo.isams.cloud/Main/swagger/ui/index)
- [Implementing Try/Catch in Power Automate](https://powerofpowerplatform.com/implementing-trycatch-and-finally-in-power-automate/)
- [Generate Word Documents from a Template in Power Automate](https://tahoeninjas.blog/2020/03/13/generate-word-documents-from-a-template-using-power-automate/)
- [Managing SharePoint file permissions in Power Automate](https://docs.microsoft.com/en-us/sharepoint/dev/business-apps/power-automate/guidance/manage-list-item-file-permissions)
