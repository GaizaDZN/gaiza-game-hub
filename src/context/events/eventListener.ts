/* eslint-disable @typescript-eslint/no-explicit-any */
export type CollisionEvent = "coreHit" | "playerHit";

class CollisionEventDispatcher {
  private listeners: { [key in CollisionEvent]?: ((e: any) => void)[] } = {};

  subscribe(event: CollisionEvent, callback: (e: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]?.push(callback);
  }

  unsubscribe(event: CollisionEvent, callback: (e: any) => void): void {
    this.listeners[event] = this.listeners[event]?.filter(
      (cb) => cb != callback
    );
  }
  dispatch(event: CollisionEvent, data?: any): void {
    this.listeners[event]?.forEach((cb) => cb(data));
  }
}

export type GameEvent = "sale" | "saleFail" | "timeout";
class GameEventDispatcher {
  private listeners: { [key in GameEvent]?: ((e: any) => void)[] } = {};

  subscribe(event: GameEvent, callback: (e: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]?.push(callback);
  }

  unsubscribe(event: GameEvent, callback: (e: any) => void): void {
    this.listeners[event] = this.listeners[event]?.filter(
      (cb) => cb != callback
    );
  }
  dispatch(event: GameEvent, data?: any): void {
    this.listeners[event]?.forEach((cb) => cb(data));
  }
}

export const collisionEventDispatcher = new CollisionEventDispatcher();
export const gameEventDispatcher = new GameEventDispatcher();
