/**
 * Definitions for Vaudeville Actors
 */

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

export interface IActorProps {
  name: string;
}

export interface IActorRef {
  path: string;
}
