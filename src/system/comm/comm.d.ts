/**
 * Definitions for system comm
 */

export type GossipType = string;

export interface IGossip<T extends object> {
  gossipType: GossipType;
  payload: T;
}
