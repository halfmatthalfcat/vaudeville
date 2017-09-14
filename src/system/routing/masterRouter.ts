/**
 * Message router for the actor system
 */

import * as cluster from 'cluster';

import { IGossip } from '../comm/comm';

import { PING, PONG } from '../comm/gossip';

import { ActorTree } from '../util/actorTree';

import { IGossipMessage } from '../system.d';

export const masterRouter: (actorTree: ActorTree) => (gossipMessage: IGossipMessage<IGossip>) => void =
  (/* actorTree: ActorTree */) => {
    return ({ process, message }) => {
      console.log(message);
      switch (message.gossipType) {
        case PING: process.send({ gossipType: PONG, payload: null }); break;
        case PONG: console.log(`Got PONG from ${process.pid}`); break;
        default: break;
      }
    };
  };
