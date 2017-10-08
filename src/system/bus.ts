/**
 * Actor system message bus
 */

import * as Rx from 'rxjs';

import 'rxjs/add/operator/merge';

import { Observable } from 'rxjs/Observable';
import { Observer } from "rxjs/Observer";
import { ISubscription, Subscription } from 'rxjs/Subscription';

import { IGossip, IMessage } from './comm/comm';

import { Router, RouterLogic } from './routing/routing';

export class Bus<T extends IMessage>
  extends Observable<T>
  implements ISubscription {

  private routers: Array<Router<T>>;

  private subscription: Subscription;

  private observers: Array<Observer<T>> = [];

  public closed: boolean = false;

  constructor(
    ...routers: Array<Router<T>>,
  ) {
    super();
    this.routers = routers;
    this.source = new Observable<T>(() => void 0);
    // tslint:disable-next-line no-object-literal-type-assertion
    // this.destination = { next: this.runLogic } as Observer<T>;
    this.subscription = this.subscribe((msg) => console.log(`Constructor: ${JSON.stringify(msg)}`));
  }

  /**
   * Add a new observable to the bus
   * @typedef {A} - The observable type
   * @param {Observable<A>} ob - The observable to merge into the current buss
   * TODO: investigate whether simply overwriting previous ob has impact
   */
  public addSource<A>(ob: Observable<A>): void {
    // tslint:disable-next-line no-debugger
    // debugger;
    this.source = this.source.merge(ob);
    this.subscription.unsubscribe();
    this.subscription = this.source.subscribe(this.runLogic);
  }

  /**
   * Add a router to the current array of routers
   * @param {Router<T>} router - The router to add
   */
  public addRouter(router: Router<T>): void {
    this.routers.push(router);
  }

  /**
   * Send a message to the bus and notify all observers
   * @param {T} msg - The message to pass into the bus
   */
  public send(msg: T): void {
    this.observers.forEach((observer: Observer<T>) => observer.next(msg));
  }

  public unsubscribe(): void {
    return void 0;
  }

  /**
   * Return an observable of the bus to listen in on messages
   * @return {Observable<T>} - A new observer derived from the current bus
   */
  public listen(): Observable<T> {
    return super.asObservable();
  }

  /**
   * Reduce all of the routers down to a single router logic to run the gossip type through
   */
  private reduceRouters: (msg: T) => RouterLogic = (msg: T) => {
    return this
      .routers
      .map<RouterLogic>((router: Router<T>) => router(msg))
      .reduce<RouterLogic>((acc: RouterLogic, curr: RouterLogic) => {
        return {
          ...acc,
          ...curr,
        };
      }, {});
  }

  private runLogic: (msg: T) => void = (msg: T) => {
    const logic: RouterLogic = this.reduceRouters(msg);
    if (logic[msg.message.gossipType]) {
      logic[msg.message.gossipType]();
    } else {
      // Unhandled message
    }
  }

}
