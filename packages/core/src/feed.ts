import { z } from 'zod'
import { Post } from './post'

export interface FeedPost {
   name: string
   postId: string
   post: string
}

export interface Feed {
   name: string
   count: number
}

export interface FeedPostDto {
   name: string
   posts: Post[]
   next: string
   prev: string
}

export const GetFeed = z.object({
   name: z.string(),
   cursor: z.string().optional(),
   forward: z.boolean().default(true),
   limit: z.number().default(10),
})
