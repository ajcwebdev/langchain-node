import fetch, { Headers, Request } from 'node-fetch'
global.fetch = fetch
global.Headers = Headers
global.Request = Request
import { join } from 'path'
import express from 'express'
import { existsSync } from 'fs'
import * as dotenv from 'dotenv'
import { OpenAI } from 'langchain/llms/openai'
import { ConversationChain } from 'langchain/chains'

const app = express()
const appDir = process.cwd()
const port = process.env.PORT || 3001

const env = ['.env.production', '.env'].map((i) => join(appDir, i)).find(existsSync)

if (env) {
  dotenv.config({ path: env })
} else {
  dotenv.config()
}

const model = new OpenAI({})

app.post('/chat', express.json(), async (req, res) => {
  try {
    const chain = new ConversationChain({ llm: model })
    const { response } = await chain.call({ input: req.body.input })

    console.log('Input: ' + JSON.stringify(req.body.input))
    console.log('Result:' + JSON.stringify(response))

    res.send({ body: response })
  } catch (error) {
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    res.status(500).send({ error: 'Internal Server Error' })
  }
})

app.listen(port, () => console.log(`Listening on port ${port}\n`))
