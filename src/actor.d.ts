/**
 * Definitions for Vaudeville Actors
 */

import { Subject } from 'rxjs/Subject';

interface ReceiveLogic {
  [typeName: string]: (msg: IActorMsg) => void;
  [typeName: number]: (msg: IActorMsg) => void;
  // Catch-all case
  _: (msg: IActorMsg) => void;
}

export interface IActor {
  actorName: string;

  actorOf: (actor: IActor) => IActor;
}

export interface IActorMsg<A, B> {
  sender: IActor;
  msg: A;
  resolve?: (value: B) => void;
}
