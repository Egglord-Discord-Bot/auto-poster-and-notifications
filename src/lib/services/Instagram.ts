import { BaseService } from "./BaseService";
import { Pool } from "undici"
export class Instagram extends BaseService {
   constructor(public accountName: string) {
      super({
         name: "instagram",
         disable: false,
         timeout: 3000,
      })
      if(!this.accountName) throw new Error("Required account name")
   }
   public async init(): Promise<void> {
      await this.fetchInstagramPost();
   }

   private async fetchInstagramPost() {
      const response = new Pool(`https://www.instagram.com`);
   }
}