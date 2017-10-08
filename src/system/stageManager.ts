/**
 * Manages a child thread of an ActorSystem
 * - Creates/monitors child actors
 * - Reacts to messages from the actor system
 */

import * as Rx from 'rxjs';

import { stageManagerRouter } from './routing/stageManagerRouter';

import { Bus } from './bus';

import { IGossip, IMessage } from './comm/comm';

export class StageManager {

  private readonly pid: number = process.pid;

  /* Master communication bus */
  private bus: Bus<IMessage> = new Bus<IMessage>(
    stageManagerRouter,
  );

  constructor() {
    this.bus.addSource(Rx.Observable.fromEvent(process, 'message'));
  }

}

/* tslint:disable-next-line no-unused-expression */
new StageManager();
