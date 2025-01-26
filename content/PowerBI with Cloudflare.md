---
layout: post
title: "PowerBI with Cloudflare"
date: 2025-01-25 13:40:20
type: post
tags:
  - PowerBI
  - Cloudflare
  - Data
---

# Using Power BI to Visualise Cloudflare Data: A Simple Guide  

Recently, I’ve been working with Power BI to build dashboards. One particular requirement involved pulling in data from Cloudflare to display statistics on blocked traffic.  

## Getting Started with the Cloudflare API  
Cloudflare’s API is well-documented, so I won’t delve into that here. If you need guidance on creating a Cloudflare API token with the necessary permissions, I recommend checking this helpful resource: [Cloudflare API: Create a Token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/).  

---

## Initial Approach: PowerShell  
Initially, I considered using PowerShell to handle this task. The idea was to create a script that would run in an Azure Runbook, extract the required data from Cloudflare, and save it in JSON format to a SharePoint site.  

This approach seemed logical until someone asked a simple yet insightful question:

*“Can’t this be done directly in Power BI using GraphQL?”*  

---

## Rethink: Power Query (M Language)  
The truth is, this process can be entirely handled within Power BI, eliminating the need for Runbooks or SharePoint storage.  

While I’ll admit that my knowledge of Power Query’s M Language is fairly basic, I found that with a bit of help from Copilot, I was able to create a script that worked perfectly. This allowed the Power BI dashboard to display the necessary Cloudflare data without any intermediate steps.  

---


When working with the Cloudflare API, it’s important to understand some limitations. For instance, the API restricts how much data can be returned in a single call. If you’re dealing with larger datasets (e.g., more than 1,000 rows), you’ll need to implement a paging mechanism.  

In this case, I sorted the API results by date and retrieved data in batches. Each subsequent API call used a date range starting where the previous one ended. This ensured I could handle larger volumes of data efficiently.  

---


### Script Overview

#### Function Definition
`getFirewallEvents` fetches firewall events for a specific zone using a GraphQL query. It supports pagination to handle large datasets.

#### GraphQL Query
Defines the structure and filters for retrieving firewall events, including fields such as `action`, `datetime`, and `clientIP`.

#### Time Filtering
The script calculates the current time and a time 3 hours ago to filter events within this range.

#### API Interaction
Makes authenticated API calls using the `Web.Contents` function and parses JSON responses.

#### Pagination
Uses recursive logic to fetch all event pages when there are more than 1,000 results.

#### Data Transformation
Converts the fetched events into a Power Query table, adds metadata (e.g., zone name), and formats the `datetime` column.

#### Zone Processing
Fetches a list of zones from the API and applies the `getFirewallEvents` function to each zone.

#### Combine Results
Combines all zone-specific event tables into a single output table for analysis.

---

### Notes
- Replace `APIKEY` with your actual Cloudflare API key.
- Adjust the time range or filters as required for your use case.

``` m

let
    // Function to get firewall events for a specific zone with pagination
    getFirewallEvents = (zoneTag as text, zoneName as text) =>
    let
        // Define the GraphQL query to fetch firewall events
        query = "query ListFirewallEvents($zoneTag: String, $filter: FirewallEventsAdaptiveFilter_InputObject) {
                    viewer {
                        zones(filter: { zoneTag: $zoneTag }) {
                            firewallEventsAdaptive(
                                filter: $filter
                                limit: 1000
                                orderBy: [datetime_ASC]
                            ) {                            
                                action
                                clientAsn
                                clientCountryName
                                clientIP
                                clientRequestPath
                                clientRequestQuery
                                datetime
                                source
                                userAgent
                            }
                        }
                    }
                }",

        // Define the time range: current time and 3 hours ago in UTC
        endDate = DateTime.ToText(DateTimeZone.RemoveZone(DateTimeZone.UtcNow()), "yyyy-MM-ddTHH:mm:ss") & "Z",
        startDate = DateTime.ToText(DateTimeZone.RemoveZone(DateTimeZone.UtcNow() - #duration(0, 3, 0, 0)), "yyyy-MM-ddTHH:mm:ss") & "Z",

        // Define the action filter
        actionStatus = "block",

        // API endpoint and headers for authentication
        url = "https://api.cloudflare.com/client/v4/graphql",
        headers = [
            #"Content-Type" = "application/json", 
            Authorization = "Bearer APIKEY"
        ],

        // Function to fetch a single page of firewall events
        fetchPage = (lastDatetime) =>
        let
            // Define the filter for the query
            filter = if lastDatetime = null then [
                datetime_geq = startDate,
                datetime_leq = endDate,
                action_like = actionStatus
            ] else [
                datetime_geq = lastDatetime,
                datetime_leq = endDate,
                action_like = actionStatus
            ],

            // Build the request body
            body = Json.FromValue([
                query = query,
                variables = [
                    zoneTag = zoneTag,
                    filter = filter
                ]
            ]),

            // Execute the API call and parse the JSON response
            response = Web.Contents(url, [Headers = headers, Content = body]),
            jsonResponse = Json.Document(response),

            // Extract the events from the response
            events = try jsonResponse[data][viewer][zones]{0}[firewallEventsAdaptive] otherwise null
        in
            events,

        // Recursive function to fetch all pages of firewall events
        fetchAllPages = (lastDatetime) =>
        let
            currentPage = fetchPage(lastDatetime),
            nextDatetime = if currentPage <> null and List.Count(currentPage) > 0 then currentPage{List.Count(currentPage) - 1}[datetime] else null,
            combinedPages = if nextDatetime <> null and List.Count(currentPage) = 1000 then List.Combine({currentPage, @fetchAllPages(nextDatetime)}) else currentPage
        in
            combinedPages,

        // Fetch all firewall events for the zone
        allEvents = fetchAllPages(null),

        // Convert the events into a table or create an empty table if no events are found
        firewallEventsTable = if allEvents <> null then Table.FromRecords(allEvents) else #table(
            {"action", "clientAsn", "clientCountryName", "clientIP", "clientRequestPath", "clientRequestQuery", "datetime", "source", "userAgent"},
            {}
        ),

        // Add the zone name to the table
        firewallEventsWithZone = Table.AddColumn(firewallEventsTable, "ZoneName", each zoneName),

        // Convert the datetime column to proper datetime format
        firewallEventsWithProperDatetime = if Table.HasColumns(firewallEventsWithZone, "datetime") then
            Table.TransformColumns(firewallEventsWithZone, {"datetime", each if _ <> null and _ <> "" then DateTime.FromText(_) else _})
        else
            firewallEventsWithZone,

        // Extract the first datetime and format it in UK format
        firstDate = if Table.RowCount(firewallEventsWithProperDatetime) > 0 then firewallEventsWithProperDatetime{0}[datetime] else null,
        formattedFirstDate = if firstDate <> null then DateTime.ToText(firstDate, "dd/MM/yyyy HH:mm:ss") else null,

        // Add the formatted date as a new column
        firewallEventsWithFormattedDate = Table.AddColumn(firewallEventsWithProperDatetime, "FormattedFirstDate", each formattedFirstDate)
    in
        firewallEventsWithFormattedDate,

    // Fetch the list of zones from the API
    zones = Json.Document(
        Web.Contents(
            "https://api.cloudflare.com/client/v4/zones", 
            [
                Headers = [
                    #"Content-Type" = "application/json", 
                    Authorization = "Bearer APIKEY"
                ]
            ]
        )
    ),

    // Extract the result from the zones response
    result = zones[result],
    processedResults = List.Transform(result, each [id = _[id], name = _[name]]),

    // Apply the custom function to each zone and combine the results into a single table
    transformedRecords = List.Transform(processedResults, each getFirewallEvents(_[id], _[name])),
    combinedTable = Table.Combine(transformedRecords)
in
    combinedTable



```

## Conclusion  
By leveraging Power Query in Power BI, I was able to simplify the entire process of fetching and displaying Cloudflare data. There was no need for PowerShell, Runbooks, or external storage solutions.  

This approach not only saved time but also kept the workflow streamlined, allowing the dashboard to dynamically fetch the required data. If you’re looking to integrate Cloudflare data into Power BI, this method is both practical and effective.  

---

**Pro Tip**: If you’re new to Power Query or need to work with APIs, don’t hesitate to rely on tools like Copilot or community resources—they can be invaluable for getting started quickly!


---