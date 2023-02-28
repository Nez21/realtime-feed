import { APIGatewayProxyHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { Table } from 'sst/node/table'
import { FeedPostDto, GetFeed } from '@realtime-feed/core/feed'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event) => {
   const obj = {
      name: event.pathParameters?.name!,
      ...event.queryStringParameters,
   }
   const input = GetFeed.safeParse(obj)

   if (!input.success) {
      return {
         statusCode: 400,
         body: JSON.stringify({
            success: false,
            error: input.error,
         }),
      }
   }

   const params: DynamoDB.DocumentClient.QueryInput = {
      TableName: Table.FeedPost.tableName,
      Limit: input.data.limit,
      KeyConditionExpression: `#name = :name`,
      ExpressionAttributeNames: { '#name': 'name' },
      ExpressionAttributeValues: { ':name': input.data.name },
      ScanIndexForward: !input.data.forward,
      ConsistentRead: true,
   }

   if (input.data.cursor) {
      params.KeyConditionExpression += ` AND postId ${input.data.forward ? '<' : '>'} :cursor`
      Object.assign(params.ExpressionAttributeValues!, { ':cursor': input.data.cursor })
   }

   const result = await dynamoDb.query(params).promise()
   const items = result.Items ?? []

   return {
      statusCode: 200,
      body: JSON.stringify({
         success: true,
         data: <FeedPostDto>{
            name: input.data.name,
            posts: items.map((item) => JSON.parse(item.post)),
            prev: items[0]?.postId,
            next: items[items.length - 1]?.postId,
         },
      }),
      headers: {
         'content-type': 'application/json',
      },
   }
}
