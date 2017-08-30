/**
 * Definitions for a SystemTree
 */
/* tslint:disable no-any */

import { Observable } from 'rxjs/Observable';

import { ActorMsg } from '../actor/actor.d';

export interface ISystemTree {
  getNode: (path: string) => boolean;
  addNode: (node: INode) => void;
  removeNode: (path: string) => void;

  // tell: (msg: ActorMsg<any, any>) => void;
  // ask: <A, B>(msg: ActorMsg<A, B>) => Promise<B>;
}

export interface ITree {
  [path: string]: INode;
}

export interface INode {
  mailbox: Observable<any>;
  children: ITree;
  thread?: string;
}
