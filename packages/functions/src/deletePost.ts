import { APIGatewayProxyHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { Table } from 'sst/node/table'
import { Post } from '@realtime-feed/core/post'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event) => {
   const { id } = event.pathParameters!

   const result = await dynamoDb
      .delete({
         TableName: Table.Post.tableName,
         Key: { id },
         ReturnValues: 'ALL_OLD',
      })
      .promise()

   return {
      statusCode: 200,
      body: JSON.stringify({
         success: true,
         data: <Post>result.Attributes,
      }),
      headers: {
         'content-type': 'application/json',
      },
   }
}
