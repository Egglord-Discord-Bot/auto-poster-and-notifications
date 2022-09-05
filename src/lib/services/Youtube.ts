import RSS from "rss-parser";
import { Utils } from "@lib";
import { BaseService } from "./BaseService";

interface YoutubeRecord { shouldUpdate: boolean, result: YoutubeData }
export class Youtube extends BaseService {
   private record: YoutubeRecord | null = null;
   constructor(private channelId: string) {
      super({
         disable: false,
         timeout: 6000,
         name: "youtube",
      })
      if(!channelId) throw new Error("Missing youtube channelId.")
   }
   public async init() {
      await this.fetchYoutubeVideo()
   }

   private async fetchYoutubeVideo() {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${this.channelId}`;
      const context = await new RSS().parseURL(feedUrl) as unknown as YoutubeRawData;
      const resolve = this.resolveData(context);
      if(resolve.shouldUpdate) return await this.webhook.send(`[${resolve.result.title}](${resolve.result.url})`);
   }

   private resolveData(data: YoutubeRawData): YoutubeRecord {
      const results: YoutubeData[] = [];
      Object.assign({}, ...data.items.map(item => {
         const resolve = {
            channel: data.link,
            title: item.title,
            author: item.author, 
            id: item.id,
            isNew: Utils.validateTime(new Date(item.pubDate), new Date()),
            url: item.link,
            createdAt: new Date(item.pubDate),
         }
         results.push(resolve) 
      }))
      const result = results[0];
      if(!this.record || this.record.result.id !== result.id) return this.record = { result, shouldUpdate: true };
      return this.record = { result, shouldUpdate: false }
   }
}


interface YoutubeData {
   channel: string,
   title: string,
   isNew: boolean
   author: string,
   id: string,
   url: string,
   createdAt: Date
}

interface YoutubeRawData {
   link: string,
   items: YoutubeRawDataItemOptions[]
}

interface YoutubeRawDataItemOptions {
   title: string,
   link: string,
   pubDate: string,
   author: string,
   id: string,
   isoDate: string,
}