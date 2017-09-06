/**
 * Vaudeville Actor System
 */

import * as cluster from 'cluster';

import { IActor } from '../actor/actor.d';

import { ActorTree } from './actorTree';
import { IActorSystem } from './system.d';

export class ActorSystem implements IActorSystem {

  private actorTree: ActorTree = new ActorTree();

  constructor(
    public systemName: string,
  ) {
    cluster
      .setupMaster({
        exec: './dist/src/system/stageManager.js',
      });

    cluster
      .on('message', (worker: cluster.Worker, message: object) => {
        console.log(`${worker.id}: ${JSON.stringify(message)}`);
      });
  }

  public start(): void {
    this
      .spawnThread()
      .then((worker: cluster.Worker) => {
        console.log(`Worker ${worker.id} is online`);
      });
  }

  private spawnThread(): Promise<cluster.Worker> {
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
