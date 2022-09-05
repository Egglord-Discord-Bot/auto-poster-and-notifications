import type { Types } from "@lib"

export class Webhook implements Types.WebhookOptions {
   public id: string;
   public name: string;
   public channel_id: string;
   public token: string;
   constructor(options: Types.WebhookOptions) {
      this.id = options.id;
      this.name = options.name;
      this.channel_id = options.channel_id;
      this.token = options.token;
   }
}