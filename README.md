![Node.js CI](https://github.com/hqoss/node-http-client/workflows/Node.js%20CI/badge.svg)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/65406302416243f788cee055ce10821a)](https://www.codacy.com/gh/hqoss/node-http-client?utm_source=github.com&utm_medium=referral&utm_content=hqoss/node-http-client&utm_campaign=Badge_Grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/65406302416243f788cee055ce10821a)](https://www.codacy.com/gh/hqoss/node-http-client?utm_source=github.com&utm_medium=referral&utm_content=hqoss/node-http-client&utm_campaign=Badge_Coverage)
[![GuardRails badge](https://badges.guardrails.io/hqoss/node-http-client.svg?token=030dd9506fbf19af907d144a89e2973e05876de87f886a9df07e88581d6119fe&provider=github)](https://dashboard.guardrails.io/gh/hqoss/36608)

# 🔌 Node Http Client

A light-weight, performant, composable blueprint for writing **consistent _and_ re-usable** Node.js HTTP clients

Extends `node-fetch`, therefore 100% compatible with the underlying APIs.

## Table of contents

-   [🤔 Why use `http-client`](#-why-use-http-client)

-   [⏳ Install](#-install)

-   [📝 Usage](#-usage)

    -   [SDK-like HTTP client](#sdk-like-http-client)
    -   [Advanced example](#advanced-example)
    -   [Gotchas and useful know-how](#gotchas-and-useful-know-how)
    -   [API Docs](#api-docs)

-   [⚡️ Performance](#️-performance)

-   [Core design principles](#core-design-principles)

-   [Node version support](#node-version-support)

    -   [Why ES2018](#why-es2018)

-   [Testing](#testing)

-   [TODO](#todo)

## 🤔 Why use `http-client`

... as opposed to `request` or `node-fetch`?

-   `request` is/was great, but it [has entered maintenance mode](https://github.com/request/request/issues/3142).
-   Both `node-fetch` and `request` are relatively low-level (in JavaScript terms) implementations and as such lack certain convenience methods/APIs that help design maintainable and consistent HTTP clients. This is especially true in the microservices architecture context, where consistency is paramount.

**`http-client` builds on `node-fetch` to enable composable and re-usable HTTP client implementations.**

-   Enforces a consistent approach to writing HTTP clients.

-   Greatly reduces common boilerplate, expressly
    -   authentication,
    -   default headers,
    -   default options,
    -   composing urls,
    -   connection pooling,
    -   parsing responses, and more.

-   It is written in TypeScript.

## ⏳ Install

```bash
npm install @hqoss/http-client
# Additionally, for TypeScript users
npm install @types/node-fetch --save-dev
```

**⚠️ NOTE:** The project is configured to target `ES2018` and the library uses `commonjs` module resolution. Read more in the [Node version support](#node-version-support) section.

## 📝 Usage

### SDK-like HTTP client

Let's take a look at how we build a simple SDK-like HTTP Client.

```typescript
import { HttpClient, Header, RequestInterceptor, ResponseTransformer } from "@hqoss/http-client";

import type { CreateIssueArgs } from "./types";

class GitHubClient extends HttpClient {
  constructor() {
    super({
      baseUrl: "https://api.github.com/",
      baseHeaders: { [Header.Authorization]: `token ${process.env.GITHUB_TOKEN}` },
      baseOptions: { timeout: 2500 },
      // Automatically includes `accept: application/json` and 
      // `content-type: application/json` headers and parses responses to json.
      json: true,
    });
  }

  // Inspired by Apollo's REST Data Source, this lifecycle method
  // can be used to perform useful actions before a request is sent.
  protected willSendRequest: RequestInterceptor = (url, _request) => {
    console.info(`Outgoing request to ${url}`);
  };

  // Mmimics the default behaviour of request, e.g. non-ok responses
  // are rejected rather than resolved.
  protected transformResponse: ResponseTransformer = async (response) => {
    // You need to be careful with 204 No Content, please consider
    // using our pre-built `jsonResponseTransformer` here instead.
    const jsonResponse = await response.json();

    if (response.ok) {
      return jsonResponse;
    } else {
      throw jsonResponse;
    }
  };

  // See https://developer.github.com/v3/issues/#create-an-issue.
  createIssue = ({ ownerId, repoId, ...args }: CreateIssueArgs) =>
    this.post<{ id: string; }>(
      `/repos/${ownerId}/${repoId}/issues`,
      args,
      { timeout: 5000 },
    );

  // See https://developer.github.com/v3/orgs/#get-an-organization.
  getOrganisationById = (organisationId: string) =>
    this.get<{ id: string; name: string; /* ... and more. */ }>(
      `/orgs/${organisationId}`,
      { headers: { [Header.Accept]: "application/vnd.github.surtur-preview+json" } }
    )

}

export default GitHubClient;
```

Then, in your application(s):

```typescript
// Initiate the client.
const gitHub = new GitHubClient();

// Use clean pre-configured APIs to perform actions.
const { id } = await gitHub.createIssue({ ownerId: "foo", repoId: "bar", title: "New bug!" });

const { id: orgId, name: orgName } = await gitHub.getOrganisationById("foobar");
```

### Advanced example

When it comes to distributed systems, visibility is hugely important. We can leverage the SDK-like design approach further to ensure we maintain a consistent approach to logging, error handling, as well as code structure.

First, let's hook up to the request lifecycle and log the events we care about.

```typescript
import {
  Header,
  HttpClient,
  jsonResponseTransformer,
  RequestInterceptor,
  ResponseTransformer,
} from "@hqoss/http-client";
import type { PinoLogger } from "@hqoss/logger";
import { pick } from "lodash";

import { BaseRequestContext } from "../types";

class UsersService extends HttpClient {
  private readonly log: PinoLogger;

  // Suppose each incoming request (from outside) creates and maintains
  // its unique context which carries its own instance of a logger,
  // the request headers, and other useful request data.
  constructor({ log, headers }: BaseRequestContext) {
    super({
      baseUrl: "http://s-users/",
      baseHeaders: pick(headers, [Header.Authorization, Header.IdToken, Header.CorrelationId]),
      json: true,
    });

    this.log = log;
  }

  protected willSendRequest: RequestInterceptor = (url, request) => {
    const { log } = this;
    const { headers } = request;

    log.debug(`Outgoing request to ${url}`);

    if (!(Header.CorrelationId in headers)) {
      log.warn(`Missing ${Header.CorrelationId} header`);
    }
  };

  protected transformResponse: ResponseTransformer = async (response) => {
    const { log } = this;
    const { ok, status, statusText } = response;

    const jsonResponse = await jsonResponseTransformer();

    log.debug(`Received response ${status} ${statusText}`);

    if (ok) {
      return jsonResponse;
    } else {
      log.error(jsonResponse);

      throw jsonResponse;
    }
  };

  // ... define APIs as shown in previous examples.

}
```

Then, we make sure we construct our client(s) and pass in a unique logger instance with the correct correlation id passed in as metadata. We can simply attach the resulting context to the request object itself, making it available in all subsequent request handlers.

```typescript
import { PinoLogger } from "@hqoss/logger";

import { UsersService } from "./httpClients";
import type { BaseRequestContext, RequestContext } from "./types";

// ... initialise express, basic middleware etc.

// Build a unique context for every request.
app.use((req, res, next) => {
  const { headers } = req;

  // Get or generate a request correlation id.
  const correlationId = headers[Header.CorrelationId] || generateUUID();

  // Always send the correlation id back to the client.
  res.setHeader(Header.CorrelationId, correlationId);

  // Initialise the logger, each log within this request will
  // carry the same correlaiton id to make tracing easy.
  const log = new PinoLogger({ correlationId });

  // Construct base request context.
  const baseCtx: BaseRequestContext = {
    correlationId,
    headers,
    log,
  };

  // Construct HTTP Clients.
  const clients = {
    users: new UsersService(baseCtx),
    // ... define the rest here.
  };

  // Construct full request context and assign it to the request.
  const ctx: RequestContext = {
    ...baseCtx,
    clients,
    // ... add services, etc. here.
  };

  // Makes `ctx` available in all subsequent handlers.
  Object.assign(req, { ctx });

  next();
});

// ... other server setup, routing, etc.
```

Finally, we can use our client(s) in the handlers through accessing `ctx`.

```typescript
import type { Request } from "express";

import type { RequestContext } from "../types";

app.get("/users/:userId", async (req, res, next) => {
  const {
    ctx: { clients },
    params: { userId },
  } = req as Request & { ctx: RequestContext };

  try {
    const user = await clients.users.getUser(userId);

    if (user) {
      res.status(200).send(user);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    next(error);
  }
});
```

### Gotchas and useful know-how

1.  `json` mode is _not_ the default. It needs to be enabled explicitly in the `constructor`.

```typescript
import { HttpClient } from "@hqoss/http-client";

class UsersService extends HttpClient {
  constructor() {
    super({ baseUrl: "http://s-users/", json: true });
  }
}
```

2.  Non-ok responses are _not_ rejected by default. You can mimic this behaviour in the `transformResponse` lifecycle method.

```typescript
import { HttpClient, jsonResponseTransformer, ResponseTransformer } from "@hqoss/http-client";

class UsersService extends HttpClient {
  constructor() {
    // You still need `json: true` to let the client know what request
    // headers to configure.
    super({ baseUrl: "http://s-users/", json: true });
  }

  // Mmimics the default behaviour of request, e.g. non-ok responses
  // are rejected rather than resolved.
  protected transformResponse: ResponseTransformer = async (response) => {
    // You can also simply `await response.json()`, however that does not
    // guarantee correctly handling 204 No Content responses.
    const jsonResponse = await jsonResponseTransformer();

    if (response.ok) {
      return jsonResponse;
    } else {
      throw jsonResponse;
    }
  };
}
```

### API Docs

[See full API Documentation here](docs/globals.md).

**⚠️ WARNING:** Unlike `request`, `http-client` (using `node-fetch` under the hood) does _NOT_ reject non-ok responses by default as per [the whatwg spec](https://fetch.spec.whatwg.org/#fetch-method). You can, however, mimic this behaviour with a custom `responseTransformer` (see example above).

## ⚡️ Performance

We ship the default `HttpClient` with a pre-configured (Node.js) `Agent`, which may lead to a huge increase in throughput.

For reference, we performed a number of benchmarks comparing the out-of-the-box `request`, `node-fetch`, and `http-client` clients. To fetch a list of 100 users from one service to another (see diagram below), these were the results:

    | wrk | -HTTP-> | Server A -> HttpClient | -HTTP-> | Server B -> data in memory |

-   Default `request` setup (used by _most_ projects): 10,893 requests in 30.08s; **362.19 requests/sec**
-   Default `node-fetch` setup (used by _many_ projects): 8,632 requests in 30.08s; **286.98 requests/sec**
-   Default `http-client` setup: 71,359 requests in 30.10s; **2,370.72 requests/sec**

Please note that these benchmarks were run through `wrk`, each lasting 30 seconds, using 5 threads and keeping 500 connections open.

This is the default `Agent` configuration, which can easily be overriden in the `HttpClient` constructor. You can simply provide your own `Agent` instance in `baseOptions`.

```typescript
const opts = {
  keepAlive: true,
  maxSockets: 64,
  keepAliveMsecs: 5000,
};
```

## Core design principles

-   **Code quality**; This package may end up being used in mission-critical software, so it's important that the code is performant, secure, and battle-tested.

-   **Developer experience**; Developers must be able to use this package with no significant barriers to entry. It has to be easy-to-find, well-documented, and pleasant to use.

-   **Modularity & Configurability**; It's important that users can compose and easily change the ways in which they consume and work with this package.

## Node version support

The project is configured to target ES2018. In practice, this means consumers should run on Node 12 or higher, unless additional compilation/transpilation steps are in place to ensure compatibility with the target runtime.

Please see <https://node.green/#ES2018> for reference.

### Why ES2018

Firstly, according to the official [Node release schedule](https://github.com/nodejs/Release), Node 12.x entered LTS on 2019-10-21 and is scheduled to enter Maintenance on 2020-10-20. With the End-of-Life scheduled for April 2022, we are confident that most users will now be running 12.x or higher.

Secondly, the [7.3 release of V8](https://v8.dev/blog/v8-release-73) (ships with Node 12.x or higher) includes "zero-cost async stack traces".

From the release notes:

> We are turning on the --async-stack-traces flag by default. Zero-cost async stack traces make it easier to diagnose problems in production with heavily asynchronous code, as the error.stack property that is usually sent to log files/services now provides more insight into what caused the problem.

## Testing

[Ava](https://github.com/avajs/ava) and [Jest](https://jestjs.io/) were considered. Jest was chosen as it is very easy to configure and includes most of the features we need out-of-the-box.

Further investigation will be launched in foreseeable future to consider moving to Ava.

We prefer using [Nock](https://github.com/nock/nock) over mocking.

## TODO

A quick and dirty tech debt tracker before we move to Issues.

-   [ ] Write a **Contributing** guide
-   [ ] Complete testing section, add best practices
-   [ ] Describe scripts and usage, add best practices
-   [ ] Add typespec and generate docs
-   [ ] Describe security best practices, e.g. `npm doctor`, `npm audit`, `npm outdated`, `ignore-scripts` in `.npmrc`, etc.
-   [ ] Add "Why should I use this" section
-   [ ] Implement and document support for basic auth
-   [ ] Document `willSendRequest` and `reponseTransformer`
-   [ ] Library architectural design (+ diagram?)
