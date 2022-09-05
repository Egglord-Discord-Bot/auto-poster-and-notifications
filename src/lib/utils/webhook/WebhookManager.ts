import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { Types, Webhook, AutoPoster } from "@lib"
import { container } from "tsyringe"

export class WebhookManager {
   public rest: REST = new REST()
   private webhook: Webhook | null = null;
   private store: Map<string, Webhook> = new Map();
   constructor(private manager: AutoPoster) {
      container.registerInstance("webhook", this)
      this.rest.setToken(this.manager.options.token);
   }

   public async init() {
      if(!this.manager["ready"]) throw new Error("AutoPoster has not be initalized.");
      const webhooks = await this.rest.get(Routes.channelWebhooks(this.manager.options.channelId)) as Webhook[];
      for(const webhook of webhooks) this.store.set(webhook.id, new Webhook(webhook))
   }
 
   public async get(id: string | undefined = this.manager.options.webhookId) {
      if(this.webhook) return this.webhook;
      let webhook = this.store.get(id as string) || [...this.store.values()][0];
      if(!webhook) webhook = await this.create(this.manager.options.channelId);
      return this.webhook = webhook;
   }

   public async send(content: string) {
      const webhook = await this.get();
      return this.rest.post(Routes.webhook(webhook.id, webhook.token), {
         body: { content },
        reason: "Send auto poster messages",
      })
   }

   public async create(channelId: string) {
      const options = await this.rest.post(Routes.channelWebhooks(channelId), {
         body: { name: this.manager.options.name ?? "AutoPoster" },
         reason: "Generate webhook for automatically sent ssr messages",
      }) as Types.WebhookOptions;

      const webhook = new Webhook(options);
      this.manager.options.webhookId = options.id;
      this.store.set(webhook.id, webhook);
      return webhook;
   }

}