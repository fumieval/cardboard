cardboard - extensible contents management system
====

Usage

```
$ stack build
$ stack exec cardboard
```

Then access `http://localhost:3000/`

For each class, it evaluates the content as a JavaScript function, and applies it to an object of payloads where keys are selected tags.

## API

### GET /tags :: JSON [Text]

Get a list of all tags.

### GET /classes :: JSON [Text]

Get a list of all classes.

### GET /tag/:name :: Text

Check if the specified tag exists.

### POST /tag/:name :: Text

Create a new tag.

### DELETE /tag/:name :: Text

Delete a tag.

### GET /class/:name :: Text

Get a class source.

### POST /class/:name :: Text

Upload the request body as a class.

### DELETE /tag/:name :: Text

Delete a class.

### GET /payload/:tag/:class :: ByteString

Get the payload of the specified tag and the class.

### POST /payload/:tag/:class :: Text

Upload a new payload.
