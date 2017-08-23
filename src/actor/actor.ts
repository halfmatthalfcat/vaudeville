/**
 * Vaudeville Actor
 */

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { ActorMsg, ActorRef, ClientReceiveLogic, IActor } from './actor';

/* tslint:disable-next-line no-any interface-over-type-literal */
export type ActorType<T extends Actor> = { new (...args: Array<any>): T };

export abstract class Actor implements IActor {

  /* Implementation defined message handler */
  protected abstract receive: ClientReceiveLogic;

  /* Actor message mailbox */
  /* tslint:disable-next-line no-any */
  protected mailbox: Subject<any> = new Subject<any>();

  /* Actors created under implemented actor */
  protected children: WeakSet<Actor>;

  /* Reference to self to avoid GC until actor is killed */
  private self: this = this;

  constructor(
    public actorName: string,
  ) {
    this.mailbox.subscribe((actorMsg: ActorMsg) => this.runReceive(actorMsg));
  }

  /**
   * Fire-and-forget message
   * @typedef {T} - The type of the message
   * @param {IActor} actor - The receiving actor
   * @param {T} msg - The message to receiving actor
   */
  protected tell<T>(actor: Actor, msg: T): void {
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
  protected ask<A, B>(actor: Actor, msg: A): Promise<B> {
    return new Promise((resolve) => {
      actor.mailbox.next({ sender: this, msg, resolve });
    });
  }

  /**
   * Create a child actor of this actor
   * @param {ActorType} actorType - The class of the new actor
   * @param {Array<any>} args - Instantiation args for the new actor (props)
   * @returns {ActorRef} - A reference to the newly created actor
   */
  /* tslint:disable-next-line no-any */
  protected actorOf(actorType: ActorType, ...args: Array<any>): ActorRef {
    let actor: Actor = new actorType(...args);
    this.children.add(actor);
    actor = null;
    return actor;
  }

  /**
   * When a message is received by implemented actor,
   * run the defined ReceiveLogic
   */
  private runReceive(actorMsg: ActorMsg): void {
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
      typeof actorMsg.msg === 'string' &&
      this.receive.hasOwnProperty(actorMsg.msg)
    ) {
      this.receive[actorMsg.msg](actorMsg);
    } else if (
      this.receive.hasOwnProperty('_')
    ) {
      this.receive['_'](actorMsg);
    }
  }

}
