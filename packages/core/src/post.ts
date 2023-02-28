import { randomUUID } from 'crypto'
import { ZodObject, z } from 'zod'

export interface Post {
   id: string
   title: string
   content: string
   author: string
   tags: string[]
   createdAt: string
   updatedAt: string | null
}

export const UpsertPost = z.object({
   id: z.string().optional(),
   title: z.string(),
   content: z.string(),
   author: z.string(),
   tags: z.array(z.string()),
})

export interface PostDto {
   id: string
   title: string
   content: string
   author: string
   tags: string[]
   createdAt: string
   updatedAt: string | null
}
