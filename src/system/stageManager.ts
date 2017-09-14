/**
 * Manages a child thread of an ActorSystem
 * - Creates/monitors child actors
 * - Reacts to messages from the actor system
 */

import { stageManagerRouter } from './routing/stageManagerRouter';

export class StageManager {

  private readonly pid: number = process.pid;

  constructor() {
    process.on('message', stageManagerRouter);
  }

}

/* tslint:disable-next-line no-unused-expression */
new StageManager();
