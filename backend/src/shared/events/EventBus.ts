type EventHandler = (payload: any) => Promise<void>;

class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  async emit(event: string, payload: any): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[EventBus] Error en handler de "${event}":`, error);
      }
    }
  }
}

export const eventBus = new EventBus();
