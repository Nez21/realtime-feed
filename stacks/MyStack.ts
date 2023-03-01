import { Duration } from 'aws-cdk-lib'
import { StartingPosition } from 'aws-cdk-lib/aws-lambda'
import { StackContext, Api, StaticSite, Table, WebSocketApi, Queue } from 'sst/constructs'

export function MyStack({ stack }: StackContext) {
   const connectionTable = new Table(stack, 'Connections', {
      fields: { id: 'string' },
      primaryIndex: { partitionKey: 'id' },
   })

   const postTable = new Table(stack, 'Post', {
      fields: {
         id: 'string',
         title: 'string',
         content: 'string',
         author: 'string',
         tags: 'string',
         createdAt: 'string',
         updatedAt: 'string',
      },
      stream: 'new_and_old_images',
      primaryIndex: { partitionKey: 'id' },
   })

   const feedPostTable = new Table(stack, 'FeedPost', {
      fields: {
         name: 'string',
         postId: 'string',
         post: 'string',
      },
      stream: true,
      primaryIndex: { partitionKey: 'name', sortKey: 'postId' },
   })

   const feedTable = new Table(stack, 'Feed', {
      fields: {
         name: 'string',
         count: 'number',
      },
      primaryIndex: { partitionKey: 'name' },
   })

   const ws = new WebSocketApi(stack, 'ws', {
      defaults: {
         function: {
            bind: [connectionTable],
         },
      },
      routes: {
         $connect: 'packages/functions/src/connect.handler',
         $disconnect: 'packages/functions/src/disconnect.handler',
      },
   })

   const updatedFeedsQueue = new Queue(stack, 'UpdatedFeedsQueue', {
      consumer: {
         function: {
            handler: 'packages/functions/src/broadcast.handler',
            bind: [connectionTable],
            environment: {
               WS_URL: ws.url,
            },
            permissions: ['execute-api'],
         },
      },
   })

   postTable.addConsumers(stack, {
      broadcast: {
         function: {
            handler: 'packages/functions/src/updateFeed.handler',
            bind: [feedPostTable, updatedFeedsQueue],
         },
         cdk: {
            eventSource: {
               startingPosition: StartingPosition.LATEST,
               maxBatchingWindow: Duration.millis(3000),
            },
         },
      },
   })

   feedPostTable.addConsumers(stack, {
      broadcast: {
         function: {
            handler: 'packages/functions/src/updateCounter.handler',
            bind: [feedTable],
         },
      },
   })

   const api = new Api(stack, 'api', {
      routes: {
         'PUT /posts': {
            type: 'function',
            function: {
               handler: 'packages/functions/src/upsertPost.handler',
               bind: [postTable],
            },
         },
         'DELETE /posts/{id}': {
            type: 'function',
            function: {
               handler: 'packages/functions/src/deletePost.handler',
               bind: [postTable],
            },
         },
         'GET /feeds/{name}': {
            type: 'function',
            function: {
               handler: 'packages/functions/src/getFeed.handler',
               bind: [feedPostTable],
            },
         },
         'GET /feeds': {
            type: 'function',
            function: {
               handler: 'packages/functions/src/listFeeds.handler',
               bind: [feedTable],
            },
         },
      },
   })

   const web = new StaticSite(stack, 'web', {
      path: 'packages/web',
      buildCommand: 'yarn build',
      buildOutput: 'dist',
      environment: {
         VITE_API_URL: api.url,
         VITE_WS_URL: ws.url,
      },
   })

   stack.addOutputs({
      ApiEndpoint: api.url,
      WsEndpoint: ws.url,
      WebEndpoint: web.url ?? '(Not deployed)',
   })
}
