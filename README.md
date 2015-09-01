# ArangoDB Session-Service

## Configuration

* **usersRoot**: *string* (default: `"/users"`)

  Root URL of the user service to authenticate users with.

* **sessionIdLength**: *integer* (default: `16`)

  Length of the session ID that will be generated when a session is created.

* **signingSecretLength**: *integer* (default: `128`)

  Length of the session secret that will be generated when a session is created and will be used to generate signatures.

* **signingAlgorithm**: *string* (default: `"sha256"`)

  Hashing algorithm to use for signatures. Supported algorithms are:
  *sha128*, *sha256*, *sha384* and *sha512*.

* **expiryDuration**: *integer* (default: `1209600`)

  How long (in seconds) a session will be considered valid before it expires.

* **expiryType**: *string* (default: `"lastAccess"`)

  What timestamp is used to determine whether a session has expired. Supported values are:
  *lastAccess*, *lastUpdate* and *created*.

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

Authenticates the user with the user service using the given username and password. The request body must be an object with two string properties `username` and `password`. Returns the updated session object.

### PUT /:sessionId/logout

Destroys the user information stored in the session. Does not take a request body.

### POST /:sessionId/sign

Creates a signature for the request body valid for the session only. Returns an object with a single string property `signature`.

### PUT /:sessionId/sign/:signature

Validates the signature against the request body. Returns the request body if the signature is valid for the session or HTTP 400 if the signature is invalid.

### POST /:sessionId/nonce

Creates a nonce.

### PUT /:sessionId/nonce/:nonce

Marks and validates a nonce.

## License

This code is distributed under the [Apache License](http://www.apache.org/licenses/LICENSE-2.0).
