import { Types, WebhookManager, BaseService, Schedule } from "@lib";

export class AutoPoster {
   private ready: boolean = false;
   public schedule: Schedule = new Schedule();
   public webhook: WebhookManager = new WebhookManager(this)
   constructor(public options: Types.AutoPosterOptions) {
      if(!options) throw new Error("Options must be present.")
   }

   public async init<T extends BaseService>(services: T[]) {
      this.ready = true;
      await this.webhook.init();
      if(!services) throw new Error(`There is no services found.`)
      for(const service of services) {
         if(!service.init) throw new Error(`[Service:${service.options.name}] init() Method not implemented`)
         this.schedule.add(service);
         await service.init();
      }
      this.schedule.listenTimer();
   }
}
