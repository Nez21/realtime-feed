import { DynamoDBStreamHandler } from 'aws-lambda'
import { DynamoDB } from 'aws-sdk'
import { Table } from 'sst/node/table'
import { Feed, FeedPost } from '@realtime-feed/core/feed'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: DynamoDBStreamHandler = async (event) => {
   const increments = new Map<string, number>()

   for (const record of event.Records) {
      if (!record.dynamodb || record.eventName == 'MODIFY') continue

      const item = <FeedPost>unmarshall(record.dynamodb.NewImage ?? record.dynamodb.OldImage!)

      increments.set(item.name, (increments.get(item.name) ?? 0) + (record.eventName == 'INSERT' ? 1 : -1))
   }

   for (const [name, increment] of increments.entries()) {
      await dynamoDb
         .update({
            TableName: Table.Feed.tableName,
            Key: <Pick<Feed, 'name'>>{ name },
            UpdateExpression: 'SET #count = if_not_exists(#count, :start) + :increment',
            ExpressionAttributeNames: { '#count': 'count' },
            ExpressionAttributeValues: { ':increment': increment, ':start': 0 },
         })

         .promise()
   }
}
