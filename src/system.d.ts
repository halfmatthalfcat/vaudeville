/**
 * Definitions for system
 */

import { IActor } from './actor.d';

export interface IActorSystem {
  systemName: string;

  actorOf: (actor: IActor) => IActor;
}
