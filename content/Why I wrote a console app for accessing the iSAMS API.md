---
layout: post
title: "Why I wrote a console app for accessing the iSAMS API"
date: 2020-10-17 23:44:05
type: post
tags:
  - iSAMS
  - MIS
  - C#
  - Database
  - SQL
---

Firstly, let me register that I **_much_** prefer writing raw SQL for iSAMS than using the official iSAMS REST API - there, I've said it!

In fairness this probably aligns with my IT experience, in that I tend to embrace the Swiss Army Knife approach of skills and experiences.

> For a start, the whole iSAMS token exchange process **before** you can even start to extract data is arguably a little tricky, especially for just a hobbyist developer.

_However_, I do entirely appreciate the necessity for an official API (e.g. security, consistency, potential database schema changes, futureproofing etc). As such, the need to embrace the iSAMS API is something I felt was a requirement.

## The Project - Data Extraction Tool

My thoughts were that it should be feasible to write a small C# Console Application that you could in pass arguments (be it via the CLI or using Task Scheduler) in order to return data. These arguments would be everything from the private keys through to the actual REST API Endpoint needed to extract information.

_In many ways, this could be viewed as a "proof of concept" - albeit a useful one!_

In short, it worked! I created a self contained executable (written on dotNet Core) which allows me to pass in all required parameters, which in turn returns a JSON file containing appropriate data. This data can then be used with another program (e.g. Excel, PowerBI) or even with PowerShell for further data analysis.

I've called the tool the "iSAMSDataExtract" tool and below are the fundamental instructions on how to use it.

Beneath the below instructions is you will also find:

- A link to my GitHub Repo where you can download the project.
- A direct link to a pre-compiled, ready to run executable _(it is safe, but you run this at your own risk)._
- The raw C# code I wrote, should you wish to copy and paste into your own project.

---

## How to Use iSAMSDataExtract

Copy the iSAMSData.exe into a location on your device (e.g. c:\temp) and open a command line from the same place.

You need to pass in 6 parameters (listed below). These parameters are separated by a space (see below example).

**Required Parameters**

- Token URL (e.g. YOURSCHOOL.isams.cloud/auth/connect/token)
- Client ID (e.g. Your iSAMS key)
- Client Secret (e.g. Your iSAMS secret)
- API Endpoint URL (e.g. YOURSCHOOL.isams.cloud/api/humanresources/employees)
- JSON Element (e.g. employees)
- Data Save Location (e.g. c:\temp\results.json)

---

**CLI Example**

### isamsdata.exe **YOURSCHOOL.isams.cloud/auth/connect/token** **YOURKEY** **YOURSECRET** **YOURSCHOOL.isams.cloud/api/humanresources/employees** **employees** **C:\temp\Data.json**

---

Results are a JSON format text file, which can be used for Power Automate, Excel, Power BI, PowerShell Scripts, Database Importing or even another self-written program. The advantage with a console app is that this can be very easily run via task scheduler (e.g. a nightly update of data etc)

{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/13102020CLI.jpg"/>
{{< /rawhtml >}}
<br/>

{{< rawhtml >}}
<img
src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
data-src="/img/postimg/13102020Screen.jpg"/>
{{< /rawhtml >}}

---

### <span style="color:red"> Please Note: Ensure you are fully aware of where your data is being downloaded to and make certain this is **always** secure and deleted when no longer required - and keep those API secrets private!</style>

---

## Links

[iSAMS Data Extract Tool](https://github.com/normansolutions/iSAMSDataExtractTool) - GitHub Repo

[Compiled Stand-Alone Executable](https://github.com/normansolutions/iSAMSDataExtractTool/raw/main/iSAMSData.exe) - Ready to roll standalone exe (it is safe, but you run this at your own risk).

---

## Code

```C#
using System;
using System.IO;
using System.Net.Http;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace iSAMSData
{

    class Program
    {
        //Variables
        private static readonly HttpClient client = new HttpClient();
        private static JObject _token;
        private static JArray _extractedData;
        private static string _tokenURL;
        private static string _clientID;
        private static string _clientSecret;
        private static string _apiEndpoint;
        private static string _elementName;
        private static string _saveLocation;

        static void Main(string[] args)
        {

            //Assign console parameters to variables and replace "/" & "\" with "//" & "\\" where appropriate
            _tokenURL = Regex.Replace(args[0], @"//", "////");
            _clientID = args[1];
            _clientSecret = args[2];
            _apiEndpoint = Regex.Replace(args[3], @"//", "////");
            _elementName = args[4];
            _saveLocation = Regex.Replace(args[5], @"\\", "\\\\");

            _extractedData = new JArray();

            _token = GetToken(_tokenURL, _clientID, _clientSecret).GetAwaiter().GetResult();

            var iSAMSDataTotalPages = GetData(1, _apiEndpoint).GetAwaiter().GetResult();

            JValue _totalPages = (JValue)iSAMSDataTotalPages["totalPages"];

            //Check if _totalPages exists - if not then set a default of 1
            if (_totalPages is null)
            {
                _totalPages = (JValue)1;
            }

            //Where paging is required loop through to build up results set then append together as a single entity
            for (int page = 1; page <= (int)_totalPages; page ++)
            {
                var iSAMSData = GetData(page, _apiEndpoint).GetAwaiter().GetResult();
                JArray SubElement = (JArray)iSAMSData[_elementName];
                _extractedData.Add(SubElement);

            }

            //Save final results to local file (e.g. data.json)
            string savedData = @"" + _saveLocation + "";
            using (StreamWriter file = File.CreateText(savedData))
            {
                JsonSerializer serializer = new JsonSerializer();
                serializer.Serialize(file, _extractedData);
            }
        }

        //Process for getting authorisation token which is sent with each subsequent request
        static async Task<JObject> GetToken(string _clientUrl = "youraddressfortoken", string _clientID = "yourclientid", string _clientSecret = "yourclientsecret")
        {

            var _tokenUrl = "https://" + _clientUrl;
            var _tokenSecretRaw = string.Format("client_id=" + _clientID + "&client_secret=" + _clientSecret + "&grant_type=client_credentials&scope=restapi");
            StringContent theContent = new StringContent(_tokenSecretRaw, System.Text.Encoding.UTF8, "application/x-www-form-urlencoded");
            HttpResponseMessage aResponse = await client.PostAsync(new Uri(_tokenUrl), theContent);
            aResponse.EnsureSuccessStatusCode();
            string content = await aResponse.Content.ReadAsStringAsync();

            return (JObject)await Task.Run(() => JObject.Parse(content));
        }

        //Process for getting data
        static async Task<JObject> GetData(int _page = 1, string urlApi = "yourchosenapiendpoint")
        {
                JObject Token = _token; //Use cached Token
                var _extractedToken = Token["access_token"].ToString();
                var _baseUrl = "https://" + urlApi + "?page=" + _page;
                client.DefaultRequestHeaders.Clear();
                client.DefaultRequestHeaders.Add("Authorization", "Bearer " + _extractedToken);
                var response = await client.GetStringAsync(_baseUrl);

            return (JObject)await Task.Run(() => JObject.Parse(response));
        }

    }

}
```
