# Deploy LangChain App to Edgio, Railway, and Fly with Node and Docker

## Outline

- [Local Development](#local-development)
  - [Set Environment Variables](#set-environment-variables)
  - [Install Dependencies and Start Development Server](#install-dependencies-and-start-development-server)
  - [Test Local Server](#test-local-server)
- [Deployment](#deployment)
  - [Deploy to Edgio](#deploy-to-edgio)
  - [Deploy to Railway](#deploy-to-railway)
  - [Deploy to Fly](#deploy-to-fly)
- [Code](#code)
  - [HTML Frontend](#html-frontend)
  - [Server](#server)
  - [Dockerfile](#dockerfile)

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

## Deployment

### Deploy to Edgio

Install the [Edgio CLI](https://docs.edg.io/guides/develop/cli) and login to your account:

```bash
npx edg login
```

Initialize project and build the project:

```bash
npm i
npm run build
```

Deploy to Edgio v6:

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

Deploy to Edgio v7:

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

### Deploy to Railway

Install the [`railway` CLI](https://docs.railway.app/develop/cli) and login to your account:

```bash
railway login
```

Initialize project and build Docker image:

```bash
railway init -n langchain-template-node-railway
railway link
railway up
```

Add API key to your project's environment variables.

<p align="center">
  <img width="800" alt="railway environment variables in the dashboard" src="https://user-images.githubusercontent.com/12433465/234241902-a6b08a86-382a-446d-a161-35c5ce16da6c.png">
</p>

```bash
curl "https://langchain-template-node-railway-production.up.railway.app/chat" \
  -H 'Content-Type: application/json' \
  -d '{"input": "hi there"}'
```

<p align="center">
  <img width="800" alt="railway logs with chatgpt output" src="https://user-images.githubusercontent.com/12433465/234242009-39aca511-02c9-4771-8e0d-b634a8d75a78.png">
</p>

### Deploy to Fly

Install the [`flyctl` CLI](https://fly.io/docs/hands-on/install-flyctl/) and login to your account:

```bash
fly auth login
```

Launch and deploy application:

```bash
fly launch --now \
  -e OPENAI_API_KEY=YOUR_KEY_HERE \
  --name langchain-template-node-fly
```

Check application state:

```bash
fly logs -a langchain-template-node-fly
fly status -a langchain-template-node-fly
curl "https://langchain-template-node-fly.fly.dev/chat" \
  -H 'Content-Type: application/json' \
  -d '{"input": "hi there"}'
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
```

### Dockerfile

```dockerfile
# Dockerfile

FROM debian:bullseye as builder

ARG NODE_VERSION=19.4.0
ARG YARN_VERSION=3.4.1

RUN apt-get update; apt install -y curl python-is-python3 pkg-config build-essential
RUN curl https://get.volta.sh | bash
ENV VOLTA_HOME /root/.volta
ENV PATH /root/.volta/bin:$PATH
RUN volta install node@${NODE_VERSION} yarn@${YARN_VERSION}

RUN mkdir /app
WORKDIR /app
COPY . .
RUN yarn

FROM debian:bullseye
LABEL fly_launch_runtime="nodejs"

COPY --from=builder /root/.volta /root/.volta
COPY --from=builder /app /app

WORKDIR /app
ENV NODE_ENV production
ENV PATH /root/.volta/bin:$PATH

ENTRYPOINT [ "node", "src/index.mjs" ]
```