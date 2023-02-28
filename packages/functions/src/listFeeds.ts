import { Feed } from '@realtime-feed/core/feed'
import { APIGatewayProxyHandler } from 'aws-lambda'
import { DynamoDB, SQS } from 'aws-sdk'
import { Table } from 'sst/node/table'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event) => {
   const items: Feed[] = []
   const params: DynamoDB.DocumentClient.ScanInput = {
      TableName: Table.Feed.tableName,
      FilterExpression: '#count > :min',
      ExpressionAttributeNames: { '#count': 'count' },
      ExpressionAttributeValues: { ':min': 0 },
      ConsistentRead: true,
   }

   do {
      const result = await dynamoDb.scan(params).promise()

      result.Items?.forEach((item) => items.push(<Feed>item))
      params.ExclusiveStartKey = result.LastEvaluatedKey
   } while (params.ExclusiveStartKey)

   return {
      statusCode: 200,
      body: JSON.stringify({
         success: true,
         data: items,
      }),
      headers: {
         'content-type': 'application/json',
      },
   }
}
