import { APIGatewayProxyHandler } from 'aws-lambda'
import { DynamoDB, SQS } from 'aws-sdk'
import { Table } from 'sst/node/table'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event) => {
   const result = await dynamoDb
      .scan({
         TableName: Table.Feed.tableName,
         ConsistentRead: true,
      })
      .promise()

   return {
      statusCode: 200,
      body: JSON.stringify({
         success: true,
         data: result.Items,
      }),
      headers: {
         'content-type': 'application/json',
      },
   }
}
