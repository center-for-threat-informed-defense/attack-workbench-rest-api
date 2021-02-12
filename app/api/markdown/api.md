---
title: ATT&CK Workbench REST API v0.0.1
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
highlight_theme: darkula
headingLevel: 2

---

<!-- Generator: Widdershins v4.0.1 -->

<h1 id="att-and-ck-workbench-rest-api">ATT&CK Workbench REST API v0.0.1</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Base URLs:

* <a href="{protocol}://{hostname}:{port}/">{protocol}://{hostname}:{port}/</a>

    * **protocol** -  Default: http

    * **hostname** -  Default: localhost

    * **port** -  Default: 3000

<h1 id="att-and-ck-workbench-rest-api-techniques">Techniques</h1>

Operations on techniques.

## Get a list of techniques

<a id="opIdtechnique-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/techniques \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/techniques HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/techniques',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/techniques',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/techniques', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/techniques', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/techniques");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/techniques", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/techniques`

This endpoint retrieves a list of techniques from the workspace.
If there are multiple versions of a technique, only the latest version (based on the `modified` property) will be returned.
In addition, the `state`, `includeRevoked`, and `includeDeprecated` filters are only applied to the latest version of a technique.

<h3 id="get-a-list-of-techniques-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of techniques to retrieve.|
|offset|query|number|false|The number of techniques to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of techniques to retrieve.
The default (0) will retrieve all techniques.

**offset**: The number of techniques to skip.
The default (0) will start with the first technique.

**state**: State of the object in the editing workflow.
If this parameter is not set, techniques will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-techniques-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of techniques.|Inline|

<h3 id="get-a-list-of-techniques-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a technique

<a id="opIdtechnique-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/techniques \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/techniques HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/techniques',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/techniques',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/techniques', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/techniques', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/techniques");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/techniques", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/techniques`

This endpoint creates a new technique in the workspace.
If the `stix.id` property is set, it creates a new version of an existing technique.
If the `stix.id` property is not set, it creates a new technique, generating a STIX id for it.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The technique has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The technique was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The technique was not created.|None|

<h3 id="create-a-technique-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a technique

<a id="opIdtechnique-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/techniques/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/techniques/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/techniques/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/techniques/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/techniques/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/techniques/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/techniques/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/techniques/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/techniques/{stixId}`

This endpoint gets a list of one or more versions of a technique from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-technique-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the technique to retrieve|
|versions|query|string|false|The versions of the technique to retrieve.|

#### Detailed descriptions

**versions**: The versions of the technique to retrieve.
`all` gets all versions of the technique, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of techniques matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A technique with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-technique-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a technique matching the STIX id and modified date

<a id="opIdtechnique-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/techniques/{stixId}/modified/{modified}`

This endpoint gets a single version of a technique from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-technique-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the technique to retrieve|
|modified|path|string|true|modified date of the technique to retrieve|

> Example responses

<h3 id="gets-the-version-of-a-technique-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a technique matching the STIX id and modified date.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A technique with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-technique-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Update a technique

<a id="opIdtechnique-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/techniques/{stixId}/modified/{modified}`

This endpoint updates a single version of a technique in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
false
```

<h3 id="update-a-technique-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the technique to update|
|modified|path|string|true|modified date of the technique to update|

> Example responses

<h3 id="update-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The technique was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The technique was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A technique with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-technique-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a technique

<a id="opIdtechnique-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/techniques/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/techniques/{stixId}/modified/{modified}`

This endpoint deletes a single version of a technique from the workspace.
The technique is identified by its STIX id and modified date.

<h3 id="delete-a-technique-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the technique to delete|
|modified|path|string|true|modified date of the technique to delete|

<h3 id="delete-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The technique was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A technique with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-tactics">Tactics</h1>

Operations on tactics.

## Get a list of tactics

<a id="opIdtactic-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/tactics \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/tactics HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/tactics',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/tactics',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/tactics', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/tactics', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/tactics");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/tactics", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/tactics`

This endpoint gets a list of tactics from the workspace.
The list of tactics may include multiple versions of each tactic.

<h3 id="get-a-list-of-tactics-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of tactics to retrieve.|
|offset|query|number|false|The number of tactics to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of tactics to retrieve.
The default (0) will retrieve all tactics.

**offset**: The number of tactics to skip.
The default (0) will start with the first tactic.

**state**: State of the object in the editing workflow.
If this parameter is not set, tactics will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-tactics-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of tactics.|Inline|

<h3 id="get-a-list-of-tactics-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a tactic

<a id="opIdtactic-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/tactics \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/tactics HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/tactics',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/tactics',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/tactics', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/tactics', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/tactics");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/tactics", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/tactics`

This endpoint creates a new tactic in the workspace.
If the `stix.id` property is set, it creates a new version of an existing tactic.
If the `stix.id` property is not set, it creates a new tactic, generating a STIX id for it.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-tactic-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The tactic has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The tactic was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The tactic was not created.|None|

<h3 id="create-a-tactic-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a tactic

<a id="opIdtactic-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/tactics/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/tactics/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/tactics/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/tactics/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/tactics/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/tactics/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/tactics/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/tactics/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/tactics/{stixId}`

This endpoint gets a list of one or more versions of a tactic from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-tactic-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the tactic to retrieve|
|versions|query|string|false|The versions of the tactic to retrieve.|

#### Detailed descriptions

**versions**: The versions of the tactic to retrieve.
`all` gets all versions of the tactic, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-tactic-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of tactics matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A tactic with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-tactic-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a tactic matching the STIX id and modified date

<a id="opIdtactic-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/tactics/{stixId}/modified/{modified}`

This endpoint gets a single version of a tactic from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-tactic-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the tactic to retrieve|
|modified|path|string|true|modified date of the tactic to retrieve|

> Example responses

<h3 id="gets-the-version-of-a-tactic-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a tactic matching the STIX id and modified date.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A tactic with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-tactic-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Update a tactic

<a id="opIdtactic-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/tactics/{stixId}/modified/{modified}`

This endpoint updates a single version of a tactic in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
false
```

<h3 id="update-a-tactic-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the tactic to update|
|modified|path|string|true|modified date of the tactic to update|

> Example responses

<h3 id="update-a-tactic-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The tactic was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The tactic was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A tactic with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-tactic-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a tactic

<a id="opIdtactic-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/tactics/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/tactics/{stixId}/modified/{modified}`

This endpoint deletes a single version of a tactic from the workspace.
The tactic is identified by its STIX id and modified date.

<h3 id="delete-a-tactic-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the tactic to delete|
|modified|path|string|true|modified date of the tactic to delete|

<h3 id="delete-a-tactic-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The tactic was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A tactic with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-groups">Groups</h1>

Operations on groups.

## Get a list of groups

<a id="opIdgroup-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/groups \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/groups HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/groups',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/groups',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/groups', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/groups', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/groups");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/groups", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/groups`

This endpoint gets a list of groups from the workspace.
The list of groups may include multiple versions of each group.

<h3 id="get-a-list-of-groups-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of groups to retrieve.|
|offset|query|number|false|The number of groups to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of groups to retrieve.
The default (0) will retrieve all groups.

**offset**: The number of groups to skip.
The default (0) will start with the first group.

**state**: State of the object in the editing workflow.
If this parameter is not set, groups will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-groups-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of groups.|Inline|

<h3 id="get-a-list-of-groups-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a group

<a id="opIdgroup-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/groups \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/groups HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/groups',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/groups',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/groups', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/groups', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/groups");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/groups", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/groups`

This endpoint creates a new group in the workspace.
If the `stix.id` property is set, it creates a new version of an existing group.
If the `stix.id` property is not set, it creates a new group, generating a STIX id for it.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The group has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The group was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The group was not created.|None|

<h3 id="create-a-group-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a group

<a id="opIdgroup-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/groups/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/groups/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/groups/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/groups/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/groups/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/groups/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/groups/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/groups/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/groups/{stixId}`

This endpoint gets a list of one or more versions of a group from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the group to retrieve|
|versions|query|string|false|The versions of the group to retrieve.|

#### Detailed descriptions

**versions**: The versions of the group to retrieve.
`all` gets all versions of the group, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of groups matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A group with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a group matching the STIX id and modified date

<a id="opIdgroup-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/groups/{stixId}/modified/{modified}`

This endpoint gets a single version of a group from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-group-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the group to retrieve|
|modified|path|string|true|modified date of the group to retrieve|

> Example responses

<h3 id="gets-the-version-of-a-group-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a group matching the STIX id and modified date.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A group with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-group-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Update a group

<a id="opIdgroup-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/groups/{stixId}/modified/{modified}`

This endpoint updates a single version of a group in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
false
```

<h3 id="update-a-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the group to update|
|modified|path|string|true|modified date of the group to update|

> Example responses

<h3 id="update-a-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The group was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The group was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A group with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-group-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a group

<a id="opIdgroup-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/groups/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/groups/{stixId}/modified/{modified}`

This endpoint deletes a single version of a group from the workspace.
The group is identified by its STIX id and modified date.

<h3 id="delete-a-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the group to delete|
|modified|path|string|true|modified date of the group to delete|

<h3 id="delete-a-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The group was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A group with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-software">Software</h1>

Operations on software (tools and malware)

## Get a list of software objects

<a id="opIdgroup-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/software \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/software HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/software',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/software',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/software', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/software', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/software");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/software", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/software`

This endpoint gets a list of software objects from the workspace.
The list of software objects may include multiple versions of each object.

<h3 id="get-a-list-of-software-objects-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of software objects to retrieve.|
|offset|query|number|false|The number of software objects to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of software objects to retrieve.
The default (0) will retrieve all software objects.

**offset**: The number of software objects to skip.
The default (0) will start with the first software object.

**state**: State of the object in the editing workflow.
If this parameter is not set, software objects will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-software-objects-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of software objects.|Inline|

<h3 id="get-a-list-of-software-objects-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a software object

<a id="opIdsoftware-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/software \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/software HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/software',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/software',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/software', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/software', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/software");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/software", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/software`

This endpoint creates a new software object in the workspace.
If the `stix.id` property is set, it creates a new version of an existing software object.
If the `stix.id` property is not set, it creates a new software object, generating a STIX id for it.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-software-object-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The software object has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The software object was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The software object was not created.|None|

<h3 id="create-a-software-object-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a software object

<a id="opIdsoftware-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/software/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/software/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/software/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/software/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/software/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/software/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/software/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/software/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/software/{stixId}`

This endpoint gets a list of one or more versions of a software object from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-software-object-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the software object to retrieve|
|versions|query|string|false|The versions of the software object to retrieve.|

#### Detailed descriptions

**versions**: The versions of the software object to retrieve.
`all` gets all versions of the software, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-software-object-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of software objects matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A software object with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-software-object-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a software object matching the STIX id and modified date

<a id="opIdsoftware-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/software/{stixId}/modified/{modified}`

This endpoint gets a single version of a software object from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-software-object-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the software object to retrieve|
|modified|path|string|true|modified date of the software object to retrieve|

> Example responses

<h3 id="gets-the-version-of-a-software-object-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a software object matching the STIX id and modified date.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A software object with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-software-object-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Update a software object

<a id="opIdsoftware-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/software/{stixId}/modified/{modified}`

This endpoint updates a single version of a software object in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
false
```

<h3 id="update-a-software-object-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the software object to update|
|modified|path|string|true|modified date of the software object to update|

> Example responses

<h3 id="update-a-software-object-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The software object was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The software object was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A software object with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-software-object-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a software object

<a id="opIdsoftware-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/software/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/software/{stixId}/modified/{modified}`

This endpoint deletes a single version of a software object from the workspace.
The software object is identified by its STIX id and modified date.

<h3 id="delete-a-software-object-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the software object to delete|
|modified|path|string|true|modified date of the software object to delete|

<h3 id="delete-a-software-object-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The software object was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A software object with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-mitigations">Mitigations</h1>

Operations on mitigations

## Get a list of mitigations

<a id="opIdmitigation-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/mitigations \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/mitigations HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/mitigations',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/mitigations',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/mitigations', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/mitigations', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/mitigations");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/mitigations", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/mitigations`

This endpoint gets a list of mitigations from the workspace.
The list of mitigations may include multiple versions of each mitigation.

<h3 id="get-a-list-of-mitigations-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of mitigations to retrieve.|
|offset|query|number|false|The number of mitigations to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of mitigations to retrieve.
The default (0) will retrieve all mitigations.

**offset**: The number of mitigations to skip.
The default (0) will start with the first mitigation.

**state**: State of the object in the editing workflow.
If this parameter is not set, mitigations will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-mitigations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of mitigations.|Inline|

<h3 id="get-a-list-of-mitigations-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a mitigation

<a id="opIdmitigation-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/mitigations \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/mitigations HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/mitigations',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/mitigations',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/mitigations', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/mitigations', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/mitigations");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/mitigations", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/mitigations`

This endpoint creates a new mitigation in the workspace.
If the `stix.id` property is set, it creates a new version of an existing mitigation.
If the `stix.id` property is not set, it creates a new mitigation, generating a STIX id for it.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-mitigation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The mitigation has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The mitigation was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The mitigation was not created.|None|

<h3 id="create-a-mitigation-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a mitigation

<a id="opIdmitigation-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/mitigations/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/mitigations/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/mitigations/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/mitigations/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/mitigations/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/mitigations/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/mitigations/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/mitigations/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/mitigations/{stixId}`

This endpoint gets a list of one or more versions of a mitigation from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-mitigation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the mitigation to retrieve|
|versions|query|string|false|The versions of the mitigation to retrieve.|

#### Detailed descriptions

**versions**: The versions of the mitigation to retrieve.
`all` gets all versions of the mitigation, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-mitigation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of mitigations matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A mitigation with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-mitigation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a mitigation matching the STIX id and modified date

<a id="opIdmitigation-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/mitigations/{stixId}/modified/{modified}`

This endpoint gets a single version of a mitigation from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-mitigation-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the mitigation to retrieve|
|modified|path|string|true|modified date of the mitigation to retrieve|

> Example responses

<h3 id="gets-the-version-of-a-mitigation-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a mitigation matching the STIX id and modified date.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A mitigation with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-mitigation-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Update a mitigation

<a id="opIdmitigation-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/mitigations/{stixId}/modified/{modified}`

This endpoint updates a single version of a mitigation in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
false
```

<h3 id="update-a-mitigation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the mitigation to update|
|modified|path|string|true|modified date of the mitigation to update|

> Example responses

<h3 id="update-a-mitigation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The mitigation was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The mitigation was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A mitigation with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-mitigation-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a mitigation

<a id="opIdmitigation-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/mitigations/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/mitigations/{stixId}/modified/{modified}`

This endpoint deletes a single version of a mitigation from the workspace.
The mitigation is identified by its STIX id and modified date.

<h3 id="delete-a-mitigation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the mitigation to delete|
|modified|path|string|true|modified date of the mitigation to delete|

<h3 id="delete-a-mitigation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The mitigation was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A mitigation with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-matrices">Matrices</h1>

Operations on matrices.

## Get a list of matrices

<a id="opIdmatrix-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/matrices \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/matrices HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/matrices',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/matrices',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/matrices', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/matrices', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/matrices");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/matrices", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/matrices`

This endpoint retrieves a list of matrices from the workspace.
If there are multiple versions of a matrix, only the latest version (based on the `modified` property) will be returned.
In addition, the `state`, `includeRevoked`, and `includeDeprecated` filters are only applied to the latest version of a matrix.

<h3 id="get-a-list-of-matrices-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of matrices to retrieve.|
|offset|query|number|false|The number of matrices to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of matrices to retrieve.
The default (0) will retrieve all matrices.

**offset**: The number of matrices to skip.
The default (0) will start with the first matrix.

**state**: State of the object in the editing workflow.
If this parameter is not set, matrices will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-matrices-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of matrices.|Inline|

<h3 id="get-a-list-of-matrices-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a matrix

<a id="opIdmatrix-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/matrices \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/matrices HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/matrices',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/matrices',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/matrices', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/matrices', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/matrices");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/matrices", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/matrices`

This endpoint creates a new matrix in the workspace.
If the `stix.id` property is set, it creates a new version of an existing matrix.
If the `stix.id` property is not set, it creates a new matrix, generating a STIX id for it.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-matrix-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The matrix has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The matrix was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The matrix was not created.|None|

<h3 id="create-a-matrix-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a matrix

<a id="opIdmatrix-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/matrices/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/matrices/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/matrices/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/matrices/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/matrices/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/matrices/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/matrices/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/matrices/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/matrices/{stixId}`

This endpoint gets a list of one or more versions of a matrix from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-matrix-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the matrix to retrieve|
|versions|query|string|false|The versions of the matrix to retrieve.|

#### Detailed descriptions

**versions**: The versions of the matrix to retrieve.
`all` gets all versions of the matrix, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-matrix-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of matrices matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A matrix with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-matrix-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a matrix matching the STIX id and modified date

<a id="opIdmatrix-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/matrices/{stixId}/modified/{modified}`

This endpoint gets a single version of a matrix from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-matrix-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the matrix to retrieve|
|modified|path|string|true|modified date of the matrix to retrieve|

> Example responses

<h3 id="gets-the-version-of-a-matrix-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a matrix matching the STIX id and modified date.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A matrix with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-matrix-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Update a matrix

<a id="opIdmatrix-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/matrices/{stixId}/modified/{modified}`

This endpoint updates a single version of a matrix in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
false
```

<h3 id="update-a-matrix-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the matrix to update|
|modified|path|string|true|modified date of the matrix to update|

> Example responses

<h3 id="update-a-matrix-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The matrix was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The matrix was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A matrix with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-matrix-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a matrix

<a id="opIdmatrix-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/matrices/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/matrices/{stixId}/modified/{modified}`

This endpoint deletes a single version of a matrix from the workspace.
The matrix is identified by its STIX id and modified date.

<h3 id="delete-a-matrix-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the matrix to delete|
|modified|path|string|true|modified date of the matrix to delete|

<h3 id="delete-a-matrix-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The matrix was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A matrix with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-relationships">Relationships</h1>

Operations on relationships.

## Get a list of relationships

<a id="opIdrelationship-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/relationships \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/relationships HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/relationships',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/relationships',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/relationships', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/relationships', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/relationships");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/relationships", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/relationships`

This endpoint retrieves a list of relationships from the workspace.
If there are multiple versions of a relationship, only the latest version (based on the `modified` property) will be returned.
In addition, the `state`, `includeRevoked`, and `includeDeprecated` filters are only applied to the latest version of a relationship.

<h3 id="get-a-list-of-relationships-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of relationships to retrieve.|
|offset|query|number|false|The number of relationships to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|sourceRef|query|string|false|STIX id of referenced object. Only retrieve relationships that reference this object in the `source_ref` property.|
|targetRef|query|string|false|STIX id of referenced object. Only retrieve relationships that reference this object in the `target_ref` property.|
|sourceOrTargetRef|query|string|false|STIX id of referenced object.|
|relationshipType|query|string|false|Only retrieve relationships that have a matching `relationship_type`.|
|sourceType|query|string|false|Only retrieve relationships that have a `source_ref` to an object of the selected type.|
|targetType|query|string|false|Only retrieve relationships that have a `target_ref` to an object of the selected type.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of relationships to retrieve.
The default (0) will retrieve all relationships.

**offset**: The number of relationships to skip.
The default (0) will start with the first relationship.

**state**: State of the object in the editing workflow.
If this parameter is not set, relationships will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**sourceRef**: STIX id of referenced object. Only retrieve relationships that reference this object in the `source_ref` property.

**targetRef**: STIX id of referenced object. Only retrieve relationships that reference this object in the `target_ref` property.

**sourceOrTargetRef**: STIX id of referenced object.
Only retrieve relationships that reference this object in either the `source_ref` or `target_ref` properties.

**relationshipType**: Only retrieve relationships that have a matching `relationship_type`.

**sourceType**: Only retrieve relationships that have a `source_ref` to an object of the selected type.

**targetType**: Only retrieve relationships that have a `target_ref` to an object of the selected type.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

#### Enumerated Values

|Parameter|Value|
|---|---|
|sourceType|technique|
|sourceType|group|
|sourceType|mitigation|
|sourceType|software|
|targetType|technique|
|targetType|group|
|targetType|mitigation|
|targetType|software|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-relationships-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of relationships.|Inline|

<h3 id="get-a-list-of-relationships-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a relationship

<a id="opIdrelationship-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/relationships \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/relationships HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/relationships',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/relationships',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/relationships', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/relationships', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/relationships");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/relationships", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/relationships`

This endpoint creates a new relationship in the workspace.
If the `stix.id` property is set, it creates a new version of an existing relationship.
If the `stix.id` property is not set, it creates a new relationship, generating a STIX id for it.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-relationship-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The relationship has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The relationship was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The relationship was not created.|None|

<h3 id="create-a-relationship-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a relationship

<a id="opIdrelationship-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/relationships/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/relationships/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/relationships/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/relationships/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/relationships/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/relationships/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/relationships/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/relationships/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/relationships/{stixId}`

This endpoint gets a list of one or more versions of a relationship from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-relationship-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the relationship to retrieve|
|versions|query|string|false|The versions of the relationship to retrieve.|

#### Detailed descriptions

**versions**: The versions of the relationship to retrieve.
`all` gets all versions of the relationship, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-relationship-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of relationships matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A relationship with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-relationship-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a relationship matching the STIX id and modified date

<a id="opIdrelationship-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/relationships/{stixId}/modified/{modified}`

This endpoint gets a single version of a relationship from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-relationship-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the relationship to retrieve|
|modified|path|string|true|modified date of the relationship to retrieve|

> Example responses

<h3 id="gets-the-version-of-a-relationship-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a relationship matching the STIX id and modified date.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A relationship with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-relationship-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Update a relationship

<a id="opIdrelationship-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/relationships/{stixId}/modified/{modified}`

This endpoint updates a single version of a relationship in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
false
```

<h3 id="update-a-relationship-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the relationship to update|
|modified|path|string|true|modified date of the relationship to update|

> Example responses

<h3 id="update-a-relationship-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The relationship was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The relationship was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A relationship with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-relationship-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a relationship

<a id="opIdrelationship-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/relationships/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/relationships/{stixId}/modified/{modified}`

This endpoint deletes a single version of a relationship from the workspace.
The relationship is identified by its STIX id and modified date.

<h3 id="delete-a-relationship-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the relationship to delete|
|modified|path|string|true|modified date of the relationship to delete|

<h3 id="delete-a-relationship-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The relationship was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A relationship with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-collection-indexes">Collection Indexes</h1>

Operations on collection indexes

## Get a list of collection indexes

<a id="opIdcollection-indexes-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/collection-indexes \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/collection-indexes HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collection-indexes',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/collection-indexes',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/collection-indexes', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/collection-indexes', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collection-indexes");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/collection-indexes", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/collection-indexes`

This endpoint gets a list of collection indexes from the workspace.
Only the latest version of a collection index is stored.

<h3 id="get-a-list-of-collection-indexes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of collection indexes to retrieve.|
|offset|query|number|false|The number of collection indexes to skip.|

#### Detailed descriptions

**limit**: The number of collection indexes to retrieve.
The default (0) will retrieve all collection indexes.

**offset**: The number of collection indexes to skip.

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-collection-indexes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of collection indexes.|Inline|

<h3 id="get-a-list-of-collection-indexes-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a collection index

<a id="opIdcollection-index-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/collection-indexes \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/collection-indexes HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collection-indexes',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/collection-indexes',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/collection-indexes', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/collection-indexes', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collection-indexes");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/collection-indexes", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/collection-indexes`

This endpoint creates a new collection index in the workspace.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-collection-index-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The collection index has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The collection index was not created.|None|

<h3 id="create-a-collection-index-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get collection index

<a id="opIdcollection-index-get-by-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/collection-indexes/{id} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/collection-indexes/{id} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collection-indexes/{id}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/collection-indexes/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/collection-indexes/{id}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/collection-indexes/{id}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collection-indexes/{id}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/collection-indexes/{id}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/collection-indexes/{id}`

This endpoint gets collection index from the workspace, identified by its id.

<h3 id="get-collection-index-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|id of the collection index to retrieve|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-collection-index-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of collection indexes matching the requested id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A collection index with the requested id was not found.|None|

<h3 id="get-collection-index-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a collection index

<a id="opIdcollection-index-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/collection-indexes/{id} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/collection-indexes/{id} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collection-indexes/{id}',
{
  method: 'PUT',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.put '{protocol}://{hostname}:{port}/api/collection-indexes/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.put('{protocol}://{hostname}:{port}/api/collection-indexes/{id}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/collection-indexes/{id}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collection-indexes/{id}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("PUT");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/collection-indexes/{id}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/collection-indexes/{id}`

This endpoint updates a single collection index in the workspace, identified by its id.

> Body parameter

```json
false
```

<h3 id="update-a-collection-index-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|id of the collection index to update|

> Example responses

<h3 id="update-a-collection-index-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The collection index was updated.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The collection index was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A collection index with the requested id was not found.|None|

<h3 id="update-a-collection-index-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Delete a collection index

<a id="opIdcollection-index-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/collection-indexes/{id}

```

```http
DELETE {protocol}://{hostname}:{port}/api/collection-indexes/{id} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/collection-indexes/{id}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/collection-indexes/{id}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/collection-indexes/{id}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/collection-indexes/{id}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collection-indexes/{id}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/collection-indexes/{id}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/collection-indexes/{id}`

This endpoint deletes a single collection index from the workspace.
The collection index is identified by its id.

<h3 id="delete-a-collection-index-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|id of the collection index to delete|

<h3 id="delete-a-collection-index-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The collection index was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A collection index with the requested id was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-collections">Collections</h1>

Operations on collections

## Get a list of collections

<a id="opIdcollection-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/collections \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/collections HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collections',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/collections',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/collections', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/collections', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collections");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/collections", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/collections`

This endpoint retrieves a list of collections (x-mitre-collections) from the workspace.
If there are multiple versions of a collection, only the latest version (based on the `modified` property) will be returned.
In addition, the `state`, `includeRevoked`, and `includeDeprecated` filters are only applied to the latest version of a collection.

<h3 id="get-a-list-of-collections-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of collections to retrieve.|
|offset|query|number|false|The number of collections to skip.|
|versions|query|string|false|The versions of the collections to retrieve.|
|state|query|string|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|

#### Detailed descriptions

**limit**: The number of collections to retrieve.
The default (0) will retrieve all collections.

**offset**: The number of collections to skip.
The default (0) will start with the first collection.

**versions**: The versions of the collections to retrieve.
`all` gets all versions of all the collections, `latest` gets only the latest version of each collection.

**state**: State of the object in the editing workflow.
If this parameter is not set, collections will be retrieved with any state.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-a-list-of-collections-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of collections.|Inline|

<h3 id="get-a-list-of-collections-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a collection (x-mitre-collection)

<a id="opIdtechnique-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/collections \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/collections HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collections',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/collections',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/collections', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/collections', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collections");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/collections", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/collections`

This endpoint creates a new collection in the workspace.
Both the `stix.id` and `stix.modified` properties must be set.

> Body parameter

```json
false
```

> Example responses

<h3 id="create-a-collection-(x-mitre-collection)-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The collection has been successfully created.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The collection was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The collection was not created.|None|

<h3 id="create-a-collection-(x-mitre-collection)-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a collection

<a id="opIdcollection-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/collections/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/collections/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collections/{stixId}',
{
  method: 'GET',

  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Accept' => 'application/json'
}

result = RestClient.get '{protocol}://{hostname}:{port}/api/collections/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/collections/{stixId}', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/collections/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collections/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("GET");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/collections/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/collections/{stixId}`

This endpoint gets a list of one or more versions of a collection (x-mitre-collection) from the workspace, identified by the STIX id.

<h3 id="get-one-or-more-versions-of-a-collection-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the collection to retrieve|
|versions|query|string|false|The versions of the collection to retrieve.|
|retrieveContents|query|boolean|false|Retrieve the objects that are referenced by the collection|

#### Detailed descriptions

**versions**: The versions of the collection to retrieve.
`all` gets all versions of the collection, `latest` gets only the latest version.

**retrieveContents**: Retrieve the objects that are referenced by the collection

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[]
```

<h3 id="get-one-or-more-versions-of-a-collection-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of collections matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A collection with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-collection-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» *anonymous*|any|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a collection

<a id="opIdcollection-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/collections/{stixId}

```

```http
DELETE {protocol}://{hostname}:{port}/api/collections/{stixId} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/collections/{stixId}',
{
  method: 'DELETE'

})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

result = RestClient.delete '{protocol}://{hostname}:{port}/api/collections/{stixId}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/collections/{stixId}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/collections/{stixId}', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collections/{stixId}");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("DELETE");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/collections/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/collections/{stixId}`

This endpoint deletes all versions of a collection from the workspace.

<h3 id="delete-a-collection-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the collections to delete|
|deleteAllContents|query|boolean|false|Delete all of the objects referenced in x_mitre_contents.|

#### Detailed descriptions

**deleteAllContents**: Delete all of the objects referenced in x_mitre_contents.

<h3 id="delete-a-collection-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The collections were successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A collection with the requested STIX id was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-collection-bundles">Collection Bundles</h1>

Operations on collection bundles

## Import a collection bundle

<a id="opIdcollection-bundle-import"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/collection-bundles \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/collection-bundles HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = 'false';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collection-bundles',
{
  method: 'POST',
  body: inputBody,
  headers: headers
})
.then(function(res) {
    return res.json();
}).then(function(body) {
    console.log(body);
});

```

```ruby
require 'rest-client'
require 'json'

headers = {
  'Content-Type' => 'application/json',
  'Accept' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/collection-bundles',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/collection-bundles', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
    'Accept' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/collection-bundles', array(
        'headers' => $headers,
        'json' => $request_body,
       )
    );
    print_r($response->getBody()->getContents());
 }
 catch (\GuzzleHttp\Exception\BadResponseException $e) {
    // handle exception or api errors.
    print_r($e->getMessage());
 }

 // ...

```

```java
URL obj = new URL("{protocol}://{hostname}:{port}/api/collection-bundles");
HttpURLConnection con = (HttpURLConnection) obj.openConnection();
con.setRequestMethod("POST");
int responseCode = con.getResponseCode();
BufferedReader in = new BufferedReader(
    new InputStreamReader(con.getInputStream()));
String inputLine;
StringBuffer response = new StringBuffer();
while ((inputLine = in.readLine()) != null) {
    response.append(inputLine);
}
in.close();
System.out.println(response.toString());

```

```go
package main

import (
       "bytes"
       "net/http"
)

func main() {

    headers := map[string][]string{
        "Content-Type": []string{"application/json"},
        "Accept": []string{"application/json"},
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/collection-bundles", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/collection-bundles`

This endpoint imports a collection bundle into the workspace.

> Body parameter

```json
false
```

<h3 id="import-a-collection-bundle-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|checkOnly|query|boolean|false|Do not import the collection.|

#### Detailed descriptions

**checkOnly**: Do not import the collection.
Only determine what the results of the import would be if it were performed.

> Example responses

<h3 id="import-a-collection-bundle-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The collection has been successfully imported.|None|

<h3 id="import-a-collection-bundle-responseschema">Response Schema</h3>

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_editor_identity">editor_identity</h2>
<!-- backwards compatibility -->
<a id="schemaeditor_identity"></a>
<a id="schema_editor_identity"></a>
<a id="tocSeditor_identity"></a>
<a id="tocseditor_identity"></a>

```json
{
  "id": "string",
  "name": "string"
}

```

This property replaces mitreId

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|id|string|true|none|none|
|name|string|true|none|none|

