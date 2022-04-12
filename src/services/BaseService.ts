import { container } from "tsyringe";
import type AutoPoster from "../AutoPoster";

export default abstract class BaseService {
   public readonly manager: AutoPoster = container.resolve("manager");
   public abstract handle(): Promise<void> | void;
}