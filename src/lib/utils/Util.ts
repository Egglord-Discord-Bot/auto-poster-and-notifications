export class Utils {
   private constructor() {
      throw new Error("Class shall not be initalized.")
   }

   public static validateTime(previous: Date, current: Date, limit: number = 2) {
      const msBetweenDates = Math.abs(previous.getTime() - current.getTime());
      const daysBetweenDates = msBetweenDates / (24 * 60 * 60 * 1000);
      return daysBetweenDates < limit;
   }
}