/**
 * Vaudeville Actor
 */

import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { Subject } from 'rxjs/Subject';

import { IActor, IActorMsg, ReceiveLogic } from './actor.d';

export abstract class Actor implements IActor {

  /* Implementation defined message handler */
  protected abstract receive: ReceiveLogic;

  /* Actor message mailbox */
  /* tslint:disable-next-line no-any */
  protected mailbox: Subject<any> = new Subject<any>();

  /* Actors created under implemented actor */
  protected children: WeakSet<Actor>;

  constructor(
    public actorName: string,
  ) { this.mailbox.subscribe((actorMsg: IActorMsg) => this.runReceive(actorMsg)); }

  /**
   * Fire-and-forget message
   * @typedef {T} - The type of the message
   * @param {IActor} actor - The receiving actor
   * @param {T} msg - The message to receiving actor
   */
  public tell<T>(actor: Actor, msg: T): void {
    actor.mailbox.next({ sender: this, msg });
  }

  /**
   * Fire-and-wait message
   * @typedef {A} - The type of message sent
   * @typedef {B} - The type of message to receive
   * @param {IActor} actor - The receiving actor
   * @param {A} msg - The message to receiving actor
   * @return {Observable<B>} - The eventual result from receiving actor
   */
  public ask<A, B>(actor: Actor, msg: A): Observable<B> {
    return Observable.create((observer: Observer<B>) => {
      actor.mailbox.next({ sender: this, msg, resolve: observer.next });
    });
  }

  public actorOf(actor: Actor): Actor {
    this.children.add(actor);
    return actor;
  }

  /**
   * When a message is received by implemented actor,
   * run the defined ReceiveLogic
   */
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
