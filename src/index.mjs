import fetch, { Headers, Request } from 'node-fetch'
global.fetch = fetch
global.Headers = Headers
global.Request = Request
import express from 'express'
import * as dotenv from 'dotenv'
import { OpenAI } from 'langchain/llms/openai'
import { ConversationChain } from 'langchain/chains'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, '../index.html'))
})

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
