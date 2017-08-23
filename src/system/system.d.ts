/**
 * Definitions for system
 */

import { IActor } from '../actor/actor';

export interface IActorSystem {
  systemName: string;

  actorOf: (actor: IActor) => IActor;
}
