/**
 * Holds instances to Actor classes for instantiation
 */

import { ActorType } from '../../actor/actor';

/* tslint:disable-next-line interface-over-type-literal */
type ActorRegister = { [actorClassName: string]: ActorType };

export class ActorRegistry {

  private static self: ActorRegistry = new ActorRegistry();

  private registry: ActorRegister = {};

  public static getInstance(): ActorRegistry {
    return ActorRegistry.self;
  }

  constructor() {
    if (ActorRegistry.self) {
      throw new Error('Use getInstance to retrieve registry');
    }
    ActorRegistry.self = this;
  }

  /**
   * Register an actor with the registry
   * @param {ActorType} actor - The actor to register with the registry
   */
  public register(actor: ActorType): void {
    if (!this.registry[actor.name]) {
      this.registry[actor.name] = actor;
    }
  }

  /**
   * Check to see if an actor exists in the registry
   * @param {string} actor - The string name of the actor class
   * @return {boolean} - Whether the actor exists in the registry
   */
  public exists(actor: string): boolean {
    return !!this.registry[actor];
  }

  /**
   * Get the specified ActorType from the registry, or throw
   * @param {string} actor - The string name of the actor class
   * @return {ActorType} - The actor class, or throw
   */
  public get(actor: string): ActorType {
    if (this.exists(actor)) {
      return this.registry[actor];
    } else {
      throw new Error(`Actor ${actor} is not registered`);
    }
  }

  /**
   * Clear the repository
   * NOTE: This is mostly for testing
   */
  public clear(): void {
    this.registry = {};
  }

}
