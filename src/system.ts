/**
 * Vaudeville Actor System
 */

import { IActor } from './actor.d';
import { IActorSystem } from "./system.d";

export class ActorSystem implements IActorSystem {

  private store: WeakSet<IActor>;

  constructor(
    public systemName: string,
  ) {  }

  public actorOf(actor: IActor): IActor {
    this.store.add(actor);
    return actor;
  }

}
