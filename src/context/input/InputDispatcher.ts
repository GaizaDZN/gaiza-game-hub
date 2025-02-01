/* eslint-disable @typescript-eslint/no-explicit-any */
type InputEvent = "keyPress" | "confirm" | "cancel";

class InputDispatcher {
  private listeners: { [key in InputEvent]?: ((e: any) => void)[] } = {};

  subscribe(event: InputEvent, callback: (e: any) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]?.push(callback);
  }

  unsubscribe(event: InputEvent, callback: (e: any) => void): void {
    this.listeners[event] = this.listeners[event]?.filter(
      (cb) => cb != callback
    );
  }

  dispatch(event: InputEvent, data?: any): void {
    this.listeners[event]?.forEach((cb) => cb(data));
  }
}

export const inputDispatcher = new InputDispatcher();
