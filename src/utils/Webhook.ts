import type AutoPoster from "AutoPoster";
import { BASE_URL } from "./Constants";
import RestAPI from "./Rest";

export default class Webhook {
   public readonly api: typeof RestAPI = RestAPI.setBaseURL(BASE_URL.DISCORD)
   constructor(private manager: AutoPoster) {}
   public async create(channelId: string, token: string) {
      const data = this.api.make<WebhookData>({
         endpoint: `/channels/${channelId}/webhooks`,
         method: "POST",
         data: { method: "json", payload: { name: "AutoPoster" } },
         header: { key: "Authorization", value: `Bot ${token}`}
      });
      return await data
   }
   public async resolve() {
     const data = this.manager.options;
     if(typeof data === "object") return await this.create(data.channel, data.token);
     return await RestAPI.make<WebhookData>({
      endpoint: new URL(data).pathname.slice(4),
     })
   }
}

interface WebhookData {
   id: string,
   channel_id: string,
   token: string,
   name: string
}