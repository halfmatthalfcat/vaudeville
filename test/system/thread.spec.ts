/**
 * Unit tests for the Thread class
 */

import { Thread } from '../../src/system/thread';

describe('Thread', () => {

  it('should be created successfully', (next) => {
    const thread: Thread = new Thread('test/util/dummyThread.js', false);

    expect(thread).toBeDefined();
    expect(thread.pid).toBeDefined();

    thread
      .kill()
      .then(next);
  });

  it('should restart successfully on bad exit', (next) => {

    const thread: Thread = new Thread('test/util/failThread.js');

    thread
      .onRestart()
      .subscribe(([oldPid, newPid]) => {

        expect(oldPid).not.toEqual(newPid);

        thread
          .kill()
          .then(next);
      });

  });

});
