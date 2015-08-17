# FixedChunkStream
Uses an internal buffer to provide fixed-sized data chunks from a readable stream.

`npm install fixed-chunk-stream`

## Usage
```javascript
var fs = require('fs');
var path = require('path');
var FixedChunkStream = require('fixed-chunk-stream');

var filePath = path.resolve(process.argv[2]);
var stream = new FixedChunkStream(fs.createReadStream(filePath), { chunkSize: 512 });

stream.on('data', function (chunk) {
  console.log(chunk, chunk.length);
});
```

## API
#### `stream = new FixedChunkStream(stream, [options])`

Options can only include one property currently: `chunkSize`, the byte length each
chunk should occupy.

#### `stream.on('data', function (chunk) { ... })`

Provides a single chunk of data with a maximum size of `chunkSize` as originally
specified in the constructor. The chunk will be less than `chunkSize` if it is
the last chunk to be emitted and the file was not evenly divisible by `chunkSize`.

i.e. A 1025 byte file with a chunk size of 1024 would result in two chunks being
emitted - one 1024 byte chunk and one 1 byte chunk.

#### `stream.on('end', function () { ... })`

Emitted when the original stream's `end` event is emitted.
