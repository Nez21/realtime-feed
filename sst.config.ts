import { SSTConfig } from 'sst'
import { MyStack } from './stacks/MyStack'

export default {
   config(_input) {
      return {
         name: 'realtime-feed',
         region: 'us-east-1',
      }
   },
   stacks(app) {
      app.stack(MyStack)
   },
} satisfies SSTConfig
