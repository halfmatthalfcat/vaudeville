/**
 * Manages a child thread of an ActorSystem
 * - Creates/monitors child actors
 * - Reacts to messages from the actor system
 */

import * as cluster from 'cluster';

export class StageManager {

  private readonly pid: number = process.pid;

  private readonly id: string = cluster.worker.id;

  constructor() {
    cluster.worker.send('Hello');
  }

}

/* tslint:disable-next-line no-unused-expression */
new StageManager();
