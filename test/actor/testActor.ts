import { Actor } from '../../src/actor';
import { IActorMsg, ReceiveLogic } from '../../src/actor.d';

export class TestActor extends Actor {

  protected receive: ReceiveLogic = {
    SomeClass: (msg: IActorMsg) => { console.log(msg); },
    _: (msg: IActorMsg) => { console.log(`${msg.msg} from ${msg.sender.actorName}`); },
  };

  constructor() {
    super('Test');
  }

}

class SomeClass {  }

const someClass: SomeClass = new SomeClass();

const testActor: TestActor = new TestActor();
testActor.tell(testActor, someClass);
