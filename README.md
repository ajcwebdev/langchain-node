# Deploy LangChain App to Railway and Fly with Node and Docker

## Outline

- [Local Development](#local-development)
- [Deployment](#deployment)
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

### Deploy to Railway

```bash
railway login
railway init -n langchain-template-node-railway
railway link
railway up
```

### Deploy to Fly

Install `flyctl` on MacOS and login to your account:

```bash
brew install flyctl
fly auth login
```

Launch and deploy application:

```bash
fly launch --now \
  -e OPENAI_API_KEY=YOUR_KEY_HERE \
  --name langchain-template-node-railway
```

Check application state:

```bash
fly logs -a langchain-template-node-railway
fly status -a langchain-template-node-railway
curl -H 'Content-Type: application/json' -d '{"input": "hi there"}' 'https://langchain-template-node-railway.fly.dev/chat'
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

import express from "express"
import { OpenAI } from "langchain/llms/openai"
import { ConversationChain } from "langchain/chains"

const app = express()
const port = process.env.PORT || 8080

const model = new OpenAI({})

app.post("/chat", express.json(), async (req, res) => {
  const chain = new ConversationChain({ llm: model })
  const input = req.body.input
  const result = await chain.call({ input })
  console.log(result.response)

  res.send({ body: result.response })
})

app.listen(port, () => console.log(`Listening on port ${port}`))
```