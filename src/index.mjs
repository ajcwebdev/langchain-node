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
  const chain = new ConversationChain({ llm: model })
  const input = req.body.input
  const result = await chain.call({ input })
  console.log(result.response)
  res.send({ body: result.response })
})

app.listen(port, () => console.log(`Listening on port ${port}`))
