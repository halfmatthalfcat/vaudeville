/**
 * Reference Tell Actor used in testing
 */

import { IActorMsg, ReceiveLogic } from '../../src/actor';
import { Actor } from '../../src/actor.ts';

export class TellTestActor extends Actor {

  protected receive: ReceiveLogic = {
    SomeClass: ({ msg }: IActorMsg) => this.processClass(msg),
    1: ({ msg }: IActorMsg) => this.processInt(msg),
    someString: ({ msg }: IActorMsg) => this.processString(msg),
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
