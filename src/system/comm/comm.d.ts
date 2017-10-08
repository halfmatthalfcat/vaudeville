/**
 * Definitions for system comm
 */

import { ChildProcess } from 'child_process';

export type GossipType = string;

export interface IGossip {
  gossipType: GossipType;
  payload: object | null;
}

export interface IMessage {
  message: IGossip;
}

export interface IChildMessage extends IMessage {
  process: ChildProcess;
}

// tslint:disable-next-line
export interface ISystemMessage extends IMessage {  }
