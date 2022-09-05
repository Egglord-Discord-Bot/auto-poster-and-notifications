export interface AutoPosterOptions {
   token: string,
   channelId: string,
   name?: string,
   webhookId?: string
}

export interface WebhookOptions {
   id: string,
   name: string,
   channel_id: string,
   token: string,
}

export interface BaseServiceOptions {
   disable: boolean,
   name: string,
   timeout: number
}

