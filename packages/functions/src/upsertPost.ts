import { APIGatewayProxyHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { Table } from 'sst/node/table'
import { Post, UpsertPost } from '@realtime-feed/core/post'
import { ulid } from 'ulid'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event) => {
   const obj = event.body && JSON.parse(event.body)
   const input = UpsertPost.safeParse(obj)

   if (!input.success) {
      return {
         statusCode: 400,
         body: JSON.stringify({
            success: false,
            error: input.error,
         }),
         input,
      }
   }

   const post: Post = {
      ...input.data,
      id: input.data.id ?? ulid(),
      createdAt: new Date().toISOString(),
      updatedAt: input.data.id ? new Date().toISOString() : null,
   }

   const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: Table.Post.tableName,
      Item: post,
   }

   await dynamoDb.put(params).promise()

   return {
      statusCode: 200,
      body: JSON.stringify({
         success: true,
         data: post,
      }),
      headers: {
         'content-type': 'application/json',
      },
   }
}
