# Deploy LangChain App to Railway and Fly with Node and Docker

## Outline

- [Local Development](#local-development)
- [Deployment](#deployment)
  - [Deploy to Edgio](#deploy-to-edgio)
  - [Deploy to Railway](#deploy-to-railway)
  - [Deploy to Fly](#deploy-to-fly)
- [Code](#code)
  - [Dockerfile](#dockerfile)
  - [Server](#server)

## Local Development

Copy `.env.example` and include your API key in `.env`:

```bash
cp .env.example .env
```

Yarn:

```bash
yarn
node src/index.mjs
```

pnpm:

```bash
pnpm i
node src/index.mjs
```

Test local server:

```bash
curl \
  -H 'Content-Type: application/json' \
  -d '{"input": "hi there"}' \
  'http://localhost:8080/chat'
```

## Deployment

### Deploy to Edgio

Install the [Edgio CLI](https://docs.edg.io/guides/develop/cli) and login to your account:

```bash
edgio login
```

Initialize project and build the project:

```bash
npm install && edg build
```

Deploy with the command:

```bash
edg deploy --site=my-open-api-project-on-edgio
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
curl \
  -H 'Content-Type: application/json' \
  -d '{"input": "hi there"}' \
  'https://langchain-template-node-railway-production.up.railway.app/chat'
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
curl \
  -H 'Content-Type: application/json' \
  -d '{"input": "hi there"}' \
  'https://langchain-template-node-fly.fly.dev/chat'
```

## Code

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

### Server

```js
// src/index.mjs

import express from 'express'
import { OpenAI } from 'langchain/llms/openai'
import { ConversationChain } from 'langchain/chains'

const app = express()
const port = process.env.PORT || 8080

const model = new OpenAI({})

app.post('/chat', express.json(), async (req, res) => {
  const chain = new ConversationChain({ llm: model })
  const input = req.body.input
  const result = await chain.call({ input })
  console.log(result.response)

  res.send({ body: result.response })
})

app.listen(port, () => console.log(`Listening on port ${port}`))
```
