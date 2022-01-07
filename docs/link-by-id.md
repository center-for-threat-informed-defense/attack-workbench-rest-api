
## Object Format in the Database

Object containing the LinkById to another object:

```js
{
    stix: {
        name: 'Initial Object'
        description: 'This is a reference to another object (LinkById: S0565).'
        external_references: [
            {
                source_name: 'mitre-attack',
                url: 'https://attack.mitre.org/techniques/T9901',
                external_id: 'T9901'
            },
            {
                source_name: 'S0565',
                url: 'https://attack.mitre.org/software/S0565',
                description: 'Referenced Object'
            }
        ]
    }
}
```

The object referenced by the first object:

```js
{
    stix: {
        name: 'Referenced Object'
        description: 'This is another object.'
        external_references: [
            {
                source_name: 'mitre-attack',
                url: 'https://attack.mitre.org/software/S0565',
                external_id: 'S0565'
            }
        ]
    }
}
```

The frontend code will read and write objects using this format.

External references added to support the LinkById must NOT be added to the full list of references maintained in the database.

## Exporting Objects

The object containing the LinkById to another object will be modified when exported.
These fields will be checked for a LinkById marker:
- description
- ... (tbd)

Each occurrence of "(LinkById: _ref_)" will be replaced by a link to the referenced object using the format `[extref.description](extref.url)`, using the external_reference element where the `extref.source_name` matches the _ref_ in the LinkById.

```js
{
    stix: {
        name: 'Initial Object'
        description: 'This is a reference to another object [Referenced Object](https://attack.mitre.org/software/S0565).'
        external_references: [
            {
                source_name: 'mitre-attack',
                url: 'https://attack.mitre.org/techniques/T9901',
                external_id: 'T9901'
            },
            {
                source_name: 'S0565',
                url: 'https://attack.mitre.org/software/S0565',
                description: 'Referenced Object'
            }
        ]
    }
}
```

The referenced object is not modified during export.

## Importing Objects

When importing objects, the process is reversed.
Each occurrence of `[text](href)` where `text` matches the `description` property and the `href` matches the `url` property of the same external reference will be replaced by a LinkById marker.
