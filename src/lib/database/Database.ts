import { DataSource, DataSourceOptions } from "typeorm"
export class Database {
   private client: DataSource = new DataSource(this.options)
   constructor(private options: DataSourceOptions) {}
   public async init() {
     if(!this.client.isInitialized) await this.client.initialize();
     process.on("exit", async () => {
      await this.client.destroy();
     })
   }
}