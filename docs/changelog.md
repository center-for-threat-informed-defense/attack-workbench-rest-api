# CHANGELOG

# ATT&CK Workbench REST API

## 19 March 2021
### ATT&CK Workbench version 0.2.0

#### New REST Endpoints

###### ATT&CK Objects

- `GET /api/attack-objects` retrieves ATT&CK objects of all types

###### Identity Objects

- `GET /api/identities` retrieves all identitie objects
- `POST /api/identities` creates a new identity object
- `GET /api/identities/:stixId` retrieves a particular identity object
- `GET /api/identities/:stixId/modified/:modified-date` retrieves a particular version of an identity object
- `PUT /api/identities/:stixId/modified/:modified-date` updates an identity object
- `DEL /api/identities/:stixId/modified/:modified-date` deletes an identity object

###### Marking Definition Objects

- `GET /api/marking-definitions` retrieves all marking definition objects
- `POST /api/marking-definitions` creates a new marking definition object
- `GET /api/marking-definitions/:stixId` retrieves a particular marking definition object
- `PUT /api/marking-definitions/:stixId` updates an marking definition object
- `DEL /api/marking-definitions/:stixId` deletes an marking definition object

###### Note Objects

- `GET /api/notes` retrieves all note objects
- `POST /api/notes` creates a new note object
- `GET /api/notes/:stixId` retrieve a particular note object
- `DEL /api/notes/:stixId` deletes all note objects
- `GET /api/notes/:stixId/modified/:modified-date` retrieve a particular version of a note object
- `PUT /api/notes/:stixId/modified/:modified-date` updates a note object
- `DEL /api/notes/:stixId/modified/:modified-date` deletes a note object

###### Reference Objects

- `GET /api/references` retrieves all reference objects
- `POST /api/references` creates a new reference object
- `PUT /api/references` updates a reference object

###### System Configuration

- `GET /config/allowed-values` retrieves allowed values for designationed properties

#### Modified REST Endpoints

###### search Query String

- Added the `search` query string to the GET /api/*objecttype* endpoints for attack-objects, collections, groups, matrices, mitigations, notes, references, software, tactics, and techniques.
Providing this query string in a request will filter the returned objects, matching objects with the provided text.

###### Relationship Objects

- Added the `versions` query string to the `GET /api/relationships` endpoint

#### Removed REST Endpoints

None

#### Configuration Changes

- Added `CONFIG_ALLOWED_VALUES` environment variable which sets the location of the allowed values data file
