![Node.js CI](https://github.com/hqoss/node-agent/workflows/Node.js%20CI/badge.svg)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/65406302416243f788cee055ce10821a)](https://www.codacy.com/gh/hqoss/node-agent?utm_source=github.com&utm_medium=referral&utm_content=hqoss/node-agent&utm_campaign=Badge_Grade)
[![Codacy Badge](https://api.codacy.com/project/badge/Coverage/65406302416243f788cee055ce10821a)](https://www.codacy.com/gh/hqoss/node-agent?utm_source=github.com&utm_medium=referral&utm_content=hqoss/node-agent&utm_campaign=Badge_Coverage)

# 🔌 Node Agent

A light-weight, performant, composable blueprint for writing **consistent _and_ re-usable** Node.js HTTP clients.

## Table of contents

-   [🤔 Why use `agent`](#-why-use-agent)

-   [⏳ Install](#-install)

-   [📝 Usage](#-usage)

    -   [Basic](#basic)
    -   [Intercepting requests](#intercepting-requests)
    -   [Transforming responses](#transforming-responses)

-   [🤤 Performance](#-performance)

-   [🧬 Core design principles](#-core-design-principles)

-   [Node version support](#node-version-support)

    -   [Why ES2018](#why-es2018)

-   [❤️ Testing](#️-testing)

-   [TODO](#todo)

## 🤔 Why use `agent`

... as opposed to `request` or `node-fetch`?

-   `request` is/was great, but it [has entered maintenance mode](https://github.com/request/request/issues/3142).
-   Both `node-fetch` and `request` are relatively low-level (in JavaScript terms) implementations and as such lack certain convenience methods/APIs that help design maintainable and consistent HTTP clients. This is especially true in the microservices architecture context, where consistency is paramount.

`agent` builds on `node-fetch` to enable composable and re-usable HTTP client implementations.

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

**⚠️ NOTE:** The project is configured to target `ES2018` and the library uses `commonjs` module resolution. Read more in the [Node version support](#node-version-support) section.

```bash
npm install @hqoss/agent
# Additionally, for TypeScript users
npm install @types/node-fetch --save-dev
```

## 📝 Usage

**⚠️ WARNING:** Unlike `request`, `agent` (using `node-fetch` under the hood) does _NOT_ reject non-ok responses by default as per [the whatwg spec](https://fetch.spec.whatwg.org/#fetch-method). You can, however, mimic this behaviour with a custom `responseTransformer` (see [Transforming responses](#transforming-responses)).

### Basic

Define:

```typescript
import { HttpClient } from "@asri/agent";

class GitHubClient extends HttpClient {
  constructor() {
    super({
      baseUrl: "https://api.github.com/",
      baseHeaders: { "accept": "application/vnd.github.v3+json" },
      // Set any `node-fetch` supported `Request` options.
      // Note that headers MUST be set in `baseHeaders`.
      baseOptions: { timeout: 5000 },
      // Automatically includes `accept: application/json` and 
      // `content-type: application/json` headers and parses responses to json.
      // It will also use the default `jsonResponseTransformer`
      // to parse responses into json. Does NOT reject non-ok responses.
      json: true,
    });
  }

  // Expose pre-configured, provider-specific methods to your consumers / API users.
  getOrganisationDetails = (orgId: string) => this.get(`/orgs/${orgId}`);

  getOrganisationRepositories = (orgId: string) => this.get(`/orgs/${orgId}/repos`, { timeout: 2500 });
}

export default GitHubClient;
```

Consume:

```typescript
// Suppose you have a shared library for Http clients.
import { GitHubClient } from "@clients/github";

// You can also use the client's constructor to provide additional configuration here.
const gitHubClient = new GitHubClient();

// Resulting headers:
// `accept: application/vnd.github.v3+json` -> provided in `baseHeaders`
// `content-type: application/json` -> set internally due to `json: true`.
// Will warn because there is no `x-correlation-id` header set.
// Will use `timeout: 5000` as defined in `baseOptions`.
const organisationDetails = await gitHubClient.getOrganisationDetails();

// Same as above, but uses `timeout: 2500` – see `getOrganisationRepositories` implementation.
const organisationRepositories = await gitHubClient.getOrganisationRepositories();
```

### Intercepting requests

You can intercept every request by implementing the `willSendRequest` lifecycle method.

```typescript
import { HeaderKey, HttpClient, RequestInterceptor } from "@asri/agent";

class GitHubClient extends HttpClient {
  constructor() {
    super({
      baseUrl: "https://api.github.com/",
      baseHeaders: { "accept": "application/vnd.github.v3+json" },
      json: true,
    });
  }

  private static correlationIdHeader = HeaderKey.CorrelationId;

  // Inspired by Apollo's REST Data Source, this lifecycle method
  // can be used to perform useful actions before a request is sent.
  protected willSendRequest: RequestInterceptor = (url, { headers }) => {
    const { correlationIdHeader } = HttpStatClient;

    console.info(`Outgoing request to ${url}`);

    if (!(correlationIdHeader in headers)) {
      console.warn(`missing ${correlationIdHeader} header`);
    };
  }

  // ... pre-configured methods follow.
}

export default GitHubClient;
```

### Transforming responses

There is a great deal of discussion on whether `fetch` should or should not reject non-ok responses \[[1](https://github.com/whatwg/fetch/issues/18),[2](https://github.com/github/fetch/issues/155)].
We believe such design choices should ultimately be made by individual engineering teams, so the `HttpClient` base class exposes a convenient mechanism to transform responses via the `transformResponse` method.

```typescript
import { HttpClient, ResponseTransformer } from "@asri/agent";

class GitHubClient extends HttpClient {
  constructor() {
    super({ baseUrl: "https://api.github.com/", json: true });
  }

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

  // ... pre-configured methods follow.
}

export default GitHubClient;
```

Consume:

```typescript
// Suppose you have a shared library for Http clients.
import { GitHubClient } from "@clients/github";

// You can also use the client's constructor to provide additional configuration here.
const gitHubClient = new GitHubClient();

// Non-ok responses, for example 404, will now reject.
const organisationDetails = gitHubClient.getOrganisationDetails()
  .then(console.log)
  // A non-ok response will now end up here.
  .catch(console.error);
```

## 🤤 Performance

We ship the default `HttpClient` with a pre-configured (Node.js) `Agent`, which may lead to a huge increase in throughput.

For reference, we performed a number of benchmarks comparing the out-of-the-box `request`, `node-fetch`, and `agent` clients. To fetch a list of 100 users from another service, these were the results:

-   Default `request` setup (used by _most_ projects): 10,893 requests in 30.08s; **362.19 requests/sec**
-   Default `node-fetch` setup (used by _many_ projects): 8,632 requests in 30.08s; **286.98 requests/sec**
-   Default `agent` setup: 71,359 requests in 30.10s; **2,370.72 requests/sec**

Please note that these benchmarks were run through `wrk`, each lasting 30 seconds, using 5 threads and keeping 500 connections open.

This is the default `Agent` configuration, which can easily be overriden in the `HttpClient` constructor. You can simply provide your own `Agent` instance in `baseOptions`.

```typescript
const opts = {
  keepAlive: true,
  maxSockets: 64,
  keepAliveMsecs: 5000,
};
```

## 🧬 Core design principles

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

## ❤️ Testing

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
