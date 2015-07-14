# ArangoDB Session-Service

## HTTP API

### POST /

Creates a new session in the database and returns the session object. The `sessionId` corresponds to the object's `_key` property.

### GET /:sessionId

Fetches the session from the database. Returns the session object.

### PUT /:sessionId

Updates the session with the data in the request body. The request body must be an object with a single object property `sessionData`. Returns the updated session object.

### DELETE /:sessionId

Destroys the session and removes it from the database if it exists. Returns an empty response.

### PUT /:sessionId/authenticate

**Not implemented.**

### PUT /:sessionId/logout

Destroys the user information stored in the session. Does not take a request body.

### POST /:sessionId/sign

Creates a signature for the request body valid for the session only. Returns an object with a single string property `signature`.

### PUT /:sessionId/sign/:signature

Validates the signature against the request body. Returns the request body if the signature is valid for the session or HTTP 400 if the signature is invalid.

## License

This code is distributed under the [Apache License](http://www.apache.org/licenses/LICENSE-2.0).
