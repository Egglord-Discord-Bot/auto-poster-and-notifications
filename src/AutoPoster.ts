import type { BaseService } from "./services";
import { container } from "tsyringe";
import Webhook from "./utils/Webhook";

export default class AutoPoster {
  public ready: boolean = false;
  public webhook: Webhook = new Webhook(this);
  constructor(public options: string | WebhookOptions) {
    container.registerInstance("manager", this)
  }
  public async init(components: BaseService[]) {
    for(const compoennt of components) {
      compoennt.handle();
    }
    this.ready = true;
  }
}

export interface WebhookOptions {
  token: string,
  channel: string
}