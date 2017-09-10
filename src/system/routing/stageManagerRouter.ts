/**
 * Stage manager router
 */

import { IGossip } from '../comm/comm';

import { PING, PONG } from '../comm/gossip';

export const stageManagerRouter: (message: IGossip) => void =
  (message: IGossip) => {
    switch (message.gossipType) {
      case PING: process.send({ gossipType: PONG, payload: null });
    }
  };
