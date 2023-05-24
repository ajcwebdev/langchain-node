# Deploy LangChain Node App with Edgio

## Outline

- [Local Development](#local-development)
  - [Set Environment Variables](#set-environment-variables)
  - [Install Dependencies and Start Development Server](#install-dependencies-and-start-development-server)
  - [Test Local Server](#test-local-server)
- [Deploy to Edgio](#deploy-to-edgio)
  - [Deploy to Edgio v6](#deploy-to-edgio-v6)
  - [Deploy to Edgio v7](#deploy-to-edgio-v7)
- [Code](#code)
  - [HTML Frontend](#html-frontend)
  - [Server](#server)

## Local Development

### Set Environment Variables

Copy `.env.example` and include your API key in `.env`:

```bash
cp .env.example .env
```

### Install Dependencies and Start Development Server

```bash
npm i
node --watch src/index.mjs
```

### Test Local Server

```bash
curl "http://localhost:3001/chat" \
  -H 'Content-Type: application/json' \
  -d '{"input":"Hi there"}'
```

Terminal output:

```
Listening on port 3001

Input: "Hi there"
Result:" Hi there! How are you doing today?"
```

## Deploy to Edgio

Install the [Edgio CLI](https://docs.edg.io/guides/develop/cli) and login to your account:

```bash
npx edg login
```

Initialize project and build the project:

```bash
npm i
npm run build
```

### Deploy to Edgio v6

```bash
npx edg use 6
npm run deploy
# edg deploy --site=langchain-node-edgio
```

```bash
curl "https://ajcwebdev-langchain-node-edgio-default.layer0-limelight.link/chat" \
  -H 'Content-Type: application/json' \
  -d '{"input": "What is the edge?"}'
```

### Deploy to Edgio v7

```bash
npx edg use latest
npm run deploy
# edg deploy --property langchain-node-edgio
```

```bash
curl "https://anthony-campolo-langchain-node-edgio-default.edgio.link/chat" \
  -H 'Content-Type: application/json' \
  -d '{"input":"What is the edge?"}'
```

## Code

### HTML Frontend

```html
<!-- index.html -->

<html>
  <head>
    <title>LangChain Node Template on Edgio</title>
    <meta name="description" content="An example LangChain application deployed on Edgio with Node">
    <script>
      window.onload = function() {
        document.getElementById('chatForm').onsubmit = function(event) {
          event.preventDefault()
          const input = document.getElementById('chatInput').value
          fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input })
          })
            .then(response => response.json())
            .then(data => {
              const resultDiv = document.getElementById('result')
              resultDiv.innerHTML = `<p>${data.body}</p>`
            })
            .catch(error => console.error('Error:', error))
        }
      }
    </script>
  </head>
  <body>
    <h1>LangChain Node Template on Edgio</h1>
    <form id="chatForm">
      <textarea id="chatInput" placeholder="Type your message" required></textarea>
      <button type="submit">Send</button>
    </form>
    <div id="result"></div>
  </body>
</html>
```

### Server

```js
// src/index.mjs

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
```