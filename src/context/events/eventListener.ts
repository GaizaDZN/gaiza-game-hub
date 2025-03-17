/* eslint-disable @typescript-eslint/no-explicit-any */
type CollisionEvent = "coreHit" | "playerHit";

class CollisionEventDispatcher {
  private listeners: { [key in CollisionEvent]?: ((e: any) => void)[] } = {};

  subscribe(event: CollisionEvent, callback: (e: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]?.push(callback);
  }

  unSubscribe(event: CollisionEvent, callback: (e: any) => void): void {
    this.listeners[event] = this.listeners[event]?.filter(
      (cb) => cb != callback
    );
  }
  dispatch(event: CollisionEvent, data?: any): void {
    this.listeners[event]?.forEach((cb) => cb(data));
  }
}

type GameEvent = "sale";
class GameEventDispatcher {
  private listeners: { [key in GameEvent]?: ((e: any) => void)[] } = {};

  subscribe(event: GameEvent, callback: (e: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]?.push(callback);
  }

  unSubscribe(event: GameEvent, callback: (e: any) => void): void {
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
