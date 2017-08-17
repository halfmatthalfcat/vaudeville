/**
 * Reference Ask Actor used in testing
 */

import { IActorMsg, ReceiveLogic } from '../../src/actor';
import { Actor } from '../../src/actor.ts';

export class AskTestActor extends Actor {

  protected receive: ReceiveLogic = {
    SomeClass: ({ msg, resolve }: IActorMsg) => resolve(msg),
    1: ({ msg, resolve }: IActorMsg) => resolve(msg),
    someString: ({ msg, resolve }: IActorMsg) => resolve(msg),
    _: ({ msg, resolve }) => resolve(msg),
  };

  constructor() {
    super('Ask Test Actor');
  }

}
