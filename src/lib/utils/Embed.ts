import type { APIEmbed, APIEmbedAuthor, APIEmbedField, APIEmbedFooter, APIEmbedImage, APIEmbedThumbnail } from "discord-api-types/v10"
export class Embed {
   private title?: string;
   private description?: string;
   private url?: string;
   private timestamp?: string;
   private color?: number;
   private footer?: APIEmbedFooter;
   private image?: APIEmbedImage;
   private thumbnail?: APIEmbedThumbnail;
   private author?: APIEmbedAuthor;
   private fields?: APIEmbedField[];


   public toJSON(): APIEmbed {
      return {
         title: this.title,
         description: this.description,
         url: this.url,
         timestamp: this.timestamp,
         color: this.color,
         footer: this.footer,
         image: this.image,
         thumbnail: this.thumbnail,
         author: this.author,
         fields: this.fields
      }
   }

   public setTitle(title: string) {
      this.title = title;
      return this;
   }
   public setFields(fileds: APIEmbedField[]) {
      this.fields = fileds
      return this;
   }

   public setDescription(description: string) {
      this.description = description;
      return this;
   }
   public setURL(url: string) {
      this.url = url;
      return this;
   }
   public setTimestamp(timestamp: string) {
      this.timestamp = timestamp;
      return this;
   }
   public setColor(color: number) {
      this.color = color;
      return this;
   }
   public setFooter(footer: APIEmbedFooter) {
      this.footer = footer;
      return this;
   }
   public setThumbnail(thumbnail: APIEmbedThumbnail) {
      this.thumbnail = thumbnail;
      return this;
   }
   public setAuthor(author: APIEmbedAuthor) {
      this.author = author;
      return this;
   }
}