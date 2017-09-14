/**
 * Actor system gossip types
 */

import { GossipType } from './comm';

/* Actor Ops */
export const CREATE_ACTOR: GossipType = 'CREATE_ACTOR';

/* System Ops */
export const PING: GossipType = 'PING';
export const PONG: GossipType = 'PONG';
