import type { Types, WebhookManager } from "../utils";
import { container } from "tsyringe"
export abstract class BaseService<O extends Types.BaseServiceOptions = Types.BaseServiceOptions> {
   public webhook: WebhookManager = container.resolve("webhook")
   constructor(public options: O) {}
   public abstract init(): Promise<void> | void;
}