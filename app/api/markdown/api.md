---
title: ATT&CK Workbench REST API v1.0.0
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

<h1 id="att-and-ck-workbench-rest-api">ATT&CK Workbench REST API v1.0.0</h1>

> Scroll down for code samples, example requests and responses. Select a language for code samples from the tabs above or the mobile navigation menu.

Base URLs:

* <a href="{protocol}://{hostname}:{port}/">{protocol}://{hostname}:{port}/</a>

    * **protocol** -  Default: http

    * **hostname** -  Default: localhost

    * **port** -  Default: 3000

<h1 id="att-and-ck-workbench-rest-api-att-and-ck-objects">ATT&CK Objects</h1>

Operations on all ATT&CK objects

## Get a list of all ATT&CK objects

<a id="opIdattack-object-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/attack-objects \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/attack-objects HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/attack-objects',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/attack-objects',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/attack-objects', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/attack-objects', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/attack-objects");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/attack-objects", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/attack-objects`

This endpoint gets a list of all ATT&CK objects from the workspace.
The list of objects may include multiple versions of each ATT&CK object.

<h3 id="get-a-list-of-all-att&ck-objects-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|attackId|query|string|false|The ATT&CK ID of the object to retrieve.|
|limit|query|number|false|The number of objects to retrieve.|
|offset|query|number|false|The number of objects to skip.|
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**attackId**: The ATT&CK ID of the object to retrieve.
Returns all objects where the last version of the object matches the requested ATT&CK ID.

**limit**: The number of objects to retrieve.
The default (0) will retrieve all objects.

**offset**: The number of objects to skip.
The default (0) will start with the first object.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "imported": "2019-08-24T14:15:22Z",
      "import_categories": {
        "additions": [
          "string"
        ],
        "changes": [
          "string"
        ],
        "minor_changes": [
          "string"
        ],
        "revocations": [
          "string"
        ],
        "deprecations": [
          "string"
        ],
        "supersedes_user_edits": [
          "string"
        ],
        "supersedes_collection_changes": [
          "string"
        ],
        "duplicates": [
          "string"
        ],
        "out_of_date": [
          "string"
        ],
        "errors": [
          {
            "object_ref": "string",
            "object_modified": "string",
            "error_type": "string",
            "error_message": "string"
          }
        ]
      },
      "workflow": {
        "state": "string",
        "release": true
      }
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Enterprise ATT&CK",
      "description": "string",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_contents": [
        {
          "object_ref": "string",
          "object_modified": "string"
        }
      ],
      "x_mitre_deprecated": false,
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-all-att&ck-objects-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of ATT&CK Objects.|Inline|

<h3 id="get-a-list-of-all-att&ck-objects-responseschema">Response Schema</h3>

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-techniques">Techniques</h1>

Operations on techniques

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of techniques to retrieve.
The default (0) will retrieve all techniques.

**offset**: The number of techniques to skip.
The default (0) will start with the first technique.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
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
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
      "x_mitre_impact_type": [
        "Availability"
      ],
      "x_mitre_subtechnique": false,
      "x_mitre_system_requirements": [
        "string"
      ],
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-techniques-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of techniques.|Inline|

<h3 id="get-a-list-of-techniques-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/9](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/9)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» kill_chain_phases|[object]|false|none|none|
|»»»» kill_chain_name|string|true|none|none|
|»»»» phase_name|string|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_data_sources|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_detection|string|false|none|none|
|»»» x_mitre_effective_permissions|[string]|false|none|none|
|»»» x_mitre_permissions_required|[string]|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|
|»»» x_mitre_impact_type|[string]|false|none|none|
|»»» x_mitre_subtechnique|boolean|false|none|none|
|»»» x_mitre_system_requirements|[string]|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
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
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
    "x_mitre_impact_type": [
      "Availability"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
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

This endpoint creates a new technique in the workspace.
If the `stix.id` property is set, it creates a new version of an existing technique.
If the `stix.id` property is not set, it creates a new technique, generating a STIX id for it.

> Body parameter

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
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
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
    "x_mitre_impact_type": [
      "Availability"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-technique-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/9](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/9)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
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
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
    "x_mitre_impact_type": [
      "Availability"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The technique has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The technique was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The technique was not created.|None|

<h3 id="create-a-technique-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» kill_chain_phases|[object]|false|none|none|
|»»»» kill_chain_name|string|true|none|none|
|»»»» phase_name|string|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_data_sources|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_detection|string|false|none|none|
|»»» x_mitre_effective_permissions|[string]|false|none|none|
|»»» x_mitre_permissions_required|[string]|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|
|»»» x_mitre_impact_type|[string]|false|none|none|
|»»» x_mitre_subtechnique|boolean|false|none|none|
|»»» x_mitre_system_requirements|[string]|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
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
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
      "x_mitre_impact_type": [
        "Availability"
      ],
      "x_mitre_subtechnique": false,
      "x_mitre_system_requirements": [
        "string"
      ],
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/9](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/9)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» kill_chain_phases|[object]|false|none|none|
|»»»» kill_chain_name|string|true|none|none|
|»»»» phase_name|string|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_data_sources|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_detection|string|false|none|none|
|»»» x_mitre_effective_permissions|[string]|false|none|none|
|»»» x_mitre_permissions_required|[string]|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|
|»»» x_mitre_impact_type|[string]|false|none|none|
|»»» x_mitre_subtechnique|boolean|false|none|none|
|»»» x_mitre_system_requirements|[string]|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
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
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
    "x_mitre_impact_type": [
      "Availability"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-technique-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a technique matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A technique with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-technique-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» kill_chain_phases|[object]|false|none|none|
|»»»» kill_chain_name|string|true|none|none|
|»»»» phase_name|string|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_data_sources|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_detection|string|false|none|none|
|»»» x_mitre_effective_permissions|[string]|false|none|none|
|»»» x_mitre_permissions_required|[string]|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|
|»»» x_mitre_impact_type|[string]|false|none|none|
|»»» x_mitre_subtechnique|boolean|false|none|none|
|»»» x_mitre_system_requirements|[string]|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
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
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
    "x_mitre_impact_type": [
      "Availability"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
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
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
    "x_mitre_impact_type": [
      "Availability"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-technique-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the technique to update|
|modified|path|string|true|modified date of the technique to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/9](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/9)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
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
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
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
    "x_mitre_impact_type": [
      "Availability"
    ],
    "x_mitre_subtechnique": false,
    "x_mitre_system_requirements": [
      "string"
    ],
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-technique-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The technique was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The technique was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A technique with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-technique-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» kill_chain_phases|[object]|false|none|none|
|»»»» kill_chain_name|string|true|none|none|
|»»»» phase_name|string|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_data_sources|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_detection|string|false|none|none|
|»»» x_mitre_effective_permissions|[string]|false|none|none|
|»»» x_mitre_permissions_required|[string]|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|
|»»» x_mitre_impact_type|[string]|false|none|none|
|»»» x_mitre_subtechnique|boolean|false|none|none|
|»»» x_mitre_system_requirements|[string]|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

Operations on tactics

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of tactics to retrieve.
The default (0) will retrieve all tactics.

**offset**: The number of tactics to skip.
The default (0) will start with the first tactic.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Collection",
      "description": "This is a tactic.",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_contributors": [
        "string"
      ],
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-tactics-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of tactics.|Inline|

<h3 id="get-a-list-of-tactics-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/8](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/8)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Collection",
    "description": "This is a tactic.",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Collection",
    "description": "This is a tactic.",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-tactic-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/8](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/8)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Collection",
    "description": "This is a tactic.",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-tactic-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The tactic has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The tactic was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The tactic was not created.|None|

<h3 id="create-a-tactic-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Collection",
      "description": "This is a tactic.",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_contributors": [
        "string"
      ],
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/8](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/8)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Collection",
    "description": "This is a tactic.",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-tactic-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a tactic matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A tactic with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-tactic-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Collection",
    "description": "This is a tactic.",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Collection",
    "description": "This is a tactic.",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-tactic-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the tactic to update|
|modified|path|string|true|modified date of the tactic to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/8](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/8)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Collection",
    "description": "This is a tactic.",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-tactic-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The tactic was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The tactic was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A tactic with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-tactic-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

Operations on groups

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of groups to retrieve.
The default (0) will retrieve all groups.

**offset**: The number of groups to skip.
The default (0) will start with the first group.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "APT29",
      "description": "This is an intrusion set (group)",
      "aliases": [
        "string"
      ],
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_contributors": [
        "string"
      ],
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-groups-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of groups.|Inline|

<h3 id="get-a-list-of-groups-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» aliases|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "APT29",
    "description": "This is an intrusion set (group)",
    "aliases": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "APT29",
    "description": "This is an intrusion set (group)",
    "aliases": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "APT29",
    "description": "This is an intrusion set (group)",
    "aliases": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The group has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The group was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The group was not created.|None|

<h3 id="create-a-group-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» aliases|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "APT29",
      "description": "This is an intrusion set (group)",
      "aliases": [
        "string"
      ],
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_contributors": [
        "string"
      ],
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» aliases|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "APT29",
    "description": "This is an intrusion set (group)",
    "aliases": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-group-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a group matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A group with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-group-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» aliases|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "APT29",
    "description": "This is an intrusion set (group)",
    "aliases": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "APT29",
    "description": "This is an intrusion set (group)",
    "aliases": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-group-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the group to update|
|modified|path|string|true|modified date of the group to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "APT29",
    "description": "This is an intrusion set (group)",
    "aliases": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-group-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The group was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The group was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A group with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-group-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» aliases|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

<a id="opIdsoftware-get-all"></a>

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of software objects to retrieve.
The default (0) will retrieve all software objects.

**offset**: The number of software objects to skip.
The default (0) will start with the first software object.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Net",
      "description": "This is a software",
      "is_family": true,
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_aliases": [
        "string"
      ],
      "x_mitre_contributors": [
        "string"
      ],
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0",
      "x_mitre_platforms": [
        "Windows"
      ]
    }
  }
]
```

<h3 id="get-a-list-of-software-objects-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of software objects.|Inline|

<h3 id="get-a-list-of-software-objects-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/7](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/7)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» is_family|boolean|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_aliases|[string]|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Net",
    "description": "This is a software",
    "is_family": true,
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_aliases": [
      "string"
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0",
    "x_mitre_platforms": [
      "Windows"
    ]
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Net",
    "description": "This is a software",
    "is_family": true,
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_aliases": [
      "string"
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0",
    "x_mitre_platforms": [
      "Windows"
    ]
  }
}
```

<h3 id="create-a-software-object-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/7](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/7)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Net",
    "description": "This is a software",
    "is_family": true,
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_aliases": [
      "string"
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0",
    "x_mitre_platforms": [
      "Windows"
    ]
  }
}
```

<h3 id="create-a-software-object-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The software object has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The software object was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The software object was not created.|None|

<h3 id="create-a-software-object-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» is_family|boolean|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_aliases|[string]|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Net",
      "description": "This is a software",
      "is_family": true,
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_aliases": [
        "string"
      ],
      "x_mitre_contributors": [
        "string"
      ],
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0",
      "x_mitre_platforms": [
        "Windows"
      ]
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/7](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/7)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» is_family|boolean|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_aliases|[string]|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Net",
    "description": "This is a software",
    "is_family": true,
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_aliases": [
      "string"
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0",
    "x_mitre_platforms": [
      "Windows"
    ]
  }
}
```

<h3 id="gets-the-version-of-a-software-object-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a software object matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A software object with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-software-object-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» is_family|boolean|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_aliases|[string]|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Net",
    "description": "This is a software",
    "is_family": true,
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_aliases": [
      "string"
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0",
    "x_mitre_platforms": [
      "Windows"
    ]
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Net",
    "description": "This is a software",
    "is_family": true,
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_aliases": [
      "string"
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0",
    "x_mitre_platforms": [
      "Windows"
    ]
  }
}
```

<h3 id="update-a-software-object-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the software object to update|
|modified|path|string|true|modified date of the software object to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/7](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/7)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Net",
    "description": "This is a software",
    "is_family": true,
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_aliases": [
      "string"
    ],
    "x_mitre_contributors": [
      "string"
    ],
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0",
    "x_mitre_platforms": [
      "Windows"
    ]
  }
}
```

<h3 id="update-a-software-object-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The software object was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The software object was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A software object with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-software-object-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» is_family|boolean|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_aliases|[string]|false|none|none|
|»»» x_mitre_contributors|[string]|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|
|»»» x_mitre_platforms|[string]|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of mitigations to retrieve.
The default (0) will retrieve all mitigations.

**offset**: The number of mitigations to skip.
The default (0) will start with the first mitigation.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Compiled HTML File Mitigation",
      "description": "This is a course of action (mitigation).",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-mitigations-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of mitigations.|Inline|

<h3 id="get-a-list-of-mitigations-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/5](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/5)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Compiled HTML File Mitigation",
    "description": "This is a course of action (mitigation).",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Compiled HTML File Mitigation",
    "description": "This is a course of action (mitigation).",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-mitigation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/5](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/5)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Compiled HTML File Mitigation",
    "description": "This is a course of action (mitigation).",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-mitigation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The mitigation has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The mitigation was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The mitigation was not created.|None|

<h3 id="create-a-mitigation-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Compiled HTML File Mitigation",
      "description": "This is a course of action (mitigation).",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/5](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/5)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Compiled HTML File Mitigation",
    "description": "This is a course of action (mitigation).",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-mitigation-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a mitigation matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A mitigation with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-mitigation-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Compiled HTML File Mitigation",
    "description": "This is a course of action (mitigation).",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Compiled HTML File Mitigation",
    "description": "This is a course of action (mitigation).",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-mitigation-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the mitigation to update|
|modified|path|string|true|modified date of the mitigation to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/5](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/5)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Compiled HTML File Mitigation",
    "description": "This is a course of action (mitigation).",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-mitigation-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The mitigation was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The mitigation was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A mitigation with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-mitigation-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

Operations on matrices

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of matrices to retrieve.
The default (0) will retrieve all matrices.

**offset**: The number of matrices to skip.
The default (0) will start with the first matrix.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Mobile ATT&CK",
      "description": "This is a matrix",
      "tactic_refs": [
        "string"
      ],
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-matrices-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of matrices.|Inline|

<h3 id="get-a-list-of-matrices-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/4](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/4)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» tactic_refs|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Mobile ATT&CK",
    "description": "This is a matrix",
    "tactic_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Mobile ATT&CK",
    "description": "This is a matrix",
    "tactic_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-matrix-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/4](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/4)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Mobile ATT&CK",
    "description": "This is a matrix",
    "tactic_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-matrix-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The matrix has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The matrix was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The matrix was not created.|None|

<h3 id="create-a-matrix-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» tactic_refs|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Mobile ATT&CK",
      "description": "This is a matrix",
      "tactic_refs": [
        "string"
      ],
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/4](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/4)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» tactic_refs|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Mobile ATT&CK",
    "description": "This is a matrix",
    "tactic_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-matrix-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a matrix matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A matrix with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-matrix-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» tactic_refs|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Mobile ATT&CK",
    "description": "This is a matrix",
    "tactic_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Mobile ATT&CK",
    "description": "This is a matrix",
    "tactic_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-matrix-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the matrix to update|
|modified|path|string|true|modified date of the matrix to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/4](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/4)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Mobile ATT&CK",
    "description": "This is a matrix",
    "tactic_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-matrix-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The matrix was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The matrix was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A matrix with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-matrix-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» tactic_refs|[string]|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

<h1 id="att-and-ck-workbench-rest-api-identities">Identities</h1>

Operations on identities

## Get a list of identities

<a id="opIdidentity-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/identities \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/identities HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/identities',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/identities',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/identities', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/identities', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/identities");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/identities", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/identities`

This endpoint retrieves a list of identities from the workspace.
If there are multiple versions of an identity, only the latest version (based on the `modified` property) will be returned.
In addition, the `state`, `includeRevoked`, and `includeDeprecated` filters are only applied to the latest version of an identity.

<h3 id="get-a-list-of-identities-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of identities to retrieve.|
|offset|query|number|false|The number of identities to skip.|
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of identities to retrieve.
The default (0) will retrieve all identities.

**offset**: The number of identities to skip.
The default (0) will start with the first identity.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "The MITRE Corporation",
      "description": "This is an identity",
      "roles": [
        "string"
      ],
      "identity_class": "organization",
      "sectors": [
        "string"
      ],
      "contact_information": "string",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-identities-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of identities.|Inline|

<h3 id="get-a-list-of-identities-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/2](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/2)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» roles|[string]|false|none|none|
|»»» identity_class|string|false|none|none|
|»»» sectors|[string]|false|none|none|
|»»» contact_information|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Create an identity

<a id="opIdidentity-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/identities \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/identities HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "The MITRE Corporation",
    "description": "This is an identity",
    "roles": [
      "string"
    ],
    "identity_class": "organization",
    "sectors": [
      "string"
    ],
    "contact_information": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/identities',
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

result = RestClient.post '{protocol}://{hostname}:{port}/api/identities',
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

r = requests.post('{protocol}://{hostname}:{port}/api/identities', headers = headers)

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
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/identities', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/identities");
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
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/identities", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/identities`

This endpoint creates a new identity in the workspace.
If the `stix.id` property is set, it creates a new version of an existing identity.
If the `stix.id` property is not set, it creates a new identity, generating a STIX id for it.

> Body parameter

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "The MITRE Corporation",
    "description": "This is an identity",
    "roles": [
      "string"
    ],
    "identity_class": "organization",
    "sectors": [
      "string"
    ],
    "contact_information": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-an-identity-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/2](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/2)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "The MITRE Corporation",
    "description": "This is an identity",
    "roles": [
      "string"
    ],
    "identity_class": "organization",
    "sectors": [
      "string"
    ],
    "contact_information": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-an-identity-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The identity has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The identity was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The identity was not created.|None|

<h3 id="create-an-identity-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» roles|[string]|false|none|none|
|»»» identity_class|string|false|none|none|
|»»» sectors|[string]|false|none|none|
|»»» contact_information|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of an identity

<a id="opIdidentity-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/identities/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/identities/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/identities/{stixId}',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/identities/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/identities/{stixId}', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/identities/{stixId}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/identities/{stixId}");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/identities/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/identities/{stixId}`

This endpoint gets a list of one or more versions of an identity from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-an-identity-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the identity to retrieve|
|versions|query|string|false|The versions of the identity to retrieve.|

#### Detailed descriptions

**versions**: The versions of the identity to retrieve.
`all` gets all versions of the identity, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "The MITRE Corporation",
      "description": "This is an identity",
      "roles": [
        "string"
      ],
      "identity_class": "organization",
      "sectors": [
        "string"
      ],
      "contact_information": "string",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-one-or-more-versions-of-an-identity-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of identities matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|An identity with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-an-identity-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/2](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/2)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» roles|[string]|false|none|none|
|»»» identity_class|string|false|none|none|
|»»» sectors|[string]|false|none|none|
|»»» contact_information|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a identity matching the STIX id and modified date

<a id="opIdidentity-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/identities/{stixId}/modified/{modified}`

This endpoint gets a single version of a identity from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-identity-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the identity to retrieve|
|modified|path|string|true|modified date of the identity to retrieve|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "The MITRE Corporation",
    "description": "This is an identity",
    "roles": [
      "string"
    ],
    "identity_class": "organization",
    "sectors": [
      "string"
    ],
    "contact_information": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-identity-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of an identity matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|An identity with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-identity-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» roles|[string]|false|none|none|
|»»» identity_class|string|false|none|none|
|»»» sectors|[string]|false|none|none|
|»»» contact_information|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Update an identity

<a id="opIdidentity-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "The MITRE Corporation",
    "description": "This is an identity",
    "roles": [
      "string"
    ],
    "identity_class": "organization",
    "sectors": [
      "string"
    ],
    "contact_information": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}',
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

result = RestClient.put '{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}',
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

r = requests.put('{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}', headers = headers)

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
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}");
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
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/identities/{stixId}/modified/{modified}`

This endpoint updates a single version of an identity in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "The MITRE Corporation",
    "description": "This is an identity",
    "roles": [
      "string"
    ],
    "identity_class": "organization",
    "sectors": [
      "string"
    ],
    "contact_information": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-an-identity-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the identity to update|
|modified|path|string|true|modified date of the identity to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/2](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/2)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "The MITRE Corporation",
    "description": "This is an identity",
    "roles": [
      "string"
    ],
    "identity_class": "organization",
    "sectors": [
      "string"
    ],
    "contact_information": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-an-identity-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The identity was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The identity was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|An identity with the requested STIX id and modified date was not found.|None|

<h3 id="update-an-identity-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» roles|[string]|false|none|none|
|»»» identity_class|string|false|none|none|
|»»» sectors|[string]|false|none|none|
|»»» contact_information|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a identity

<a id="opIdidentity-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}',
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

result = RestClient.delete '{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}");
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
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/identities/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/identities/{stixId}/modified/{modified}`

This endpoint deletes a single version of an identity from the workspace.
The identity is identified by its STIX id and modified date.

<h3 id="delete-a-identity-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the identity to delete|
|modified|path|string|true|modified date of the identity to delete|

<h3 id="delete-a-identity-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The identity was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|An identity with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-marking-definitions">Marking Definitions</h1>

Operations on marking definitions

## Get a list of marking definitions

<a id="opIdmarking-definition-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/marking-definitions \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/marking-definitions HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/marking-definitions',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/marking-definitions',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/marking-definitions', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/marking-definitions', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/marking-definitions");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/marking-definitions", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/marking-definitions`

This endpoint retrieves a list of marking definitions from the workspace.
Note that marking definitions do not have an `modified` property and only one version of a marking definition may exist.
In addition, a marking definition does not have a `revoked` property.

<h3 id="get-a-list-of-marking-definitions-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of marking definitions to retrieve.|
|offset|query|number|false|The number of marking definitions to skip.|
|state|query|any|false|State of the object in the editing workflow.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of marking definitions to retrieve.
The default (0) will retrieve all marking definitions.

**offset**: The number of marking definitions to skip.
The default (0) will start with the first marking definition.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "string",
      "spec_version": "2.1",
      "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "string",
      "definition_type": "statement",
      "definition": {
        "statement": "string"
      },
      "x_mitre_deprecated": false
    }
  }
]
```

<h3 id="get-a-list-of-marking-definitions-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of marking definitions.|Inline|

<h3 id="get-a-list-of-marking-definitions-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/3](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/3)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|false|none|none|
|»»» definition_type|string|false|none|none|
|»»» definition|object|false|none|none|
|»»»» statement|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a marking definition

<a id="opIdmarking-definition-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/marking-definitions \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/marking-definitions HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "string",
    "spec_version": "2.1",
    "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "string",
    "definition_type": "statement",
    "definition": {
      "statement": "string"
    },
    "x_mitre_deprecated": false
  }
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/marking-definitions',
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

result = RestClient.post '{protocol}://{hostname}:{port}/api/marking-definitions',
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

r = requests.post('{protocol}://{hostname}:{port}/api/marking-definitions', headers = headers)

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
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/marking-definitions', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/marking-definitions");
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
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/marking-definitions", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/marking-definitions`

This endpoint creates a new marking definition in the workspace.
The `stix.id` property should not be set; this endpoint will create a new marking definition, generating a STIX id for it.

> Body parameter

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "string",
    "spec_version": "2.1",
    "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "string",
    "definition_type": "statement",
    "definition": {
      "statement": "string"
    },
    "x_mitre_deprecated": false
  }
}
```

<h3 id="create-a-marking-definition-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/3](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/3)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "string",
    "spec_version": "2.1",
    "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "string",
    "definition_type": "statement",
    "definition": {
      "statement": "string"
    },
    "x_mitre_deprecated": false
  }
}
```

<h3 id="create-a-marking-definition-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The marking definition has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The marking definition was not created.|None|

<h3 id="create-a-marking-definition-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|false|none|none|
|»»» definition_type|string|false|none|none|
|»»» definition|object|false|none|none|
|»»»» statement|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get a marking definition

<a id="opIdmarking-definition-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/marking-definitions/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/marking-definitions/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/marking-definitions/{stixId}`

This endpoint gets a list containing one marking definition from the workspace, identified by STIX id.
(This endpoint returns a list to maintain a similar structure with other endpoints.)

<h3 id="get-a-marking-definition-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the marking definition to retrieve|

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "string",
      "spec_version": "2.1",
      "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "string",
      "definition_type": "statement",
      "definition": {
        "statement": "string"
      },
      "x_mitre_deprecated": false
    }
  }
]
```

<h3 id="get-a-marking-definition-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list containing one marking definition matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A marking definition with the requested STIX id was not found.|None|

<h3 id="get-a-marking-definition-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/3](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/3)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|false|none|none|
|»»» definition_type|string|false|none|none|
|»»» definition|object|false|none|none|
|»»»» statement|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a marking definition

<a id="opIdmarking-definition-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/marking-definitions/{stixId} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/marking-definitions/{stixId} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "string",
    "spec_version": "2.1",
    "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "string",
    "definition_type": "statement",
    "definition": {
      "statement": "string"
    },
    "x_mitre_deprecated": false
  }
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}',
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

result = RestClient.put '{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}',
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

r = requests.put('{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}', headers = headers)

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
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}");
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
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/marking-definitions/{stixId}`

This endpoint updates a marking definition in the workspace, identified by its STIX id.

> Body parameter

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "string",
    "spec_version": "2.1",
    "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "string",
    "definition_type": "statement",
    "definition": {
      "statement": "string"
    },
    "x_mitre_deprecated": false
  }
}
```

<h3 id="update-a-marking-definition-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the marking definition to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/3](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/3)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "string",
    "spec_version": "2.1",
    "id": "marking-definition--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "string",
    "definition_type": "statement",
    "definition": {
      "statement": "string"
    },
    "x_mitre_deprecated": false
  }
}
```

<h3 id="update-a-marking-definition-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The marking definition was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The marking definition was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A marking definition with the requested STIX id was not found.|None|

<h3 id="update-a-marking-definition-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|false|none|none|
|»»» definition_type|string|false|none|none|
|»»» definition|object|false|none|none|
|»»»» statement|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a marking definition

<a id="opIdmarking-definition-delete"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/marking-definitions/{stixId}

```

```http
DELETE {protocol}://{hostname}:{port}/api/marking-definitions/{stixId} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}',
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

result = RestClient.delete '{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}");
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
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/marking-definitions/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/marking-definitions/{stixId}`

This endpoint deletes a marking definition from the workspace.
The marking definition is identified by its STIX id.

<h3 id="delete-a-marking-definition-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the marking definition to delete|

<h3 id="delete-a-marking-definition-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The marking definition was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A marking definition with the requested STIX id was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-relationships">Relationships</h1>

Operations on relationships

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|sourceRef|query|string|false|STIX id of referenced object. Only retrieve relationships that reference this object in the `source_ref` property.|
|targetRef|query|string|false|STIX id of referenced object. Only retrieve relationships that reference this object in the `target_ref` property.|
|sourceOrTargetRef|query|string|false|STIX id of referenced object.|
|relationshipType|query|string|false|Only retrieve relationships that have a matching `relationship_type`.|
|sourceType|query|string|false|Only retrieve relationships that have a `source_ref` to an object of the selected type.|
|targetType|query|string|false|Only retrieve relationships that have a `target_ref` to an object of the selected type.|
|versions|query|string|false|The versions of the relationship to retrieve.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of relationships to retrieve.
The default (0) will retrieve all relationships.

**offset**: The number of relationships to skip.
The default (0) will start with the first relationship.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**sourceRef**: STIX id of referenced object. Only retrieve relationships that reference this object in the `source_ref` property.

**targetRef**: STIX id of referenced object. Only retrieve relationships that reference this object in the `target_ref` property.

**sourceOrTargetRef**: STIX id of referenced object.
Only retrieve relationships that reference this object in either the `source_ref` or `target_ref` properties.

**relationshipType**: Only retrieve relationships that have a matching `relationship_type`.

**sourceType**: Only retrieve relationships that have a `source_ref` to an object of the selected type.

**targetType**: Only retrieve relationships that have a `target_ref` to an object of the selected type.

**versions**: The versions of the relationship to retrieve.
`all` gets all versions of the relationship, `latest` gets only the latest version.

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
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "description": "This is a relationship",
      "relationship_type": "uses",
      "source_ref": "string",
      "target_ref": "string",
      "start_time": "2019-08-24T14:15:22Z",
      "stop_time": "2019-08-24T14:15:22Z",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-relationships-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of relationships.|Inline|

<h3 id="get-a-list-of-relationships-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/6](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/6)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» description|string|false|none|none|
|»»» relationship_type|string|true|none|none|
|»»» source_ref|string|true|none|none|
|»»» target_ref|string|true|none|none|
|»»» start_time|string(date-time)|false|none|none|
|»»» stop_time|string(date-time)|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "description": "This is a relationship",
    "relationship_type": "uses",
    "source_ref": "string",
    "target_ref": "string",
    "start_time": "2019-08-24T14:15:22Z",
    "stop_time": "2019-08-24T14:15:22Z",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "description": "This is a relationship",
    "relationship_type": "uses",
    "source_ref": "string",
    "target_ref": "string",
    "start_time": "2019-08-24T14:15:22Z",
    "stop_time": "2019-08-24T14:15:22Z",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-relationship-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/6](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/6)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "description": "This is a relationship",
    "relationship_type": "uses",
    "source_ref": "string",
    "target_ref": "string",
    "start_time": "2019-08-24T14:15:22Z",
    "stop_time": "2019-08-24T14:15:22Z",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-relationship-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The relationship has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The relationship was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The relationship was not created.|None|

<h3 id="create-a-relationship-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» description|string|false|none|none|
|»»» relationship_type|string|true|none|none|
|»»» source_ref|string|true|none|none|
|»»» target_ref|string|true|none|none|
|»»» start_time|string(date-time)|false|none|none|
|»»» stop_time|string(date-time)|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "description": "This is a relationship",
      "relationship_type": "uses",
      "source_ref": "string",
      "target_ref": "string",
      "start_time": "2019-08-24T14:15:22Z",
      "stop_time": "2019-08-24T14:15:22Z",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_domains": [
        "string"
      ],
      "x_mitre_version": "1.0"
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/6](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/6)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» description|string|false|none|none|
|»»» relationship_type|string|true|none|none|
|»»» source_ref|string|true|none|none|
|»»» target_ref|string|true|none|none|
|»»» start_time|string(date-time)|false|none|none|
|»»» stop_time|string(date-time)|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "description": "This is a relationship",
    "relationship_type": "uses",
    "source_ref": "string",
    "target_ref": "string",
    "start_time": "2019-08-24T14:15:22Z",
    "stop_time": "2019-08-24T14:15:22Z",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-relationship-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a relationship matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A relationship with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-relationship-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» description|string|false|none|none|
|»»» relationship_type|string|true|none|none|
|»»» source_ref|string|true|none|none|
|»»» target_ref|string|true|none|none|
|»»» start_time|string(date-time)|false|none|none|
|»»» stop_time|string(date-time)|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "description": "This is a relationship",
    "relationship_type": "uses",
    "source_ref": "string",
    "target_ref": "string",
    "start_time": "2019-08-24T14:15:22Z",
    "stop_time": "2019-08-24T14:15:22Z",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "description": "This is a relationship",
    "relationship_type": "uses",
    "source_ref": "string",
    "target_ref": "string",
    "start_time": "2019-08-24T14:15:22Z",
    "stop_time": "2019-08-24T14:15:22Z",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-relationship-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the relationship to update|
|modified|path|string|true|modified date of the relationship to update|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/6](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/6)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "description": "This is a relationship",
    "relationship_type": "uses",
    "source_ref": "string",
    "target_ref": "string",
    "start_time": "2019-08-24T14:15:22Z",
    "stop_time": "2019-08-24T14:15:22Z",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false,
    "x_mitre_domains": [
      "string"
    ],
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="update-a-relationship-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The relationship was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The relationship was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A relationship with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-relationship-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» description|string|false|none|none|
|»»» relationship_type|string|true|none|none|
|»»» source_ref|string|true|none|none|
|»»» target_ref|string|true|none|none|
|»»» start_time|string(date-time)|false|none|none|
|»»» stop_time|string(date-time)|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_domains|[string]|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

<h1 id="att-and-ck-workbench-rest-api-notes">Notes</h1>

Operations on notes

## Get a list of notes

<a id="opIdnote-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/notes \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/notes HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/notes',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/notes',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/notes', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/notes', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/notes");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/notes", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/notes`

This endpoint gets a list of notes from the workspace.

<h3 id="get-a-list-of-notes-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of notes to retrieve.|
|offset|query|number|false|The number of notes to skip.|
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of notes to retrieve.
The default (0) will retrieve all notes.

**offset**: The number of notes to skip.
The default (0) will start with the first note.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "abstract": "string",
      "content": "string",
      "authors": [
        "string"
      ],
      "object_refs": [
        "string"
      ],
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false
    }
  }
]
```

<h3 id="get-a-list-of-notes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of notes.|Inline|

<h3 id="get-a-list-of-notes-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» abstract|string|false|none|none|
|»»» content|string|true|none|none|
|»»» authors|[string]|false|none|none|
|»»» object_refs|[string]|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Create a note

<a id="opIdnote-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/notes \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/notes HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "abstract": "string",
    "content": "string",
    "authors": [
      "string"
    ],
    "object_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false
  }
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/notes',
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

result = RestClient.post '{protocol}://{hostname}:{port}/api/notes',
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

r = requests.post('{protocol}://{hostname}:{port}/api/notes', headers = headers)

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
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/notes', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/notes");
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
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/notes", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/notes`

This endpoint creates a new note in the workspace.
If the `stix.id` property is set, it creates a new version of an existing note.
If the `stix.id` property is not set, it creates a new note, generating a STIX id for it.

> Body parameter

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "abstract": "string",
    "content": "string",
    "authors": [
      "string"
    ],
    "object_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false
  }
}
```

<h3 id="create-a-note-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "abstract": "string",
    "content": "string",
    "authors": [
      "string"
    ],
    "object_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false
  }
}
```

<h3 id="create-a-note-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The note has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The note was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The note was not created.|None|

<h3 id="create-a-note-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» abstract|string|false|none|none|
|»»» content|string|true|none|none|
|»»» authors|[string]|false|none|none|
|»»» object_refs|[string]|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Get one or more versions of a note

<a id="opIdnote-get-one-id"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/notes/{stixId} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/notes/{stixId} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/notes/{stixId}',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/notes/{stixId}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/notes/{stixId}', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/notes/{stixId}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/notes/{stixId}");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/notes/{stixId}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/notes/{stixId}`

This endpoint gets a list of one or more versions of a note from the workspace, identified by their STIX id.

<h3 id="get-one-or-more-versions-of-a-note-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the note to retrieve|
|versions|query|string|false|The versions of the note to retrieve.|

#### Detailed descriptions

**versions**: The versions of the note to retrieve.
`all` gets all versions of the note, `latest` gets only the latest version.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "abstract": "string",
      "content": "string",
      "authors": [
        "string"
      ],
      "object_refs": [
        "string"
      ],
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false
    }
  }
]
```

<h3 id="get-one-or-more-versions-of-a-note-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of notes matching the requested STIX id.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A note with the requested STIX id was not found.|None|

<h3 id="get-one-or-more-versions-of-a-note-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» abstract|string|false|none|none|
|»»» content|string|true|none|none|
|»»» authors|[string]|false|none|none|
|»»» object_refs|[string]|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Delete a note

<a id="opIdnote-delete-version"></a>

> Code samples

```shell
# You can also use wget
curl -X DELETE {protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}

```

```http
DELETE {protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified} HTTP/1.1

```

```javascript

fetch('{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}',
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

result = RestClient.delete '{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}',
  params: {
  }

p JSON.parse(result)

```

```python
import requests

r = requests.delete('{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}')

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('DELETE','{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}");
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
    req, err := http.NewRequest("DELETE", "{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`DELETE /api/notes/{stixId}/modified/{modified}`

This endpoint deletes a single version of a note from the workspace.
The note is identified by its STIX id and modified date.

<h3 id="delete-a-note-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the note to delete|
|modified|path|string|true|modified date of the note to delete|

<h3 id="delete-a-note-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The note was successfully deleted.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A note with the requested STIX id and modified date was not found.|None|

<aside class="success">
This operation does not require authentication
</aside>

## Gets the version of a note matching the STIX id and modified date

<a id="opIdnote-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/notes/{stixId}/modified/{modified}`

This endpoint gets a single version of a note from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-note-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the note to retrieve|
|modified|path|string|true|modified date of the note to retrieve|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "abstract": "string",
    "content": "string",
    "authors": [
      "string"
    ],
    "object_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false
  }
}
```

<h3 id="gets-the-version-of-a-note-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a note matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A note with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-note-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» abstract|string|false|none|none|
|»»» content|string|true|none|none|
|»»» authors|[string]|false|none|none|
|»»» object_refs|[string]|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Update a note

<a id="opIdnote-update-version"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified} \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified} HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "abstract": "string",
    "content": "string",
    "authors": [
      "string"
    ],
    "object_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false
  }
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}',
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

result = RestClient.put '{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}',
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

r = requests.put('{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}', headers = headers)

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
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}");
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
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/notes/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/notes/{stixId}/modified/{modified}`

This endpoint updates a single version of a note in the workspace, identified by its STIX id and modified date.

> Body parameter

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "abstract": "string",
    "content": "string",
    "authors": [
      "string"
    ],
    "object_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false
  }
}
```

<h3 id="update-a-note-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the note to update|
|modified|path|string|true|modified date of the note to update|
|body|body|[#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1notes/get/responses/200/content/application~1json/schema/items)|true|none|

> Example responses

> 200 Response

```json
{
  "workspace": {
    "workflow": {
      "state": "string"
    },
    "attackId": "T9999",
    "collections": [
      {
        "collection_ref": "string",
        "collection_modified": "2019-08-24T14:15:22Z"
      }
    ]
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "abstract": "string",
    "content": "string",
    "authors": [
      "string"
    ],
    "object_refs": [
      "string"
    ],
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_deprecated": false
  }
}
```

<h3 id="update-a-note-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The note was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The note was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A note with the requested STIX id and modified date was not found.|None|

<h3 id="update-a-note-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» abstract|string|false|none|none|
|»»» content|string|true|none|none|
|»»» authors|[string]|false|none|none|
|»»» object_refs|[string]|true|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-references">References</h1>

Operations on references

## Get a list of references

<a id="opIdreference-get-all"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/references \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/references HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/references',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/references',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/references', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/references', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/references");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/references", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/references`

This endpoint gets a list of references from the workspace.

<h3 id="get-a-list-of-references-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|limit|query|number|false|The number of references to retrieve.|
|offset|query|number|false|The number of references to skip.|
|sourceName|query|string|false|source_name of the object to retrieve.|
|search|query|string|false|Only return references where the provided search text occurs in the `description` or `url`.|
|includePagination|query|boolean|false|Whether to include pagination data in the returned value.|

#### Detailed descriptions

**limit**: The number of references to retrieve.
The default (0) will retrieve all references.

**offset**: The number of references to skip.
The default (0) will start with the first reference.

**sourceName**: source_name of the object to retrieve.

**search**: Only return references where the provided search text occurs in the `description` or `url`.
The search is case-insensitive.

**includePagination**: Whether to include pagination data in the returned value.
Wraps returned objects in a larger object.

> Example responses

> 200 Response

```json
[
  {
    "source_name": "string",
    "description": "string",
    "url": "string"
  }
]
```

<h3 id="get-a-list-of-references-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of references.|Inline|

<h3 id="get-a-list-of-references-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1references/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1references/get/responses/200/content/application~1json/schema/items)]|false|none|none|
|» source_name|string|true|none|none|
|» description|string|true|none|none|
|» url|string|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Create a reference

<a id="opIdreference-create"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/references \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/references HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "source_name": "string",
  "description": "string",
  "url": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/references',
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

result = RestClient.post '{protocol}://{hostname}:{port}/api/references',
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

r = requests.post('{protocol}://{hostname}:{port}/api/references', headers = headers)

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
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/references', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/references");
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
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/references", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/references`

This endpoint creates a new reference in the workspace.

> Body parameter

```json
{
  "source_name": "string",
  "description": "string",
  "url": "string"
}
```

<h3 id="create-a-reference-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1references/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1references/get/responses/200/content/application~1json/schema/items)|true|none|

> Example responses

> 201 Response

```json
{
  "source_name": "string",
  "description": "string",
  "url": "string"
}
```

<h3 id="create-a-reference-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The reference has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The reference was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `source_name`. The reference was not created.|None|

<h3 id="create-a-reference-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» source_name|string|true|none|none|
|» description|string|true|none|none|
|» url|string|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Update a reference

<a id="opIdreference-update"></a>

> Code samples

```shell
# You can also use wget
curl -X PUT {protocol}://{hostname}:{port}/api/references \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json'

```

```http
PUT {protocol}://{hostname}:{port}/api/references HTTP/1.1

Content-Type: application/json
Accept: application/json

```

```javascript
const inputBody = '{
  "source_name": "string",
  "description": "string",
  "url": "string"
}';
const headers = {
  'Content-Type':'application/json',
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/references',
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

result = RestClient.put '{protocol}://{hostname}:{port}/api/references',
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

r = requests.put('{protocol}://{hostname}:{port}/api/references', headers = headers)

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
    $response = $client->request('PUT','{protocol}://{hostname}:{port}/api/references', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/references");
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
    req, err := http.NewRequest("PUT", "{protocol}://{hostname}:{port}/api/references", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`PUT /api/references`

This endpoint updates a single version of a reference in the workspace, identified by its `source_name`.
Note that the `source_name` is used a a key and cannot be changed.

> Body parameter

```json
{
  "source_name": "string",
  "description": "string",
  "url": "string"
}
```

<h3 id="update-a-reference-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1references/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1references/get/responses/200/content/application~1json/schema/items)|true|none|

> Example responses

> 200 Response

```json
{
  "source_name": "string",
  "description": "string",
  "url": "string"
}
```

<h3 id="update-a-reference-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The reference was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The reference was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A reference with the requested source_name was not found.|None|

<h3 id="update-a-reference-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» source_name|string|true|none|none|
|» description|string|true|none|none|
|» url|string|false|none|none|

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
[
  {
    "collection_index": {
      "id": "string",
      "name": "string",
      "description": "string",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "collections": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "created": "2019-08-24T14:15:22Z",
          "versions": [
            {
              "version": "string",
              "modified": "2019-08-24T14:15:22Z",
              "url": "string",
              "taxii_url": "string",
              "release_notes": "string"
            }
          ]
        }
      ]
    },
    "workspace": {
      "remote_url": "string",
      "update_policy": {
        "automatic": true,
        "interval": 0,
        "last_retrieval": "2019-08-24T14:15:22Z",
        "subscriptions": [
          "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
        ]
      }
    }
  }
]
```

<h3 id="get-a-list-of-collection-indexes-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of collection indexes.|Inline|

<h3 id="get-a-list-of-collection-indexes-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items)]|false|none|none|
|» collection_index|object|true|none|none|
|»» id|string|true|none|none|
|»» name|string|true|none|none|
|»» description|string|false|none|none|
|»» created|string(date-time)|true|none|none|
|»» modified|string(date-time)|true|none|none|
|»» collections|[object]|true|none|none|
|»»» id|string|true|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» versions|[object]|true|none|none|
|»»»» version|string|true|none|none|
|»»»» modified|string(date-time)|true|none|none|
|»»»» url|string|false|none|none|
|»»»» taxii_url|string|false|none|none|
|»»»» release_notes|string|false|none|none|
|» workspace|object|false|none|none|
|»» remote_url|string|false|none|none|
|»» update_policy|object|false|none|none|
|»»» automatic|boolean|false|none|none|
|»»» interval|number|false|none|none|
|»»» last_retrieval|string(date-time)|false|none|none|
|»»» subscriptions|[string]|false|none|none|

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
const inputBody = '{
  "collection_index": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "collections": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "created": "2019-08-24T14:15:22Z",
        "versions": [
          {
            "version": "string",
            "modified": "2019-08-24T14:15:22Z",
            "url": "string",
            "taxii_url": "string",
            "release_notes": "string"
          }
        ]
      }
    ]
  },
  "workspace": {
    "remote_url": "string",
    "update_policy": {
      "automatic": true,
      "interval": 0,
      "last_retrieval": "2019-08-24T14:15:22Z",
      "subscriptions": [
        "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
      ]
    }
  }
}';
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
{
  "collection_index": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "collections": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "created": "2019-08-24T14:15:22Z",
        "versions": [
          {
            "version": "string",
            "modified": "2019-08-24T14:15:22Z",
            "url": "string",
            "taxii_url": "string",
            "release_notes": "string"
          }
        ]
      }
    ]
  },
  "workspace": {
    "remote_url": "string",
    "update_policy": {
      "automatic": true,
      "interval": 0,
      "last_retrieval": "2019-08-24T14:15:22Z",
      "subscriptions": [
        "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
      ]
    }
  }
}
```

<h3 id="create-a-collection-index-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items)|true|none|

> Example responses

> 201 Response

```json
{
  "collection_index": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "collections": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "created": "2019-08-24T14:15:22Z",
        "versions": [
          {
            "version": "string",
            "modified": "2019-08-24T14:15:22Z",
            "url": "string",
            "taxii_url": "string",
            "release_notes": "string"
          }
        ]
      }
    ]
  },
  "workspace": {
    "remote_url": "string",
    "update_policy": {
      "automatic": true,
      "interval": 0,
      "last_retrieval": "2019-08-24T14:15:22Z",
      "subscriptions": [
        "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
      ]
    }
  }
}
```

<h3 id="create-a-collection-index-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The collection index has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The collection index was not created.|None|

<h3 id="create-a-collection-index-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» collection_index|object|true|none|none|
|»» id|string|true|none|none|
|»» name|string|true|none|none|
|»» description|string|false|none|none|
|»» created|string(date-time)|true|none|none|
|»» modified|string(date-time)|true|none|none|
|»» collections|[object]|true|none|none|
|»»» id|string|true|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» versions|[object]|true|none|none|
|»»»» version|string|true|none|none|
|»»»» modified|string(date-time)|true|none|none|
|»»»» url|string|false|none|none|
|»»»» taxii_url|string|false|none|none|
|»»»» release_notes|string|false|none|none|
|» workspace|object|false|none|none|
|»» remote_url|string|false|none|none|
|»» update_policy|object|false|none|none|
|»»» automatic|boolean|false|none|none|
|»»» interval|number|false|none|none|
|»»» last_retrieval|string(date-time)|false|none|none|
|»»» subscriptions|[string]|false|none|none|

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
[
  {
    "collection_index": {
      "id": "string",
      "name": "string",
      "description": "string",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "collections": [
        {
          "id": "string",
          "name": "string",
          "description": "string",
          "created": "2019-08-24T14:15:22Z",
          "versions": [
            {
              "version": "string",
              "modified": "2019-08-24T14:15:22Z",
              "url": "string",
              "taxii_url": "string",
              "release_notes": "string"
            }
          ]
        }
      ]
    },
    "workspace": {
      "remote_url": "string",
      "update_policy": {
        "automatic": true,
        "interval": 0,
        "last_retrieval": "2019-08-24T14:15:22Z",
        "subscriptions": [
          "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
        ]
      }
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items)]|false|none|none|
|» collection_index|object|true|none|none|
|»» id|string|true|none|none|
|»» name|string|true|none|none|
|»» description|string|false|none|none|
|»» created|string(date-time)|true|none|none|
|»» modified|string(date-time)|true|none|none|
|»» collections|[object]|true|none|none|
|»»» id|string|true|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» versions|[object]|true|none|none|
|»»»» version|string|true|none|none|
|»»»» modified|string(date-time)|true|none|none|
|»»»» url|string|false|none|none|
|»»»» taxii_url|string|false|none|none|
|»»»» release_notes|string|false|none|none|
|» workspace|object|false|none|none|
|»» remote_url|string|false|none|none|
|»» update_policy|object|false|none|none|
|»»» automatic|boolean|false|none|none|
|»»» interval|number|false|none|none|
|»»» last_retrieval|string(date-time)|false|none|none|
|»»» subscriptions|[string]|false|none|none|

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
const inputBody = '{
  "collection_index": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "collections": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "created": "2019-08-24T14:15:22Z",
        "versions": [
          {
            "version": "string",
            "modified": "2019-08-24T14:15:22Z",
            "url": "string",
            "taxii_url": "string",
            "release_notes": "string"
          }
        ]
      }
    ]
  },
  "workspace": {
    "remote_url": "string",
    "update_policy": {
      "automatic": true,
      "interval": 0,
      "last_retrieval": "2019-08-24T14:15:22Z",
      "subscriptions": [
        "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
      ]
    }
  }
}';
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
{
  "collection_index": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "collections": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "created": "2019-08-24T14:15:22Z",
        "versions": [
          {
            "version": "string",
            "modified": "2019-08-24T14:15:22Z",
            "url": "string",
            "taxii_url": "string",
            "release_notes": "string"
          }
        ]
      }
    ]
  },
  "workspace": {
    "remote_url": "string",
    "update_policy": {
      "automatic": true,
      "interval": 0,
      "last_retrieval": "2019-08-24T14:15:22Z",
      "subscriptions": [
        "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
      ]
    }
  }
}
```

<h3 id="update-a-collection-index-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|id|path|string|true|id of the collection index to update|
|body|body|[#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items](#schema#/paths/~1api~1collection-indexes/get/responses/200/content/application~1json/schema/items)|true|none|

> Example responses

> 200 Response

```json
{
  "collection_index": {
    "id": "string",
    "name": "string",
    "description": "string",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "collections": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "created": "2019-08-24T14:15:22Z",
        "versions": [
          {
            "version": "string",
            "modified": "2019-08-24T14:15:22Z",
            "url": "string",
            "taxii_url": "string",
            "release_notes": "string"
          }
        ]
      }
    ]
  },
  "workspace": {
    "remote_url": "string",
    "update_policy": {
      "automatic": true,
      "interval": 0,
      "last_retrieval": "2019-08-24T14:15:22Z",
      "subscriptions": [
        "x-mitre-collection--915b6504-bde8-40b5-bfda-0c3ecb46a9b9"
      ]
    }
  }
}
```

<h3 id="update-a-collection-index-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The collection index was updated.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The collection index was not updated.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A collection index with the requested id was not found.|None|

<h3 id="update-a-collection-index-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» collection_index|object|true|none|none|
|»» id|string|true|none|none|
|»» name|string|true|none|none|
|»» description|string|false|none|none|
|»» created|string(date-time)|true|none|none|
|»» modified|string(date-time)|true|none|none|
|»» collections|[object]|true|none|none|
|»»» id|string|true|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» versions|[object]|true|none|none|
|»»»» version|string|true|none|none|
|»»»» modified|string(date-time)|true|none|none|
|»»»» url|string|false|none|none|
|»»»» taxii_url|string|false|none|none|
|»»»» release_notes|string|false|none|none|
|» workspace|object|false|none|none|
|»» remote_url|string|false|none|none|
|»» update_policy|object|false|none|none|
|»»» automatic|boolean|false|none|none|
|»»» interval|number|false|none|none|
|»»» last_retrieval|string(date-time)|false|none|none|
|»»» subscriptions|[string]|false|none|none|

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
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|
|search|query|string|false|Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.|

#### Detailed descriptions

**limit**: The number of collections to retrieve.
The default (0) will retrieve all collections.

**offset**: The number of collections to skip.
The default (0) will start with the first collection.

**versions**: The versions of the collections to retrieve.
`all` gets all versions of all the collections, `latest` gets only the latest version of each collection.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

**search**: Only return ATT&CK objects where the provided search text occurs in the `name` or `description`.
The search is case-insensitive.

#### Enumerated Values

|Parameter|Value|
|---|---|
|versions|all|
|versions|latest|

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "imported": "2019-08-24T14:15:22Z",
      "import_categories": {
        "additions": [
          "string"
        ],
        "changes": [
          "string"
        ],
        "minor_changes": [
          "string"
        ],
        "revocations": [
          "string"
        ],
        "deprecations": [
          "string"
        ],
        "supersedes_user_edits": [
          "string"
        ],
        "supersedes_collection_changes": [
          "string"
        ],
        "duplicates": [
          "string"
        ],
        "out_of_date": [
          "string"
        ],
        "errors": [
          {
            "object_ref": "string",
            "object_modified": "string",
            "error_type": "string",
            "error_message": "string"
          }
        ]
      },
      "workflow": {
        "state": "string",
        "release": true
      }
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Enterprise ATT&CK",
      "description": "string",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_contents": [
        {
          "object_ref": "string",
          "object_modified": "string"
        }
      ],
      "x_mitre_deprecated": false,
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-a-list-of-collections-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of collections.|Inline|

<h3 id="get-a-list-of-collections-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0)]|false|none|none|
|» workspace|object|true|none|none|
|»» imported|string(date-time)|false|none|none|
|»» import_categories|object|false|none|none|
|»»» additions|[string]|false|none|none|
|»»» changes|[string]|false|none|none|
|»»» minor_changes|[string]|false|none|none|
|»»» revocations|[string]|false|none|none|
|»»» deprecations|[string]|false|none|none|
|»»» supersedes_user_edits|[string]|false|none|none|
|»»» supersedes_collection_changes|[string]|false|none|none|
|»»» duplicates|[string]|false|none|none|
|»»» out_of_date|[string]|false|none|none|
|»»» errors|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|false|none|none|
|»»»» error_type|string|true|none|none|
|»»»» error_message|string|false|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»»» release|boolean|false|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contents|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|true|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
const inputBody = '{
  "workspace": {
    "imported": "2019-08-24T14:15:22Z",
    "import_categories": {
      "additions": [
        "string"
      ],
      "changes": [
        "string"
      ],
      "minor_changes": [
        "string"
      ],
      "revocations": [
        "string"
      ],
      "deprecations": [
        "string"
      ],
      "supersedes_user_edits": [
        "string"
      ],
      "supersedes_collection_changes": [
        "string"
      ],
      "duplicates": [
        "string"
      ],
      "out_of_date": [
        "string"
      ],
      "errors": [
        {
          "object_ref": "string",
          "object_modified": "string",
          "error_type": "string",
          "error_message": "string"
        }
      ]
    },
    "workflow": {
      "state": "string",
      "release": true
    }
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Enterprise ATT&CK",
    "description": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contents": [
      {
        "object_ref": "string",
        "object_modified": "string"
      }
    ],
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}';
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
{
  "workspace": {
    "imported": "2019-08-24T14:15:22Z",
    "import_categories": {
      "additions": [
        "string"
      ],
      "changes": [
        "string"
      ],
      "minor_changes": [
        "string"
      ],
      "revocations": [
        "string"
      ],
      "deprecations": [
        "string"
      ],
      "supersedes_user_edits": [
        "string"
      ],
      "supersedes_collection_changes": [
        "string"
      ],
      "duplicates": [
        "string"
      ],
      "out_of_date": [
        "string"
      ],
      "errors": [
        {
          "object_ref": "string",
          "object_modified": "string",
          "error_type": "string",
          "error_message": "string"
        }
      ]
    },
    "workflow": {
      "state": "string",
      "release": true
    }
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Enterprise ATT&CK",
    "description": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contents": [
      {
        "object_ref": "string",
        "object_modified": "string"
      }
    ],
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-collection-(x-mitre-collection)-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0)|true|none|

> Example responses

> 201 Response

```json
{
  "workspace": {
    "imported": "2019-08-24T14:15:22Z",
    "import_categories": {
      "additions": [
        "string"
      ],
      "changes": [
        "string"
      ],
      "minor_changes": [
        "string"
      ],
      "revocations": [
        "string"
      ],
      "deprecations": [
        "string"
      ],
      "supersedes_user_edits": [
        "string"
      ],
      "supersedes_collection_changes": [
        "string"
      ],
      "duplicates": [
        "string"
      ],
      "out_of_date": [
        "string"
      ],
      "errors": [
        {
          "object_ref": "string",
          "object_modified": "string",
          "error_type": "string",
          "error_message": "string"
        }
      ]
    },
    "workflow": {
      "state": "string",
      "release": true
    }
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Enterprise ATT&CK",
    "description": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contents": [
      {
        "object_ref": "string",
        "object_modified": "string"
      }
    ],
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="create-a-collection-(x-mitre-collection)-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The collection has been successfully created.|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The collection was not created.|None|
|409|[Conflict](https://tools.ietf.org/html/rfc7231#section-6.5.8)|Duplicate `stix.id` and `stix.modified` properties. The collection was not created.|None|

<h3 id="create-a-collection-(x-mitre-collection)-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|object|true|none|none|
|»» imported|string(date-time)|false|none|none|
|»» import_categories|object|false|none|none|
|»»» additions|[string]|false|none|none|
|»»» changes|[string]|false|none|none|
|»»» minor_changes|[string]|false|none|none|
|»»» revocations|[string]|false|none|none|
|»»» deprecations|[string]|false|none|none|
|»»» supersedes_user_edits|[string]|false|none|none|
|»»» supersedes_collection_changes|[string]|false|none|none|
|»»» duplicates|[string]|false|none|none|
|»»» out_of_date|[string]|false|none|none|
|»»» errors|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|false|none|none|
|»»»» error_type|string|true|none|none|
|»»»» error_message|string|false|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»»» release|boolean|false|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contents|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|true|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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
[
  {
    "workspace": {
      "imported": "2019-08-24T14:15:22Z",
      "import_categories": {
        "additions": [
          "string"
        ],
        "changes": [
          "string"
        ],
        "minor_changes": [
          "string"
        ],
        "revocations": [
          "string"
        ],
        "deprecations": [
          "string"
        ],
        "supersedes_user_edits": [
          "string"
        ],
        "supersedes_collection_changes": [
          "string"
        ],
        "duplicates": [
          "string"
        ],
        "out_of_date": [
          "string"
        ],
        "errors": [
          {
            "object_ref": "string",
            "object_modified": "string",
            "error_type": "string",
            "error_message": "string"
          }
        ]
      },
      "workflow": {
        "state": "string",
        "release": true
      }
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "Enterprise ATT&CK",
      "description": "string",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_contents": [
        {
          "object_ref": "string",
          "object_modified": "string"
        }
      ],
      "x_mitre_deprecated": false,
      "x_mitre_version": "1.0"
    }
  }
]
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
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0)]|false|none|none|
|» workspace|object|true|none|none|
|»» imported|string(date-time)|false|none|none|
|»» import_categories|object|false|none|none|
|»»» additions|[string]|false|none|none|
|»»» changes|[string]|false|none|none|
|»»» minor_changes|[string]|false|none|none|
|»»» revocations|[string]|false|none|none|
|»»» deprecations|[string]|false|none|none|
|»»» supersedes_user_edits|[string]|false|none|none|
|»»» supersedes_collection_changes|[string]|false|none|none|
|»»» duplicates|[string]|false|none|none|
|»»» out_of_date|[string]|false|none|none|
|»»» errors|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|false|none|none|
|»»»» error_type|string|true|none|none|
|»»»» error_message|string|false|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»»» release|boolean|false|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contents|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|true|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

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

## Gets the version of a collection matching the STIX id and modified date

<a id="opIdcollection-get-by-id-and-modified"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified} \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified} HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified}',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified}',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified}', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified}', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified}");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/collections/{stixId}/modified/{modified}", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/collections/{stixId}/modified/{modified}`

This endpoint gets a single version of a collection from the workspace, identified by its STIX id and modified date.

<h3 id="gets-the-version-of-a-collection-matching-the-stix-id-and-modified-date-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|stixId|path|string|true|STIX id of the collection to retrieve|
|modified|path|string|true|modified date of the collection to retrieve|
|retrieveContents|query|boolean|false|Retrieve the objects that are referenced by the collection|

#### Detailed descriptions

**retrieveContents**: Retrieve the objects that are referenced by the collection

> Example responses

> 200 Response

```json
{
  "workspace": {
    "imported": "2019-08-24T14:15:22Z",
    "import_categories": {
      "additions": [
        "string"
      ],
      "changes": [
        "string"
      ],
      "minor_changes": [
        "string"
      ],
      "revocations": [
        "string"
      ],
      "deprecations": [
        "string"
      ],
      "supersedes_user_edits": [
        "string"
      ],
      "supersedes_collection_changes": [
        "string"
      ],
      "duplicates": [
        "string"
      ],
      "out_of_date": [
        "string"
      ],
      "errors": [
        {
          "object_ref": "string",
          "object_modified": "string",
          "error_type": "string",
          "error_message": "string"
        }
      ]
    },
    "workflow": {
      "state": "string",
      "release": true
    }
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Enterprise ATT&CK",
    "description": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contents": [
      {
        "object_ref": "string",
        "object_modified": "string"
      }
    ],
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="gets-the-version-of-a-collection-matching-the-stix-id-and-modified-date-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|The version of a collection matching the STIX id and modified date.|Inline|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|A collection with the requested STIX id and modified date was not found.|None|

<h3 id="gets-the-version-of-a-collection-matching-the-stix-id-and-modified-date-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|object|true|none|none|
|»» imported|string(date-time)|false|none|none|
|»» import_categories|object|false|none|none|
|»»» additions|[string]|false|none|none|
|»»» changes|[string]|false|none|none|
|»»» minor_changes|[string]|false|none|none|
|»»» revocations|[string]|false|none|none|
|»»» deprecations|[string]|false|none|none|
|»»» supersedes_user_edits|[string]|false|none|none|
|»»» supersedes_collection_changes|[string]|false|none|none|
|»»» duplicates|[string]|false|none|none|
|»»» out_of_date|[string]|false|none|none|
|»»» errors|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|false|none|none|
|»»»» error_type|string|true|none|none|
|»»»» error_message|string|false|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»»» release|boolean|false|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contents|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|true|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-collection-bundles">Collection Bundles</h1>

Operations on collection bundles

## Export a collection bundle

<a id="opIdcollection-bundle-export"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/collection-bundles \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/collection-bundles HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/collection-bundles',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/collection-bundles',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/collection-bundles', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/collection-bundles', array(
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/collection-bundles", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/collection-bundles`

This endpoint exports a collection bundle and returns the bundle.

<h3 id="export-a-collection-bundle-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|previewOnly|query|boolean|false|Return the bundle but do not mark the collection as exported.|
|collectionId|query|string|false|The STIX id of the collection to export.|
|collectionModified|query|string|false|The modified date of the collection to export.|

#### Detailed descriptions

**previewOnly**: Return the bundle but do not mark the collection as exported.

**collectionId**: The STIX id of the collection to export.

**collectionModified**: The modified date of the collection to export.
collectionId must be provided if collectionModified is provided.

> Example responses

> 200 Response

```json
{
  "id": "bundle--0cde353c-ea5b-4668-9f68-971946609282",
  "type": "string",
  "objects": [
    {}
  ]
}
```

<h3 id="export-a-collection-bundle-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|An exported collection bundle.|Inline|

<h3 id="export-a-collection-bundle-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» type|string|true|none|none|
|» objects|[object]|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

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
const inputBody = '{
  "id": "bundle--0cde353c-ea5b-4668-9f68-971946609282",
  "type": "string",
  "objects": [
    {}
  ]
}';
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
{
  "id": "bundle--0cde353c-ea5b-4668-9f68-971946609282",
  "type": "string",
  "objects": [
    {}
  ]
}
```

<h3 id="import-a-collection-bundle-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|previewOnly|query|boolean|false|Do not import the collection.|
|checkOnly|query|boolean|false|Replaced by previewOnly|
|body|body|[#/paths/~1api~1collection-bundles/get/responses/200/content/application~1json/schema](#schema#/paths/~1api~1collection-bundles/get/responses/200/content/application~1json/schema)|true|none|

#### Detailed descriptions

**previewOnly**: Do not import the collection.
Only determine what the results of the import would be if it were performed.

**checkOnly**: Replaced by previewOnly

> Example responses

> 201 Response

```json
{
  "workspace": {
    "imported": "2019-08-24T14:15:22Z",
    "import_categories": {
      "additions": [
        "string"
      ],
      "changes": [
        "string"
      ],
      "minor_changes": [
        "string"
      ],
      "revocations": [
        "string"
      ],
      "deprecations": [
        "string"
      ],
      "supersedes_user_edits": [
        "string"
      ],
      "supersedes_collection_changes": [
        "string"
      ],
      "duplicates": [
        "string"
      ],
      "out_of_date": [
        "string"
      ],
      "errors": [
        {
          "object_ref": "string",
          "object_modified": "string",
          "error_type": "string",
          "error_message": "string"
        }
      ]
    },
    "workflow": {
      "state": "string",
      "release": true
    }
  },
  "stix": {
    "type": "attack-pattern",
    "spec_version": "2.1",
    "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
    "created": "2019-08-24T14:15:22Z",
    "modified": "2019-08-24T14:15:22Z",
    "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "revoked": false,
    "external_references": [
      {
        "source_name": "mitre-attack",
        "description": "string",
        "url": "string",
        "external_id": "string"
      }
    ],
    "object_marking_refs": [
      "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
    ],
    "name": "Enterprise ATT&CK",
    "description": "string",
    "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
    "x_mitre_contents": [
      {
        "object_ref": "string",
        "object_modified": "string"
      }
    ],
    "x_mitre_deprecated": false,
    "x_mitre_version": "1.0"
  }
}
```

<h3 id="import-a-collection-bundle-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|The collection has been successfully imported.|Inline|

<h3 id="import-a-collection-bundle-responseschema">Response Schema</h3>

Status Code **201**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» workspace|object|true|none|none|
|»» imported|string(date-time)|false|none|none|
|»» import_categories|object|false|none|none|
|»»» additions|[string]|false|none|none|
|»»» changes|[string]|false|none|none|
|»»» minor_changes|[string]|false|none|none|
|»»» revocations|[string]|false|none|none|
|»»» deprecations|[string]|false|none|none|
|»»» supersedes_user_edits|[string]|false|none|none|
|»»» supersedes_collection_changes|[string]|false|none|none|
|»»» duplicates|[string]|false|none|none|
|»»» out_of_date|[string]|false|none|none|
|»»» errors|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|false|none|none|
|»»»» error_type|string|true|none|none|
|»»»» error_message|string|false|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»»» release|boolean|false|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_contents|[object]|false|none|none|
|»»»» object_ref|string|true|none|none|
|»»»» object_modified|string|true|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-stix-bundles">STIX Bundles</h1>

Operations on STIX bundles

## Export a stix bundle

<a id="opIdstix-bundle-export"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/stix-bundles \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/stix-bundles HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/stix-bundles',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/stix-bundles',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/stix-bundles', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/stix-bundles', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/stix-bundles");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/stix-bundles", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/stix-bundles`

This endpoint exports a STIX bundle and returns the bundle.
This endpoint is distinguished from exporting a collection bundle by being based on a selected domain, instead of a collection object.
Also, the returned STIX bundle will not contain a collection object.

<h3 id="export-a-stix-bundle-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|domain|query|string|false|The domain to export.|
|state|query|any|false|State of the object in the editing workflow.|
|includeRevoked|query|boolean|false|Whether to include objects that have the `revoked` property set to true.|
|includeDeprecated|query|boolean|false|Whether to include objects that have the `x_mitre_deprecated` property set to true.|

#### Detailed descriptions

**domain**: The domain to export.

**state**: State of the object in the editing workflow.
If this parameter is not set, objects will be retrieved regardless of state.
This parameter may be set multiple times to retrieve objects with any of the provided states.

**includeRevoked**: Whether to include objects that have the `revoked` property set to true.

**includeDeprecated**: Whether to include objects that have the `x_mitre_deprecated` property set to true.

> Example responses

> 200 Response

```json
[
  {
    "id": "bundle--0cde353c-ea5b-4668-9f68-971946609282",
    "type": "string",
    "spec_version": "2.1",
    "objects": [
      {}
    ]
  }
]
```

<h3 id="export-a-stix-bundle-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|An exported stix bundle.|Inline|

<h3 id="export-a-stix-bundle-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» id|string|true|none|none|
|» type|string|true|none|none|
|» spec_version|string|true|none|none|
|» objects|[object]|true|none|none|

<aside class="success">
This operation does not require authentication
</aside>

<h1 id="att-and-ck-workbench-rest-api-system-configuration">System Configuration</h1>

Operations on the system configuration

## Get the list of domain-specific allowed values

<a id="opIdconfig-get-allowed-values"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/config/allowed-values \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/config/allowed-values HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/config/allowed-values',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/config/allowed-values',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/config/allowed-values', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/config/allowed-values', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/config/allowed-values");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/config/allowed-values", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/config/allowed-values`

This endpoint gets a list of domain-specific allowed values for certain properties.

> Example responses

> 200 Response

```json
[
  {
    "objectType": "technique",
    "properties": [
      {
        "propertyName": "x_mitre_platforms",
        "domains": [
          {
            "domainName": "enterprise-attack",
            "allowedValues": [
              "Linux"
            ]
          }
        ]
      }
    ]
  }
]
```

<h3 id="get-the-list-of-domain-specific-allowed-values-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|A list of allowed values.|Inline|

<h3 id="get-the-list-of-domain-specific-allowed-values-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|» objectType|string|false|none|none|
|» properties|[object]|false|none|none|
|»» propertyName|string|false|none|none|
|»» domains|[object]|false|none|none|
|»»» domainName|string|false|none|none|
|»»» allowedValues|[string]|false|none|none|

<aside class="success">
This operation does not require authentication
</aside>

## Get the designated organization identity

<a id="opIdconfig-get-organization-identity"></a>

> Code samples

```shell
# You can also use wget
curl -X GET {protocol}://{hostname}:{port}/api/config/organization-identity \
  -H 'Accept: application/json'

```

```http
GET {protocol}://{hostname}:{port}/api/config/organization-identity HTTP/1.1

Accept: application/json

```

```javascript

const headers = {
  'Accept':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/config/organization-identity',
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

result = RestClient.get '{protocol}://{hostname}:{port}/api/config/organization-identity',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Accept': 'application/json'
}

r = requests.get('{protocol}://{hostname}:{port}/api/config/organization-identity', headers = headers)

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
    $response = $client->request('GET','{protocol}://{hostname}:{port}/api/config/organization-identity', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/config/organization-identity");
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
    req, err := http.NewRequest("GET", "{protocol}://{hostname}:{port}/api/config/organization-identity", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`GET /api/config/organization-identity`

This endpoint gets the organization identity object for the system.

> Example responses

> 200 Response

```json
[
  {
    "workspace": {
      "workflow": {
        "state": "string"
      },
      "attackId": "T9999",
      "collections": [
        {
          "collection_ref": "string",
          "collection_modified": "2019-08-24T14:15:22Z"
        }
      ]
    },
    "stix": {
      "type": "attack-pattern",
      "spec_version": "2.1",
      "id": "attack-pattern--76abfbed-a92f-4e2a-953e-dc83f90ecddc",
      "created": "2019-08-24T14:15:22Z",
      "modified": "2019-08-24T14:15:22Z",
      "created_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "revoked": false,
      "external_references": [
        {
          "source_name": "mitre-attack",
          "description": "string",
          "url": "string",
          "external_id": "string"
        }
      ],
      "object_marking_refs": [
        "marking-definition--fa42a846-8d90-4e51-bc29-71d5b4802168"
      ],
      "name": "The MITRE Corporation",
      "description": "This is an identity",
      "roles": [
        "string"
      ],
      "identity_class": "organization",
      "sectors": [
        "string"
      ],
      "contact_information": "string",
      "x_mitre_modified_by_ref": "identity--6444f546-6900-4456-b3b1-015c88d70dab",
      "x_mitre_deprecated": false,
      "x_mitre_version": "1.0"
    }
  }
]
```

<h3 id="get-the-designated-organization-identity-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|An identity object.|Inline|

<h3 id="get-the-designated-organization-identity-responseschema">Response Schema</h3>

Status Code **200**

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|*anonymous*|[[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/2](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/2)]|false|none|none|
|» workspace|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/1/properties/workspace](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/1/properties/workspace)|true|none|none|
|»» workflow|object|false|none|none|
|»»» state|string|false|none|none|
|»» attackId|string|false|none|none|
|»» collections|[object]|false|none|none|
|»»» collection_ref|string|true|none|none|
|»»» collection_modified|string(date-time)|true|none|none|
|» stix|any|true|none|none|

*allOf*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|[#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyOf/0/properties/stix/allOf/0](#schema#/paths/~1api~1attack-objects/get/responses/200/content/application~1json/schema/items/anyof/0/properties/stix/allof/0)|false|none|none|
|»»» type|string|true|none|none|
|»»» spec_version|string|true|none|none|
|»»» id|string|false|none|none|
|»»» created|string(date-time)|true|none|none|
|»»» modified|string(date-time)|true|none|none|
|»»» created_by_ref|string|false|none|none|
|»»» revoked|boolean|false|none|none|
|»»» external_references|[object]|false|none|none|
|»»»» source_name|string|true|none|none|
|»»»» description|string|false|none|none|
|»»»» url|string|false|none|none|
|»»»» external_id|string|false|none|none|
|»»» object_marking_refs|[string]|false|none|none|

*and*

|Name|Type|Required|Restrictions|Description|
|---|---|---|---|---|
|»» *anonymous*|object|false|none|none|
|»»» name|string|true|none|none|
|»»» description|string|false|none|none|
|»»» roles|[string]|false|none|none|
|»»» identity_class|string|false|none|none|
|»»» sectors|[string]|false|none|none|
|»»» contact_information|string|false|none|none|
|»»» x_mitre_modified_by_ref|string|false|none|none|
|»»» x_mitre_deprecated|boolean|false|none|none|
|»»» x_mitre_version|string|false|none|none|

#### Enumerated Values

|Property|Value|
|---|---|
|type|attack-pattern|
|type|x-mitre-tactic|
|type|intrusion-set|
|type|tool|
|type|malware|
|type|course-of-action|
|type|x-mitre-matrix|
|type|identity|
|type|relationship|
|type|note|
|type|x-mitre-collection|

<aside class="success">
This operation does not require authentication
</aside>

## Set the designated organization identity

<a id="opIdconfig-set-organization-identity"></a>

> Code samples

```shell
# You can also use wget
curl -X POST {protocol}://{hostname}:{port}/api/config/organization-identity \
  -H 'Content-Type: application/json'

```

```http
POST {protocol}://{hostname}:{port}/api/config/organization-identity HTTP/1.1

Content-Type: application/json

```

```javascript
const inputBody = '{
  "id": "identity--76abfbed-a92f-4e2a-953e-dc83f90ecddc"
}';
const headers = {
  'Content-Type':'application/json'
};

fetch('{protocol}://{hostname}:{port}/api/config/organization-identity',
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
  'Content-Type' => 'application/json'
}

result = RestClient.post '{protocol}://{hostname}:{port}/api/config/organization-identity',
  params: {
  }, headers: headers

p JSON.parse(result)

```

```python
import requests
headers = {
  'Content-Type': 'application/json'
}

r = requests.post('{protocol}://{hostname}:{port}/api/config/organization-identity', headers = headers)

print(r.json())

```

```php
<?php

require 'vendor/autoload.php';

$headers = array(
    'Content-Type' => 'application/json',
);

$client = new \GuzzleHttp\Client();

// Define array of request body.
$request_body = array();

try {
    $response = $client->request('POST','{protocol}://{hostname}:{port}/api/config/organization-identity', array(
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
URL obj = new URL("{protocol}://{hostname}:{port}/api/config/organization-identity");
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
    }

    data := bytes.NewBuffer([]byte{jsonReq})
    req, err := http.NewRequest("POST", "{protocol}://{hostname}:{port}/api/config/organization-identity", data)
    req.Header = headers

    client := &http.Client{}
    resp, err := client.Do(req)
    // ...
}

```

`POST /api/config/organization-identity`

This endpoint sets the organization identity for the system.
The identity object must already exist.

> Body parameter

```json
{
  "id": "identity--76abfbed-a92f-4e2a-953e-dc83f90ecddc"
}
```

<h3 id="set-the-designated-organization-identity-parameters">Parameters</h3>

|Name|In|Type|Required|Description|
|---|---|---|---|---|
|body|body|object|true|none|
|» id|body|string|false|none|

<h3 id="set-the-designated-organization-identity-responses">Responses</h3>

|Status|Meaning|Description|Schema|
|---|---|---|---|
|204|[No Content](https://tools.ietf.org/html/rfc7231#section-6.3.5)|The organization identity has been successfully set.|None|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Missing or invalid parameters were provided. The organization identity was not set.|None|
|404|[Not Found](https://tools.ietf.org/html/rfc7231#section-6.5.4)|The identity could not be found. The organization identity was not set.|None|

<aside class="success">
This operation does not require authentication
</aside>

