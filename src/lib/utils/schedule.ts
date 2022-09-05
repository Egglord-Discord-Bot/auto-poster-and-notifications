import type { BaseService } from "../services/BaseService";

export class Schedule {
   private store: Map<string, () => NodeJS.Timer> = new Map()
   public add<T extends BaseService>(service: T) {
      if(this.store.has(service.options.name)) return;
      this.store.set(service.options.name,(() => setInterval(() => service.init(), service.options.timeout)));
   }
   public listenTimer() {
      for(const timer of [...this.store.values()]) timer();
   }
}