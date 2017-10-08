/**
 * Definitions for Vaudeville Actors
 */

interface BaseReceiveLogic {
  PoisonPill: () => void;
  Kill: () => void;
}

interface ClientReceiveLogic {
  [typeName: string]: <A, B>(msg: ActorMsg<A, B>) => void;
  [typeName: number]: <A, B>(msg: ActorMsg<A, B>) => void;
  // Catch-all case
  // tslint:disable-next-line no-any
  _: (msg: ActorMsg<any, any>) => void;
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
