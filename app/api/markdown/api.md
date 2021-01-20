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

This endpoint gets a list of techniques from the workspace.
The list of techniques may include multiple versions of each technique.

<h3 id="get-a-list-of-techniques-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of techniques to retrieve.|
|offset|query|number|false|The number of techniques to skip.|
|state|query|string|false|State of the object in the editing workflow.|
|revoked|query|boolean|false|Whether the object has been revoked.|
|deprecated|query|boolean|false|Whether the object has been deprecated.|

#### Detailed descriptions

**limit**: The number of techniques to retrieve.
The default (0) will retrieve all techniques.

**offset**: The number of techniques to skip.

**state**: State of the object in the editing workflow.

**revoked**: Whether the object has been revoked.

**deprecated**: Whether the object has been deprecated.

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

