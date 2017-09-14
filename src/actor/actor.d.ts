/**
 * Definitions for Vaudeville Actors
 */

interface BaseReceiveLogic {
  PoisonPill: () => void;
  Kill: () => void;
}

interface ClientReceiveLogic {
  [typeName: string]: (msg: ActorMsg) => void;
  [typeName: number]: (msg: ActorMsg) => void;
  // Catch-all case
  _: (msg: ActorMsg) => void;
}

export interface IActor {
  name: string;
  path: string;
}

export interface ActorMsg<A, B> {
  sender: IActor;
  msg: A;
  resolve?: (value: B) => void;
}
