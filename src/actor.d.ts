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

  mailbox: Subject<{}>;
}

export interface IActorMsg {
  sender: IActor;
  msg: {};
  resolve?: (value: {} | Promise<{}>) => void;
}
