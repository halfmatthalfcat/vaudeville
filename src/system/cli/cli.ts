/**
 * Vaudeville CLI
 */

import * as process from 'process';

import { Subject } from 'rxjs/Subject';

import { IGossip } from '../comm/comm';

process.stdin.setEncoding('utf8');

export class SystemCLI {

  private subject: Subject<IGossip> =
    new Subject<IGossip>();

  constructor(systemName: string) {
    process.stdout.write(`${systemName}> `);
    process.stdin.on('readable', () => {
      const chunk: string | Buffer = process.stdin.read();
      if (chunk !== null) {
        process.stdout.write(`\n${chunk}\n`);
        process.stdout.write(`${systemName}> `);
        // this.subject.next(chunk.toString());
      }
    });
  }
}
