import assert from "assert";
import { EventEmitter } from "events";
import { createServer } from "http";

import { HttpClient } from "../../lib/httpClient/httpClient";
import { bufferResponseTransformer } from "../../lib/httpClient/bufferResponseTransformer";
import { jsonResponseTransformer } from "../../lib/httpClient/jsonResponseTransformer";
import { TransformedResponse } from "../../lib/httpClient/types";

const runner = new EventEmitter();

const port = 3000;

const echoServer = createServer((req, res) => {
  const [method, statusCode = "200"] = req.url
    ? req.url.split("/").slice(1)
    : ["get", "200"];

  res.setHeader("x-method-ack", method.toLowerCase());
  res.writeHead(parseInt(statusCode));

  if (method === "get") {
    res.end("ok");
  } else {
    req.pipe(res);
  }
}).listen(port, () => {
  console.log(`Server listening on ${port}\n`);
  runner.emit("init");
});

class BufferHttpClient extends HttpClient<TransformedResponse<Buffer>> {
  constructor() {
    super({ baseUrl: `http://localhost:${port}/` });
  }

  transformResponse = bufferResponseTransformer;

  sendData = (data: string) => this.post("/post/201", data);
}

class JsonHttpClient extends HttpClient<TransformedResponse<object>> {
  constructor() {
    super({
      baseUrl: `http://localhost:${port}/`,
      baseReqOpts: { headers: { "content-type": "application/json" } },
    });
  }

  transformResponse = jsonResponseTransformer;

  sendData = (data: object) => this.post("/post/201", JSON.stringify(data));
}

const tests = new Map();

tests.set("buffer transformer", async () => {
  const data = "Hello, World!";

  const bufferHttpClient = new BufferHttpClient();
  const { headers, ...response } = await bufferHttpClient.sendData(data);

  assert.equal(headers["x-method-ack"], "post");
  assert.deepStrictEqual(response, {
    statusCode: 201,
    statusMessage: "Created",
    data: Buffer.from(data),
  });
});

tests.set("json transformer", async () => {
  const data = { foo: "bar" };

  const jsonHttpClient = new JsonHttpClient();
  const { headers, ...response } = await jsonHttpClient.sendData(data);

  assert.equal(headers["x-method-ack"], "post");
  assert.deepStrictEqual(response, {
    statusCode: 201,
    statusMessage: "Created",
    data,
  });
});

runner.once("init", async () => {
  console.log("Running tests...\n");

  try {
    // Runs tests sequentially.
    // Consider using Promise.all for parallel execution.
    for (const [description, test] of tests) {
      console.log("\nRunning:", description, "...");
      await test();
    }
  } catch (error) {
    console.log("\nError:", error);
  } finally {
    runner.emit("end");
  }
});

runner.once("end", () => {
  console.log("\n\nClosing server...");
  echoServer.close();
  process.exit(0);
});
