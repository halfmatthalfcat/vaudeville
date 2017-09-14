/**
 * Definitions for system comm
 */

export type GossipType = string;

export interface IGossip {
  gossipType: GossipType;
  payload: object | null;
}
