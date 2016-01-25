var util = require('util');
var EventEmitter = require('events').EventEmitter;
var Readable = require('stream').Readable;

var FixedChunkStream = function (stream, options) {
  EventEmitter.call(this);

  var self = this;

  if (!stream instanceof Readable)
    throw new Error('Provided stream must inherit from stream.Readable');

  if (typeof options === 'undefined')
    options = { };

  var chunkSize = options.chunkSize;
  if (typeof chunkSize === 'undefined' || chunkSize <= 0)
    throw new Error('Chunk size must be a positive integer');

  this.chunkSize = chunkSize;
  this.stream = stream;

  this.paused = true;
  this.bufferOffset = 0;

  this.buffer = new Buffer(chunkSize);
  this.buffer.fill(0);

  this.on('newListener', function (e)  {
    if (e === 'data' && self.paused) {
      self.paused = false;
      openStream.bind(self)();
    }
  });
};

util.inherits(FixedChunkStream, EventEmitter);

FixedChunkStream.prototype.resetBuffer = function () {
  this.buffer.fill(0);
  this.bufferOffset = 0;
};

module.exports = FixedChunkStream;

/** Private Functions **/

function openStream() {
  var self = this;

  this.stream.on('error', function (err) {
    self.emit('error', err);
  });

  this.stream.on('data', processData.bind(this));

  this.stream.on('end', function () {
    self.emit('data', self.buffer.slice(0, self.bufferOffset));
    self.resetBuffer();
  });
}

function processData(data) {
  var self = this;
  var chunks = reduce.bind(this)(data);

  chunks.forEach(function (chunk) {
    self.emit('data', chunk);
    self.emit('end');
  });
}

function reduce(data) {
  var buffer = this.buffer;
  var chunks = [ ];

  while (data.length > this.chunkSize) {
    var chunk = data.slice(0, this.chunkSize);
    data = data.slice(this.chunkSize);

    chunks.push(chunk);
  }

  if (data.length <= this.chunkSize) {
    var intoBuffer = Math.min(this.chunkSize - this.bufferOffset, data.length);
    var newOffset = this.bufferOffset + intoBuffer;

    data.copy(buffer, this.bufferOffset, 0, intoBuffer);

    if (newOffset >= this.chunkSize) {
      chunks.push(new Buffer(buffer));

      buffer.fill(0);
      this.bufferOffset = 0;
    } else {
      this.bufferOffset = newOffset;
    }

    if (intoBuffer < data.length) {
      data.copy(buffer, this.bufferOffset, intoBuffer);
      this.bufferOffset = intoBuffer;
    }
  }

  return chunks;
}
