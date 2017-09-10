/**
 * Manages a child process
 */

import * as cluster from 'cluster';
import * as Process from 'process';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

export class Thread {

  public pid: number = null;

  private process: Process;
  private subject: Subject<[number, number]> = new Subject<[number, number]>();

  constructor(
    private execPath: string,
    private autoRestart: boolean = true,
  ) {
    cluster.setupMaster({
      exec: execPath,
      silent: true,
    });

    this.spawn();
  }

  /**
   * Kill this thread, return promise when dead
   * @return {Promise<void>} - Promise that resolves when thread dies
   */
  public kill(): Promise<void> {
    return new Promise((resolve) => {
      this.process.on('disconnect', resolve);
      this.process.disconnect();
    });
  }

  /**
   * Emit restart events to any listeners
   * @return {Observable<[number, number]>} - Observable that emits on restart events with old/new pid
   */
  public onRestart(): Observable<[number, number]> {
    return this.subject.asObservable();
  }

  /**
   * @private
   * Spawns a new thread and attaches relevant listeners
   * @return {cluster.Worker} - The worker object
   */
  private spawn(): cluster.Worker {
    // Create new worker
    const thread: cluster.Worker = cluster.fork();
    this.process = thread.process;
    // Broadcast pid change if not the first spawn
    if (this.pid) { this.subject.next([this.pid, thread.process.pid]); }
    // Set new pid locally
    this.pid = thread.process.pid;
    // Setup new handlers
    thread.on('exit', this.onExit);
    thread.on('error', this.onError);
    thread.on('disconnect', this.onDisconnect);
  }

  /**
   * @private
   * Handles exit events on the thread, restarts if necessary
   * @param {number} code - The exit code
   * @param {string} signal - The exit signal
   * TODO: Add specific code/signal handling
   */
  private onExit: (code: number, signal: string) => void =
    (code: number, signal: string) => {
      if (this.autoRestart && code !== 0) { this.spawn(); }
    }

  /**
   * @private
   * Handles error events on the thread, restarts if necessaray
   * @param {Error} error - The thrown error
   * TODO: Add specific error handling
   */
  private onError: (error: Error) => void =
    (error: Error) => {
      if (this.autoRestart) { this.spawn(); }
    }

  /**
   * @private
   * Handles disconnect events on the thread
   */
  private onDisconnect: () => void = () => {
    console.log(`Thread ${this.pid} disconnected`);
  }

}
