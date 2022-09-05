export class Utils {
   private constructor() {
      throw new Error("Class shall not be initalized.")
   }
   public static toArray<T>(array: T[] | T, limit: number) {
      const arrays = Array.isArray(array) ? array : [array]
      if(arrays.length > limit) throw new Error(`Array length should be less than or equals to ${limit}`)
      return array;
   }
}