/**
 * Definitions for system
 */

import { ChildProcess } from 'child_process';

import { IActor } from '../actor/actor.d';
import { IGossip } from './comm/comm';

export interface IActorSystem {
  systemName: string;

  // actorOf: (actor: IActor) => IActor;
}

export interface IGossipMessage<T extends object> {
  process: ChildProcess;
  message: T;
}
