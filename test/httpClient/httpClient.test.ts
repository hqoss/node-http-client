import assert from "assert";
import { EventEmitter } from "events";
import { createReadStream } from "fs";
import { createServer } from "http";
import { Readable } from "stream";

import { HttpClient, transform } from "../../lib";
import { StatusClass } from "../../lib/httpClient/types";

const runner = new EventEmitter();

const port = 3000;

const echoServer = createServer((req, res) => {
  const method = req.method?.toLowerCase() || "unknown";
  const statusCode = req.url?.toLowerCase().slice(1) || "unknown";

  res.setHeader("x-method-ack", method);
  res.writeHead(parseInt(statusCode));

  if (method === "get") {
    res.end("hello");
  } else {
    req.pipe(res);
  }
}).listen(port, () => {
  console.log(`Server listening on ${port}\n`);
  runner.emit("init");
});

const httpClient = new HttpClient(`http://localhost:${port}/`);

const tests = new Map();

tests.set("performs GET request gets back 200", async () => {
  const res = await httpClient.get("/200");
  const { headers, statusCode, statusMessage } = res;
  const resBuffer = await readableToBuffer(res);

  assert.equal(headers["x-method-ack"], "get");
  assert.equal(statusCode, 200);
  assert.equal(statusMessage, "OK");

  assert.deepStrictEqual(resBuffer, Buffer.from("hello"));
});

tests.set("performs GET request, gets back 204", async () => {
  const res = await httpClient.get("/204");
  const { headers, statusCode, statusMessage } = res;
  const resBuffer = await readableToBuffer(res);

  assert.equal(headers["x-method-ack"], "get");
  assert.equal(statusCode, 204);
  assert.equal(statusMessage, "No Content");

  assert.deepStrictEqual(resBuffer, Buffer.alloc(0));
});

tests.set("performs DELETE request, gets back 202", async () => {
  const res = await httpClient.delete("/202");
  const { headers, statusCode, statusMessage } = res;
  const resBuffer = await readableToBuffer(res);

  assert.equal(headers["x-method-ack"], "delete");
  assert.equal(statusCode, 202);
  assert.equal(statusMessage, "Accepted");

  assert.deepStrictEqual(resBuffer, Buffer.alloc(0));
});

tests.set("performs POST request with a string", async () => {
  const data = "fooBar";
  const res = await httpClient.post("/201", data);
  const { headers, statusCode, statusMessage } = res;
  const resBuffer = await readableToBuffer(res);

  assert.equal(headers["x-method-ack"], "post");
  assert.equal(statusCode, 201);
  assert.equal(statusMessage, "Created");

  assert.deepStrictEqual(resBuffer, Buffer.from(data));
});

tests.set("performs POST request with a Buffer", async () => {
  const data = Buffer.from("fooBar");
  const res = await httpClient.post("/200", data);
  const { headers, statusCode, statusMessage } = res;
  const resBuffer = await readableToBuffer(res);

  assert.equal(headers["x-method-ack"], "post");
  assert.equal(statusCode, 200);
  assert.equal(statusMessage, "OK");

  assert.deepStrictEqual(resBuffer, data);
});

tests.set("performs POST request with a Stream", async () => {
  const data = createReadStream("LICENSE.md");
  const res = await httpClient.post("/200", data);
  const { headers, statusCode, statusMessage } = res;
  const resBuffer = await readableToBuffer(res);

  assert.equal(headers["x-method-ack"], "post");
  assert.equal(statusCode, 200);
  assert.equal(statusMessage, "OK");

  assert.deepStrictEqual(
    resBuffer,
    await readableToBuffer(createReadStream("LICENSE.md")),
  );
});

tests.set("buffer transformer", async () => {
  const data = "Hello, World!";
  const { headers, ...response } = await httpClient
    .post("/201", data)
    .then(transform.toBuffer);

  assert.equal(headers["x-method-ack"], "post");
  assert.deepStrictEqual(response, {
    statusClass: StatusClass.Successful,
    statusCode: 201,
    statusMessage: "Created",
    data: Buffer.from(data),
  });
});

tests.set("json transformer", async () => {
  const data = { foo: "bar" };
  const { headers, ...response } = await httpClient
    .post("/201", JSON.stringify(data))
    .then((res) => transform.toJSON<typeof data>(res));

  assert.equal(headers["x-method-ack"], "post");
  assert.deepStrictEqual(response, {
    statusClass: StatusClass.Successful,
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

// class BufferHttpClient extends HttpClient<TransformedResponse<Buffer>> {
//   constructor() {
//     super({ baseUrl: `http://localhost:${port}/` });
//   }

//   transformResponse = bufferResponseTransformer;

//   sendData = (data: string) => this.post("/post/201", data);
// }

// class JsonHttpClient extends HttpClient<TransformedResponse<object>> {
//   constructor() {
//     super({
//       baseUrl: `http://localhost:${port}/`,
//       baseReqOpts: { headers: { "content-type": "application/json" } },
//     });
//   }

//   transformResponse = jsonResponseTransformer;

//   sendData = (data: object) => this.post("/post/201", JSON.stringify(data));
// }

const readableToBuffer = async (response: Readable) => {
  const chunks = [];
  for await (const chunk of response) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

// TODO
// req.setHeader('Content-Length', Buffer.byteLength(body));

// TODO Implement request cancellation?
// req.on('abort', () => reject(new Error("request aborted")))
// .once('abort', () => reject(new Error("request aborted")))
// TODO look at listeners?
// .addListener("abort", reject)

// .on("socket", (socket) => {
//   socket.once("connect", () => {
//     console.log("connected")
//   })
// })

// httpClient.get("https://api.spacexdata.com/v3/launches/latest").then(console.log).catch(console.log)

// const stream = createReadStream("package.json")

// httpClient.post("https://httpbin.org/post", "stringbody").then(console.log).catch(console.log)
// httpClient.post("https://httpbin.org/post", Buffer.from("yolo")).then(console.log).catch(console.log)
// httpClient.post("https://httpbin.org/post", stream).then(console.log).catch(console.log)
// httpClient.post("https://httpbin.org/post", stream).then(console.log).catch(console.log)
// httpClient.post("https://httpbin.org/post", stream).then(console.log).catch(console.log)
// httpClient.post("https://httpbin.org/post", stream).then(console.log).catch(console.log)
// httpClient.post("https://httpbin.org/post", stream).then(console.log).catch(console.log)
// httpClient.post("http://localhost:3000/", stream).then(console.log).catch(console.log)
// httpClient.post("http://localhost:3000/", stream).then(console.log).catch(console.log)
// httpClient.post("http://localhost:3000/", stream).then(console.log).catch(console.log)
// httpClient.post("http://localhost:3000/", stream).then(console.log).catch(console.log)
// httpClient.post("http://localhost:3000/", stream).then(console.log).catch(console.log)
// httpClient.post("http://localhost:3000/", stream).then(console.log).catch(console.log)
// httpClient.post("/", stream)
//   .then(toBuffer)
//   .then(console.log)
//   .catch(console.log)

// class LOL extends HttpClient<TransformedResponse> {
//   constructor() {
//     super({ baseUrl: "https://lol.z" })
//   }

//   transformResponse = bufferResponseTransformer

//   lol = () => this.get("")
// }

// const lol = new LOL()

// console.log(lol)
