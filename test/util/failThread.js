/**
 * Mock child thread, bounces all messages back
 */

function FailThread() {
  setTimeout(() => { throw new Error('Error') }, 1000);
}

new FailThread();
