/**
 * Actor system gossip types
 */

import { GossipType } from './comm';

/* Actor Ops */
export const CREATE_ACTOR: GossipType =   'CREATE_ACTOR';
export const ACTOR_MESSAGE: GossipType =  'ACTOR_MESSAGE';

/* System Ops */
export const PING: GossipType = 'PING';
export const PONG: GossipType = 'PONG';
export const TEST: GossipType = 'TEST';
