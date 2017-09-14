/**
 * Tests for the actor registry
 */
// tslint:disable no-any

import { ActorRegistry } from '../../../src/system/util/actorRegistry';
import { AskTestActor } from '../../util/askTestActor';

describe('ActorRegistry', () => {

  beforeEach(() => ActorRegistry.getInstance().clear());

  describe('Singleton', () => {
    it('should retrieve an instantiated ActorRegistry via getInstance', () => {
      const registry: ActorRegistry = ActorRegistry.getInstance();

      expect(registry).toBeDefined();
    });

    it('should error when trying to create a new ActorRegistry', () => {
      /* tslint:disable-next-line no-unused-expression */
      expect(() => new ActorRegistry()).toThrow();
    });

    it('should maintain a singleton when retrieved multiple times', () => {
      const registry: ActorRegistry = ActorRegistry.getInstance();
      registry.register(AskTestActor);

      const registry2: ActorRegistry = ActorRegistry.getInstance();

      expect(registry).toEqual(registry2);

    });
  });

  it('should register an actor', () => {
    const registry: ActorRegistry = ActorRegistry.getInstance();
    registry.register(AskTestActor);

    expect(registry.exists(AskTestActor.name)).toBeTruthy();
    expect(registry.get(AskTestActor.name)).toBeDefined();

  });

  it('should throw an error if an actor not found', () => {
    const registry: ActorRegistry = ActorRegistry.getInstance();

    expect(registry.exists(AskTestActor.name)).toBeFalsy();
    expect(() => registry.get(AskTestActor.name)).toThrow();

  });

  it('should clear the registry', () => {
    const registry: ActorRegistry = ActorRegistry.getInstance();
    registry.register(AskTestActor);

    expect(registry.exists(AskTestActor.name)).toBeTruthy();

    registry.clear();

    expect(registry.exists(AskTestActor.name)).toBeFalsy();
  });

});
