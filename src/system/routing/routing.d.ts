/**
 * Definitions for routing
 */

export type RouterLogic = { [route: string]: () => void };

export type Router<T> = (msg: T) => RouterLogic;
