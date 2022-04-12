import type { RestOptions } from "./Types";
import fetch from "centra";
export default class RestAPI {
   private static baseURL: string | null = null;
   public static setBaseURL(baseURL: string) {
      this.baseURL = baseURL
      return this;
   }
   public static async make<T>({ endpoint, method, data, header }: RestOptions): Promise<T> {
      if(!this.baseURL) throw new Error("Please setBaseURL for the request you are making")
      endpoint = /^\/.+/.test(endpoint) ? endpoint : `/${endpoint}`;
      const res = fetch(`${this.baseURL}${endpoint}`, method)
      if(header) convertToArray(header).map(({ key, value }) => res.header(key, value))
      if(data) res.body(data.payload, data.method);
      return res.send().then(c => c.json())
   }
}



function convertToArray<T>(data: T[] | T) {
   return Array.isArray(data) ? data : [data]
}
