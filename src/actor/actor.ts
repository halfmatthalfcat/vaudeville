/**
 * Vaudeville Actor
 */

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { ActorMsg, ClientReceiveLogic, IActor } from './actor.d';
import { ActorRef } from './actorRef';

/* tslint:disable-next-line no-any interface-over-type-literal */
export type ActorType = { new (...args: Array<any>): Actor };

export abstract class Actor implements IActor {

  /* Reference to self to avoid GC until actor is killed */
  private self: this = this;

  /* Implementation defined message handler */
  protected abstract receive: ClientReceiveLogic;

  /* Actor message mailbox */
  /* tslint:disable-next-line no-any */
  protected mailbox: Subject<any> = new Subject<any>();

  /* Actors created under implemented actor */
  protected children: WeakSet<Actor>;

  /* Path of this actor to the system root */
  public path: string;

  constructor(
    public name: string,
  ) {
    /* tslint:disable-next-line no-any */
    this.mailbox.subscribe((actorMsg: ActorMsg<any, any>) => this.runReceive(actorMsg));
  }

  /**
   * Fire-and-forget message
   * @typedef {T} - The type of the message
   * @param {ActorRef} actor - The receiving actor reference
   * @param {T} msg - The message to receiving actor
   */
  public tell<T>(actor: ActorRef, msg: T): void {
    // actor.mailbox.next({ sender: this, msg });
  }

  /**
   * Fire-and-wait message
   * @typedef {A} - The type of message sent
   * @typedef {B} - The type of message to receive
   * @param {ActorRef} actor - The receiving actor reference
   * @param {A} msg - The message to receiving actor
   * @return {Observable<B>} - The eventual result from receiving actor
   */
  public ask<A, B>(actor: ActorRef, msg: A): Promise<B> {
    return new Promise((resolve) => {
      // actor.mailbox.next({ sender: this, msg, resolve });
    });
  }

  /**
   * Create a child actor of this actor
   * @param {ActorType} actorType - The class of the new actor
   * @param {Array<any>} args - Instantiation args for the new actor (props)
   * @returns {ActorRef} - A reference to the newly created actor
   */
  public actorOf(
    actorType: ActorType,
    /* tslint:disable-next-line no-any */
    ...args: Array<any>,
  ): ActorRef {
    const actor: Actor = new actorType(...args);
    actor.path = `${this.path}/${actor.name}`;
    this.children.add(actor);
    return new ActorRef(actor.path);
  }

  /**
   * When a message is received by implemented actor,
   * run the defined ReceiveLogic
   */
  /* tslint:disable-next-line no-any */
  private runReceive(actorMsg: ActorMsg<any, any>): void {
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
