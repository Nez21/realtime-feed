import { DynamoDB } from 'aws-sdk'
import { APIGatewayProxyWebsocketHandlerV2 } from 'aws-lambda'
import { Table } from 'sst/node/table'

const dynamoDb = new DynamoDB.DocumentClient()

export const handler: APIGatewayProxyWebsocketHandlerV2<void> = async (event) => {
   const params: DynamoDB.DocumentClient.PutItemInput = {
      TableName: Table.Connections.tableName,
      Item: {
         id: event.requestContext.connectionId,
      },
   }

   await dynamoDb.put(params).promise()
}
