import { DynamoDBStreamHandler } from 'aws-lambda'
import { DynamoDB, SQS } from 'aws-sdk'
import { Table } from 'sst/node/table'
import { Queue } from 'sst/node/queue'
import { Post } from '@realtime-feed/core/post'
import { FeedPost } from '@realtime-feed/core/feed'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const dynamoDb = new DynamoDB.DocumentClient()
const sqs = new SQS()

export const handler: DynamoDBStreamHandler = async (event) => {
   const updatedFeeds: string[] = []

   for (const record of event.Records) {
      if (!record.dynamodb) continue

      const item = <Post>unmarshall(record.dynamodb.NewImage ?? record.dynamodb.OldImage!)

      updatedFeeds.push(...item.tags)

      const params: DynamoDB.DocumentClient.BatchWriteItemInput = {
         RequestItems: {
            [Table.FeedPost.tableName]: item.tags.map((name): DynamoDB.DocumentClient.WriteRequest => {
               if (record.eventName == 'REMOVE') {
                  return {
                     DeleteRequest: {
                        Key: <Pick<FeedPost, 'name' | 'postId'>>{
                           name,
                           postId: item.id,
                        },
                     },
                  }
               }

               return {
                  PutRequest: {
                     Item: <FeedPost>{
                        name,
                        postId: item.id,
                        post: JSON.stringify(item),
                     },
                  },
               }
            }),
         },
      }

      await dynamoDb.batchWrite(params).promise()
   }

   if (updatedFeeds.length) {
      await sqs
         .sendMessage({
            MessageBody: JSON.stringify(updatedFeeds),
            QueueUrl: Queue.UpdatedFeedsQueue.queueUrl,
         })
         .promise()
   }
}
