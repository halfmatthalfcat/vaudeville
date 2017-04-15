/**
 * Vaudeville Actor
 */

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';

import { IActor, IActorMsg, ReceiveLogic } from './actor.d';

export abstract class Actor implements IActor {

  protected abstract receive: ReceiveLogic;

  public mailbox: Subject<{}> = new Subject<{}>();

  constructor(
    public actorName: string,
  ) { this.mailbox.subscribe((actorMsg: IActorMsg) => this.runReceive(actorMsg)); }

  public tell(actor: IActor, msg: {}): void {
    actor.mailbox.next({ sender: this, msg });
  }

  public ask(actor: IActor, msg: {}): Observable<{}> {
    return Observable.create((observer: Observer<{}>) => {
      actor.mailbox.next({ sender: this, msg, resolve: observer.next });
    });
  }

  private runReceive(actorMsg: IActorMsg): void {
    if (
      typeof actorMsg.msg === 'object' &&
      this.receive.hasOwnProperty(actorMsg.msg.constructor.name)
    ) {
      this.receive[actorMsg.msg.constructor.name](actorMsg);
    } else if (
      typeof actorMsg.msg === 'number' &&
      this.receive.hasOwnProperty(actorMsg.msg)
    ) {
      this.receive[actorMsg.msg](actorMsg);
    } else if (
      typeof actorMsg.msg === 'boolean' &&
      this.receive.hasOwnProperty(actorMsg.msg.toString())
    ) {
      this.receive[actorMsg.msg.toString()](actorMsg);
    } else if (
      typeof actorMsg.msg === 'string' &&
      this.receive.hasOwnProperty(actorMsg.msg)
    ) {
      this.receive[actorMsg.msg](actorMsg);
    } else {
      this.receive['_'](actorMsg);
    }
  }

}
