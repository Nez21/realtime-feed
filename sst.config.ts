import { SSTConfig } from 'sst'
import { MyStack } from './stacks/MyStack'
import { RemovalPolicy } from 'aws-cdk-lib'

export default {
   config(_input) {
      return {
         name: 'realtime-feed',
         region: 'ap-southeast-1',
      }
   },
   stacks(app) {
      app.stack(MyStack)
      app.setDefaultRemovalPolicy(RemovalPolicy.DESTROY)
   },
} satisfies SSTConfig
