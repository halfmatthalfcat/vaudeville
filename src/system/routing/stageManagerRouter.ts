/**
 * Stage manager router
 */

import { IMessage } from '../comm/comm';
import { PING, PONG } from '../comm/gossip';

import { RouterLogic } from './routing';

export const stageManagerRouter: (message: IMessage) => RouterLogic =
  ({ message }) => {
    console.log(`In Child Router: ${JSON.stringify(message)}`);
    return {
      [PING]: () => process.send({ gossipType: PONG, payload: null }),
    };
  };
