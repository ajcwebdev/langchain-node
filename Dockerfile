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