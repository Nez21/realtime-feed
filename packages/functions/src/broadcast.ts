import { SQSHandler } from 'aws-lambda'
import { DynamoDB, ApiGatewayManagementApi } from 'aws-sdk'
import { Table } from 'sst/node/table'
import { AWSError } from 'aws-sdk'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: SQSHandler = async (event) => {
   const connections = await dynamoDb
      .scan({ TableName: Table.Connections.tableName, ProjectionExpression: 'id' })
      .promise()

   if (!connections.Items?.length) return

   const tags = [
      ...new Set(
         event.Records.reduce((acc, record) => {
            acc.push(...(<string[]>JSON.parse(record.body)))
            return acc
         }, <string[]>[]),
      ),
   ]

   const gateway = new ApiGatewayManagementApi({
      endpoint: process.env.WS_URL?.replace(/^\w+:\/\//, ''),
   })

   const result = await Promise.allSettled(
      connections.Items.map((el) =>
         gateway
            .postToConnection({
               ConnectionId: el['id'],
               Data: JSON.stringify({ event: 'updatedFeeds', data: tags }),
            })
            .promise(),
      ),
   )
   const disconnectedIds = result.reduce((acc, el, idx) => {
      if (el.status == 'rejected') {
         if ((<AWSError>el.reason).code != 'GoneException') throw el.reason

         acc.push(connections.Items![idx].id)
      }
      return acc
   }, <string[]>[])

   if (disconnectedIds.length > 0) {
      await dynamoDb
         .batchWrite({
            RequestItems: {
               [Table.Connections.tableName]: disconnectedIds.map((id) => ({ DeleteRequest: { Key: { id } } })),
            },
         })
         .promise()
   }
}
