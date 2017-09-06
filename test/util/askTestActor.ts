/**
 * Reference Ask Actor used in testing
 */

import { Actor } from '../../src/actor/actor';
import { ActorMsg, ClientReceiveLogic } from '../../src/actor/actor.d';

export class AskTestActor extends Actor {

  receive: ClientReceiveLogic = {
    SomeClass: ({ msg, resolve }: ActorMsg) => resolve(msg),
    1: ({ msg, resolve }: ActorMsg) => resolve(msg),
    someString: ({ msg, resolve }: ActorMsg) => resolve(msg),
    _: ({ msg, resolve }) => resolve(msg),
  };

  constructor() {
    super('Ask Test Actor');
  }

}
