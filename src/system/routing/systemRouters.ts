/**
 * Message router for the actor system
 */

import { IChildMessage, ISystemMessage } from '../comm/comm.d';
import { PING, PONG, TEST } from '../comm/gossip';

import { ActorTree } from '../util/actorTree';

import { RouterLogic } from './routing';

export const childRouter: (actorTree: ActorTree) => (childMessage: IChildMessage) => RouterLogic =
  (/* actorTree: ActorTree */) => {
    return ({ process }) => {
      return {
        [PING]: () => process.send({ gossipType: PONG, payload: null }),
        [PONG]: () => console.log(`Got PONG from ${process.pid}`),
      };
    };
  };

export const systemRouter: (systemMessage: ISystemMessage) => RouterLogic =
  ({ message }) => {
    return {
      [TEST]: () => console.log('Working'),
    };
  };
