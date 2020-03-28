![Node.js CI](https://github.com/hqoss/node-agent/workflows/Node.js%20CI/badge.svg)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/0784478abefd4a59be778118ee1265d8)](https://app.codacy.com/gh/hqoss/node-agent?utm_source=github.com&utm_medium=referral&utm_content=hqoss/node-agent&utm_campaign=Badge_Grade_Dashboard)

# 🔌 HTTP(s) Agent

A light-weight, performant, composable blueprint for writing **consistent _and_ re-usable** Node.js HTTP clients.

## Legend

- [🤔 Why use `agent`?](#-why-use-agent)
- [⏳ Install](#-install)
- [📝 Usage](#usage)
  - [Basic](#basic)
  - [Intercepting requests](#intercepting-requests)
  - [Transforming responses](#transforming-responses)
- [🤤 Performance](#-performance)
- [🧬 Core design principles](#-core-design-principles)
- [🧐 Why TypeScript?](#-why-typescript)
  - [Technical excellence and agile ways of working](#technical-excellence-and-agile-ways-of-working)
  - [Encourage Best Practices](#encourage-best-practices)
- [🤩 Node version support](#-node-version-support)
  - [Why ES2018?](#why-es2018)
- [❤️ Testing](#-testing)
- [🤯 TODO](#-todo)

## 🤔 Why use `agent`?

... as opposed to `request` or `node-fetch`?

- `request` is/was great, but it [has entered maintenance mode](https://github.com/request/request/issues/3142).
- Both `node-fetch` and `request` are relatively low-level (in JavaScript terms) implementations and as such lack certain convenience methods/APIs that help design maintainable and consistent HTTP clients. This is especially true in the microservices architecture context, where consistency is paramount.

`agent` builds on `node-fetch` to enable composable and re-usable HTTP(s) client implementations.

- Enforces a consistent approach to writing HTTP(s) clients.
- Greatly reduces common boilerplate, expressly
  - authentication,
  - default headers,
  - default options,
  - composing urls,
  - connection pooling,
  - parsing responses, and more.
- It is written in TypeScript.

## ⏳ Install

**⚠️ NOTE:** The TypeScript compiler is configured to target `ES2018` and the library uses `commonjs` module resolution (for now). Read more about [Node version support](#node-version-support).

```bash
npm install @asri/agent
# Additionally, for TypeScript users
npm install @types/node-fetch --save-dev
```

## 📝 Usage

**⚠️ WARNING:** Unlike `request`, `node-fetch` does _NOT_ reject non-ok responses by default as per [the whatwg spec](https://fetch.spec.whatwg.org/#fetch-method). If you wish, you can mimic this behaviour with a custom `responseTransformer` (see [Transforming responses](#transforming-responses)).

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

There is a great deal of discussion on whether `fetch` shuld or should not reject non-ok responses.

* https://github.com/whatwg/fetch/issues/18
* https://github.com/github/fetch/issues/155

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

Take advantage of the out-of-the-box increase in throughput with `agent`!

### Default `request` setup (used by _most_ projects):

😰 Requests/sec: **362.19**

```bash
wrk -t5 -c500 -d30s http://localhost:3001/request

Running 30s test @ http://localhost:3001/request
  5 threads and 500 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   660.35ms  389.35ms   1.50s    59.19%
    Req/Sec    87.36     66.56   350.00     80.29%
  10893 requests in 30.08s, 186.18MB read
  Socket errors: connect 254, read 109, write 0, timeout 0
Requests/sec:    362.19
Transfer/sec:      6.19MB
```

### Default `node-fetch` setup (used by _many_ projects):

😥 Requests/sec: **286.98**

```bash
wrk -t5 -c500 -d30s http://localhost:3001/fetch

Running 30s test @ http://localhost:3001/fetch
  5 threads and 500 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   691.28ms  281.70ms   1.50s    76.50%
    Req/Sec    76.03     45.21   252.00     71.53%
  8632 requests in 30.08s, 147.54MB read
  Socket errors: connect 254, read 316, write 0, timeout 61
Requests/sec:    286.98
Transfer/sec:      4.90MB
```

### Default `agent` setup:

🎉 Requests/sec: **2370.72**

```bash
wrk -t5 -c500 -d30s http://localhost:3001/http-client

Running 30s test @ http://localhost:3001/
  5 threads and 500 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    70.92ms   57.73ms   1.90s    94.05%
    Req/Sec   555.13    164.19   770.00     84.07%
  71359 requests in 30.10s, 1.19GB read
  Socket errors: connect 254, read 377, write 0, timeout 77
Requests/sec:   2370.72
Transfer/sec:     40.52MB
```

These tests were all performed on an identical **2.4 GHz 8-Core Intel Core i9; 64 GB 2667 MHz DDR4** machine. We tested the different implementations of an inter-service HTTP GET request with `request`, `node-fetch`, and `agent` respectively. The services involved were running locally, and the payload consisted of a list of 100 users, each with 6 basic properties. The benchmarks ran for 30 seconds, using 5 threads and keeping 500 HTTP connections open.

## 🧬 Core design principles

* **Code quality**; This package may end up being used in mission-critical software, so it's important that the code is performant, secure, and battle-tested.

* **Developer experience**; Developers must be able to use this package with no significant barriers to entry. It has to be easy-to-find, well-documented, and pleasant to use.

* **Modularity & Configurability**; It's important that users can compose and easily change the ways in which they consume and work with this package.

## 🧐 Why TypeScript?

In line with our guiding principles, this package is written in TypeScript.

While the use of TypeScript is not prescribed, it is worth noting that adopting it _may_ result in increased productivity, as well as happier engineering teams.

We've compiled a few reasons why _we_ ❤️ and recommend taking full advantage of TypeScript.

* **Great tooling and overall developer experience.** Strong and thriving open-source community, backed by Microsoft.

* **Increased productivity.** Type inference, intelligent code completion, and refactoring in confidence all contribute to increased productivity through minimising a specific class of bugs, reducing boilerplate, and maintaining a healthy codebase.

* **Helps attract and retain the best talent.** TypeScript consistently ranks as one of the most loved _and_ wanted languages in the annual StackOverflow developer surveys.

* **A taste of future JavaScript, with _optional_ types.** Always up-to-date with upcoming ECMA features, compliant with proposals/specs.

You can read more about TypeScript in [the handbook](https://www.typescriptlang.org/docs/handbook/).

## 🤩 Node version support

The TypeScript compiler is configured to target ES2018. In practice, this means projects consuming this package should run on Node 12 or higher, unless additional compilation/transpilation steps are in place to ensure compatibility with the target runtime.

Please see [https://node.green/#ES2018](https://node.green/#ES2018) for reference.

### Why ES2018?

Firstly, according to the official [Node release schedule](https://github.com/nodejs/Release), Node 12.x entered LTS on 2019-10-21 and is scheduled to enter Maintenance on 2020-10-20. With the End-of-Life scheduled for April 2022, we are confident that most users will now be running 12.x or higher.

Secondly, the [7.3 release of V8](https://v8.dev/blog/v8-release-73) (ships with Node 12.x or higher) includes "zero-cost async stack traces".

From the release notes:

> We are turning on the --async-stack-traces flag by default. Zero-cost async stack traces make it easier to diagnose problems in production with heavily asynchronous code, as the error.stack property that is usually sent to log files/services now provides more insight into what caused the problem.

## ❤️ Testing

[Ava](https://github.com/avajs/ava) and [Jest](https://jestjs.io/) were considered. Jest was chosen (for now) as it is very easy to configure and includes most of the features we need out-of-the-box.

Further investigation will be launched in foreseeable future to consider moving to Ava.

We prefer using [Nock](https://github.com/nock/nock) over mocking.

## 🤯 TODO

A quick and dirty tech debt tracker before we move to Issues.

* [ ] Write a **Contributing** guide
* [ ] Complete testing section, add best practices
* [ ] Describe scripts and usage, add best practices
* [ ] Add typespec and generate docs
* [ ] Describe security best practices, e.g. `npm doctor`, `npm audit`, `npm outdated`, `ignore-scripts` in `.npmrc`, etc.
* [ ] Add "Why should I use this" section
* [ ] Implement and document support for basic auth
* [ ] Document `willSendRequest` and `reponseTransformer`
* [ ] Library architectural design (+ diagram?)
