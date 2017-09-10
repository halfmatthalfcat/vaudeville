/**
 * Vaudeville Actor System
 */

import * as cluster from 'cluster';
import * as os from 'os';

import { ActorTree } from './util/actorTree';

import { IActorSystem } from './system.d';

import { PING } from './comm/gossip';
import { masterRouter } from './routing/masterRouter';

export class ActorSystem implements IActorSystem {

  private actorTree: ActorTree = new ActorTree();

  constructor(
    public systemName: string,
  ) {
    console.log(`Booting up Vaudeville system ${systemName} on ${os.platform()}(${os.arch()})`);

    cluster.on('message', masterRouter(this.actorTree));
  }

  public start(): void {
    this
      .spawnThread()
      .then((worker: cluster.Worker) => {
        worker.send({ gossipType: PING, payload: null });
      });
  }

  private spawnThread(): Promise<cluster.Worker> {
    cluster
      .setupMaster({
        exec: './stageManager.js',
      });
    return new Promise<cluster.Worker>((resolve) => {
      let worker: cluster.Worker;
      worker = cluster
        .fork()
        .on('online', () => resolve(worker));
    });
  }

}

/* tslint:disable-next-line no-unused-expression */
new ActorSystem('System').start();
