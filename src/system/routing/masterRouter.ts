/**
 * Message router for the actor system
 */

import * as cluster from 'cluster';

import { IGossip } from '../comm/comm';

import { PING, PONG } from '../comm/gossip';

import { ActorTree } from '../util/actorTree.ts';

export const masterRouter: (actorTree: ActorTee) => (worker: cluster.Worker, message: object) => void =
  (actorTree: ActorTree) => {
    return (worker: cluster.Worker, message: IGossip) => {
      switch (message.gossipType) {
        case PING: worker.send({ gossipType: PONG, payload: null }); break;
        case PONG: break;
      }
    };
  };
