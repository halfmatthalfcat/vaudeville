/**
 * Vaudeville Actor System
 */

import * as os from 'os';

import { Bus } from './bus';

import { ActorTree } from './util/actorTree';

import { SystemCLI } from './cli/cli';

import { childRouter, systemRouter } from './routing/systemRouters';

import { IActorSystem } from './system.d';

import { Thread } from './thread';

import { Actor, ActorType } from '../actor/actor';
import { ActorRef } from '../actor/actorRef';

import { IMessage } from './comm/comm.d';
import { PING, TEST } from './comm/gossip';

export class ActorSystem implements IActorSystem {

  /* Holds actor hierarchy */
  private actorTree: ActorTree = new ActorTree();

  /* Master communication bus */
  private bus: Bus<IMessage> = new Bus<IMessage>(
    systemRouter,
    childRouter(this.actorTree),
  );

  constructor(
    public systemName: string,
  ) {
    console.log(`Booting up Vaudeville system ${systemName} on ${os.platform()}(${os.arch()})`);

    /* tslint:disable-next-line no-unused-expression */
    if (process.argv.includes('-c')) { new SystemCLI(systemName); }
  }

  /**
   * Start up the server, create threads
   */
  public start(): void {
    this.addThread();
  }

  /**
   * Create "top level" actors in a system
   * Abstracts away actor creation so it can be created on other threads
   * @param {ActorType} actorType - The class of the new actor
   * @param {string} actorName - The name of the actor (used in building the actor path)
   * @param {Array<any>} args - Instantiation args for the new actor (props)
   * @returns {ActorRef} - A reference to the newly created actor
   */
  public actorOf(
    actorType: ActorType,
    actorName: string = actorType.name,
    /* tslint:disable-next-line no-any */
    ...args: Array<any>,
  ): ActorRef {
    this.bus.send({ message: { gossipType: PING, payload: null }});
    return new ActorRef(`/user/${actorName}`);
  }

  private addThread(): void {
    const thread: Thread = new Thread('stageManager', false);
    this.bus.addSource(thread.onMessage());
    this.bus.send({ message: { gossipType: TEST, payload: null }});
    setInterval(() => thread.send({ message: { gossipType: PING, payload: null }}), 1000);
  }

}

/* tslint:disable-next-line no-unused-expression */
new ActorSystem('Vaudeville').start();
