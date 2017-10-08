/**
 * Definitions for an ActorTree
 */
/* tslint:disable no-any */

import { Observable } from 'rxjs/Observable';

import { ActorMsg } from '../../actor/actor.d';

export interface IActorTree {
  getNode: (path: string) => INode | null;
  addNode: (path: string, node: INode) => void;
  removeNode: (path: string) => void;

  // tell: (msg: ActorMsg<any, any>) => void;
  // ask: <A, B>(msg: ActorMsg<A, B>) => Promise<B>;
}

export interface ITree {
  [path: string]: INode;
}

export interface INode {
  children: ITree;
  thread?: number;
  send?: <A, B>(msg: ActorMsg<A, B>) => void;
}
