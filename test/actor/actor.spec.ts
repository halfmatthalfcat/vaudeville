/**
 * Unit tests for Actor.ts
 */

import { SomeClass } from '../util/util';

import { AskTestActor } from '../util/askTestActor';
import { TellTestActor } from '../util/tellTestActor';

describe('Actor', () => {

  it('should create a new actor successfully', () => {
    const actor: TellTestActor = new TellTestActor();

    expect(actor).toBeDefined();
  });

  // describe('Tell', () => {
  //
  //   it('should intercept an int', () => {
  //     const actor: TellTestActor = new TellTestActor();
  //     const someInt: number = 1;
  //
  //     spyOn(actor, 'processInt');
  //
  //     actor.tell(actor, someInt);
  //
  //     expect(actor.processInt).toHaveBeenCalledWith(someInt);
  //   });
  //
  //   it('should intercept a string', () => {
  //     const actor: TellTestActor = new TellTestActor();
  //     const someString: string = 'someString';
  //
  //     spyOn(actor, 'processString');
  //
  //     actor.tell(actor, someString);
  //
  //     expect(actor.processString).toHaveBeenCalledWith(someString);
  //   });
  //
  //   it('should intercept a class', () => {
  //     const actor: TellTestActor = new TellTestActor();
  //     const someClass: SomeClass = new SomeClass();
  //
  //     spyOn(actor, 'processClass');
  //
  //     actor.tell(actor, someClass);
  //
  //     expect(actor.processClass).toHaveBeenCalledWith(someClass);
  //   });
  //
  //   it('should intercept an unknown message', () => {
  //     const actor: TellTestActor = new TellTestActor();
  //     const unknown: number = Math.random();
  //
  //     spyOn(actor, 'processCatchAll');
  //
  //     actor.tell(actor, unknown);
  //
  //     expect(actor.processCatchAll).toHaveBeenCalledWith(unknown);
  //   });
  //
  // });
  //
  // describe('Ask', () => {
  //
  //   it('should intercept and return an int', (done) => {
  //     const actor: AskTestActor = new AskTestActor();
  //     const someInt: number = 1;
  //
  //     actor
  //       .ask(actor, someInt)
  //       .then((result: number) => {
  //         expect(result).toEqual(someInt);
  //         done();
  //       });
  //
  //   });
  //
  //   it('should intercept and return a string', (done) => {
  //     const actor: AskTestActor = new AskTestActor();
  //     const someString: string = 'someString';
  //
  //     actor
  //       .ask(actor, someString)
  //       .then((result: string) => {
  //         expect(result).toEqual(someString);
  //         done();
  //       });
  //   });
  //
  //   it('should intercept and return return a class', (done) => {
  //     const actor: AskTestActor = new AskTestActor();
  //     const someClass: SomeClass = new SomeClass();
  //
  //     actor
  //       .ask(actor, someClass)
  //       .then((result: SomeClass) => {
  //         expect(result).toEqual(someClass);
  //         done();
  //       });
  //   });
  //
  //   it('should intercept and return an unknown value', (done) => {
  //     const actor: AskTestActor = new AskTestActor();
  //     const unknown: number = Math.random();
  //
  //     actor
  //       .ask(actor, unknown)
  //       .then((result: number) => {
  //         expect(result).toEqual(unknown);
  //         done();
  //       });
  //   });
  //
  // });

});
