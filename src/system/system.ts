/**
 * Vaudeville Actor System
 */

import 'rxjs/add/operator/merge';

import * as os from 'os';

import { Observable } from 'rxjs/Observable';

import { ActorTree } from './util/actorTree';

import { IGossip } from './comm/comm';
import { PING } from './comm/gossip';

import { masterRouter } from './routing/masterRouter';

import { IActorSystem, IGossipMessage } from './system.d';

import { Thread } from './thread';

export class ActorSystem implements IActorSystem {

  private actorTree: ActorTree = new ActorTree();

  private masterBus: Observable<IGossipMessage<IGossip>> =
    Observable.create(() => void 0);

  constructor(
    public systemName: string,
  ) {
    console.log(`Booting up Vaudeville system ${systemName} on ${os.platform()}(${os.arch()})`);
  }

  public start = () => {
    const thread: Thread = new Thread('/stageManager.js', false);
    this.masterBus = this.masterBus.merge(thread.onMessage());
    this.masterBus.subscribe(masterRouter(this.actorTree));
    thread.send({ gossipType: PING, payload: null });
  }

}

/* tslint:disable-next-line no-unused-expression */
new ActorSystem('System').start();
