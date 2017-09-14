/**
 * Reference Tell Actor used in testing
 */

import { Actor } from '../../src/actor/actor';
import { ClientReceiveLogic } from '../../src/actor/actor.d';
import { ActorRegistry } from '../../src/system/util/actorRegistry';

export class TellTestActor extends Actor {

  protected receive: ClientReceiveLogic = {
    SomeClass: ({ msg }) => this.processClass(msg),
    1: ({ msg }) => this.processInt(msg),
    someString: ({ msg }) => this.processString(msg),
    _: ({ msg }) => this.processCatchAll(msg),
  };

  constructor() {
    super('Tell Test Actor');
  }

  public processInt(num: number): void { return; }

  public processClass<T extends {}>(clazz: T): void { return; }

  public processString(str: string): void { return; }

  public processCatchAll(something: any): void { return; }

}

ActorRegistry
  .getInstance()
  .register(TellTestActor);
