/**
 * Actor reference
 * Used in communicating with actors in a system
 */

import { IActorRef } from './actorRef.d';

export class ActorRef implements IActorRef {
  constructor(
    public path: string,
  ) {  }
}
