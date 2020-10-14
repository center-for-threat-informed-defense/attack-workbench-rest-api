---
title: Federated ATT&CK REST API v0.0.1
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

<h1 id="federated-att-and-ck-rest-api">Federated ATT&CK REST API v0.0.1</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Base URLs:

* <a href="{protocol}://{hostname}:{port}/">{protocol}://{hostname}:{port}/</a>

    * **protocol** -  Default: http

    * **hostname** -  Default: ::

    * **port** -  Default: 3000

<h1 id="federated-att-and-ck-rest-api-techniques">Techniques</h1>

Operations on techniques.

## Retrieve techniques

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

This endpoint retrieves multiple technique objects.

> Example responses

> 200 Response

```json
[
  {
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "https://attack.mitre.org/techniques/T1103",
          "external_id": "T1103"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "AppInit DLLs",
      "description": "string",
      "kill_chain_phases": [
        {
          "kill_chain_name": "string",
          "phase_name": "string"
        }
      ],
      "x_mitre_contributors": [
        "string"
      ],
      "x_mitre_data_sources": [
        "string"
      ],
      "x_mitre_deprecated": false,
      "x_mitre_detection": "string",
      "x_mitre_effective_permissions": [
        "Administrator"
      ],
      "x_mitre_permissions_required": [
        "Administrator"
      ],
      "x_mitre_platforms": [
        "Windows"
      ],
      "x_mitre_subtechnique": false,
      "x_mitre_system_requirements": [
        "string"
      ],
      "x_mitre_version": "1.0"
    },
    "domains": [
      "enterprise"
    ],
    "editor_identity": {
      "id": "string",
      "name": "string"
    }
  }
]
```

<h3 id="retrieve-techniques-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of techniques.|Inline|

<h3 id="retrieve-techniques-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[technique](#schematechnique)]|false|none|none|
|» stix|[stix-attack-pattern](#schemastix-attack-pattern)|false|none|none|
|»» type|string|true|none|none|
|»» spec_version|string|true|none|none|
|»» id|string|false|none|none|
|»» created_by_ref|string|false|none|none|
|»» created|string(date-time)|true|none|none|
|»» modified|string(date-time)|true|none|none|
|»» revoked|boolean|false|none|none|
|»» external_references|[[external_reference](#schemaexternal_reference)]|false|none|none|
|»»» source_name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» url|string|false|none|none|
|»»» external_id|string|false|none|none|
|»» object_marking_refs|[string]|false|none|none|
|»» name|string|true|none|none|
|»» description|string|false|none|none|
|»» kill_chain_phases|[[kill_chain_phase](#schemakill_chain_phase)]|false|none|none|
|»»» kill_chain_name|string|true|none|none|
|»»» phase_name|string|true|none|none|
|»» x_mitre_contributors|[string]|false|none|none|
|»» x_mitre_data_sources|[string]|false|none|none|
|»» x_mitre_deprecated|boolean|false|none|none|
|»» x_mitre_detection|string|false|none|none|
|»» x_mitre_effective_permissions|[string]|false|none|none|
|»» x_mitre_permissions_required|[string]|false|none|none|
|»» x_mitre_platforms|[string]|false|none|none|
|»» x_mitre_subtechnique|boolean|false|none|none|
|»» x_mitre_system_requirements|[string]|false|none|none|
|»» x_mitre_version|string|false|none|none|
|» domains|[string]|false|none|This property replaces x_mitre_collections|
|» editor_identity|[editor_identity](#schemaeditor_identity)|false|none|This property replaces mitreId|
|»» id|string|true|none|none|
|»» name|string|true|none|none|

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
const inputBody = '{
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "https://attack.mitre.org/techniques/T1103",
        "external_id": "T1103"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "AppInit DLLs",
    "description": "string",
    "kill_chain_phases": [
      {
        "kill_chain_name": "string",
        "phase_name": "string"
      }
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_data_sources": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_detection": "string",
    "x_mitre_effective_permissions": [
      "Administrator"
    ],
    "x_mitre_permissions_required": [
      "Administrator"
    ],
    "x_mitre_platforms": [
      "Windows"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_version": "1.0"
  },
  "domains": [
    "enterprise"
  ],
  "editor_identity": {
    "id": "string",
    "name": "string"
  }
}';
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

This endpoint creates a new technique object.

> Body parameter

```json
{
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "https://attack.mitre.org/techniques/T1103",
        "external_id": "T1103"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "AppInit DLLs",
    "description": "string",
    "kill_chain_phases": [
      {
        "kill_chain_name": "string",
        "phase_name": "string"
      }
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_data_sources": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_detection": "string",
    "x_mitre_effective_permissions": [
      "Administrator"
    ],
    "x_mitre_permissions_required": [
      "Administrator"
    ],
    "x_mitre_platforms": [
      "Windows"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_version": "1.0"
  },
  "domains": [
    "enterprise"
  ],
  "editor_identity": {
    "id": "string",
    "name": "string"
  }
}
```

<h3 id="create-a-technique-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[technique](#schematechnique)|true|none|

> Example responses

> 201 Response

```json
{
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "https://attack.mitre.org/techniques/T1103",
        "external_id": "T1103"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "AppInit DLLs",
    "description": "string",
    "kill_chain_phases": [
      {
        "kill_chain_name": "string",
        "phase_name": "string"
      }
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_data_sources": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_detection": "string",
    "x_mitre_effective_permissions": [
      "Administrator"
    ],
    "x_mitre_permissions_required": [
      "Administrator"
    ],
    "x_mitre_platforms": [
      "Windows"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_version": "1.0"
  },
  "domains": [
    "enterprise"
  ],
  "editor_identity": {
    "id": "string",
    "name": "string"
  }
}
```

<h3 id="create-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The technique has been successfully created.|[technique](#schematechnique)|

<aside class="success">
This operation does not require authentication
</aside>

## Retrieve a technique

<a id="opIdtechnique-get-one"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/techniques/{id} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/techniques/{id} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/techniques/{id}',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/techniques/{id}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/techniques/{id}', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/techniques/{id}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/techniques/{id}");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/techniques/{id}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/techniques/{id}`

The endpoint retrieves a technique using its id.

<h3 id="retrieve-a-technique-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|id of the technique to retrieve|

> Example responses

> 200 Response

```json
{
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "https://attack.mitre.org/techniques/T1103",
        "external_id": "T1103"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "AppInit DLLs",
    "description": "string",
    "kill_chain_phases": [
      {
        "kill_chain_name": "string",
        "phase_name": "string"
      }
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_data_sources": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_detection": "string",
    "x_mitre_effective_permissions": [
      "Administrator"
    ],
    "x_mitre_permissions_required": [
      "Administrator"
    ],
    "x_mitre_platforms": [
      "Windows"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_version": "1.0"
  },
  "domains": [
    "enterprise"
  ],
  "editor_identity": {
    "id": "string",
    "name": "string"
  }
}
```

<h3 id="retrieve-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The technique with the requested id.|[technique](#schematechnique)|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|The technique with the requested id was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

# Schemas

<h2 id="tocS_technique">technique</h2>
<!-- backwards compatibility -->
<a id="schematechnique"></a>
<a id="schema_technique"></a>
<a id="tocStechnique"></a>
<a id="tocstechnique"></a>

```json
{
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "https://attack.mitre.org/techniques/T1103",
        "external_id": "T1103"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "AppInit DLLs",
    "description": "string",
    "kill_chain_phases": [
      {
        "kill_chain_name": "string",
        "phase_name": "string"
      }
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_data_sources": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_detection": "string",
    "x_mitre_effective_permissions": [
      "Administrator"
    ],
    "x_mitre_permissions_required": [
      "Administrator"
    ],
    "x_mitre_platforms": [
      "Windows"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_version": "1.0"
  },
  "domains": [
    "enterprise"
  ],
  "editor_identity": {
    "id": "string",
    "name": "string"
  }
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|stix|[stix-attack-pattern](#schemastix-attack-pattern)|false|none|none|
|domains|[string]|false|none|This property replaces x_mitre_collections|
|editor_identity|[editor_identity](#schemaeditor_identity)|false|none|This property replaces mitreId|

<h2 id="tocS_stix-attack-pattern">stix-attack-pattern</h2>
<!-- backwards compatibility -->
<a id="schemastix-attack-pattern"></a>
<a id="schema_stix-attack-pattern"></a>
<a id="tocSstix-attack-pattern"></a>
<a id="tocsstix-attack-pattern"></a>

```json
{
  "type": "attack-pattern",
  "spec_version": "2.1",
  "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
  "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
  "created": "2019-08-24T14:15:22Z",
  "modified": "2019-08-24T14:15:22Z",
  "revoked": false,
  "external_references": [
    {
      "source_name": "mitre-attack",
      "description": "string",
      "url": "https://attack.mitre.org/techniques/T1103",
      "external_id": "T1103"
    }
  ],
  "object_marking_refs": [
    "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
  ],
  "name": "AppInit DLLs",
  "description": "string",
  "kill_chain_phases": [
    {
      "kill_chain_name": "string",
      "phase_name": "string"
    }
  ],
  "x_mitre_contributors": [
    "string"
  ],
  "x_mitre_data_sources": [
    "string"
  ],
  "x_mitre_deprecated": false,
  "x_mitre_detection": "string",
  "x_mitre_effective_permissions": [
    "Administrator"
  ],
  "x_mitre_permissions_required": [
    "Administrator"
  ],
  "x_mitre_platforms": [
    "Windows"
  ],
  "x_mitre_subtechnique": false,
  "x_mitre_system_requirements": [
    "string"
  ],
  "x_mitre_version": "1.0"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|type|string|true|none|none|
|spec_version|string|true|none|none|
|id|string|false|none|none|
|created_by_ref|string|false|none|none|
|created|string(date-time)|true|none|none|
|modified|string(date-time)|true|none|none|
|revoked|boolean|false|none|none|
|external_references|[[external_reference](#schemaexternal_reference)]|false|none|none|
|object_marking_refs|[string]|false|none|none|
|name|string|true|none|none|
|description|string|false|none|none|
|kill_chain_phases|[[kill_chain_phase](#schemakill_chain_phase)]|false|none|none|
|x_mitre_contributors|[string]|false|none|none|
|x_mitre_data_sources|[string]|false|none|none|
|x_mitre_deprecated|boolean|false|none|none|
|x_mitre_detection|string|false|none|none|
|x_mitre_effective_permissions|[string]|false|none|none|
|x_mitre_permissions_required|[string]|false|none|none|
|x_mitre_platforms|[string]|false|none|none|
|x_mitre_subtechnique|boolean|false|none|none|
|x_mitre_system_requirements|[string]|false|none|none|
|x_mitre_version|string|false|none|none|

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

<h2 id="tocS_external_reference">external_reference</h2>
<!-- backwards compatibility -->
<a id="schemaexternal_reference"></a>
<a id="schema_external_reference"></a>
<a id="tocSexternal_reference"></a>
<a id="tocsexternal_reference"></a>

```json
{
  "source_name": "mitre-attack",
  "description": "string",
  "url": "https://attack.mitre.org/techniques/T1103",
  "external_id": "T1103"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|source_name|string|true|none|none|
|description|string|false|none|none|
|url|string|false|none|none|
|external_id|string|false|none|none|

<h2 id="tocS_kill_chain_phase">kill_chain_phase</h2>
<!-- backwards compatibility -->
<a id="schemakill_chain_phase"></a>
<a id="schema_kill_chain_phase"></a>
<a id="tocSkill_chain_phase"></a>
<a id="tocskill_chain_phase"></a>

```json
{
  "kill_chain_name": "string",
  "phase_name": "string"
}

```

### Properties

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|kill_chain_name|string|true|none|none|
|phase_name|string|true|none|none|

