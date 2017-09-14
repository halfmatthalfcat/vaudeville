/**
 * Mock child thread, bounces all messages back
 */

const process = require('process');

function DummyThread() {
  process.on('message', (msg) => process.send(msg));
}

new DummyThread();
