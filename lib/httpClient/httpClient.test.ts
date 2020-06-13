import assert from "assert";
import { EventEmitter } from "events";
import { createServer } from "http";

import HttpClient from "./httpClient";
import { toBuffer } from "./transformers";

const runner = new EventEmitter();

const port = 3000;

const echoServer = createServer((req, res) => {
  switch (req.url?.toLowerCase()) {
    case "/get":
      res.writeHead(200);
      res.write("ok");
      break;
    case "/post":
      res.writeHead(200);
      req.pipe(res);
      break;
    default:
      res.writeHead(501);
      res.write("not implemented");
      break;
  }
}).listen(port, () => {
  console.log(`Server listening on ${port}`);
  runner.emit("init");
});

const httpClient = new HttpClient({ baseUrl: `http://localhost:${port}/` });

const tests = new Map();

tests.set("performs GET request", async () => {
  const { statusCode } = await httpClient.get("/get");
  assert.equal(statusCode, 200);
});

tests.set("performs POST request", async () => {
  const body = Buffer.from("fooBar");

  const res = await httpClient.post("/post", body);

  const { statusCode } = res;
  const response = await toBuffer(res);

  assert.equal(statusCode, 200);
  assert.deepStrictEqual(response, body);
});

runner.once("init", async () => {
  console.log("Running tests...");

  try {
    // TODO Use Promise.all?
    for (const [description, test] of tests) {
      console.log(description);
      await test();
    }
  } finally {
    runner.emit("end");
  }

  process.exit(0);
});

runner.once("end", () => {
  console.log("Closing server...");
  echoServer.close();
});

// import { createReadStream } from "fs";
// const stream = createReadStream("LICENSE.md");

// TODO ensure protocol is http or https
// const { protocol } = new URL(baseUrl)
// TODO Implement request cancellation
// req.on('abort', () => reject(new Error("request aborted")))
// .once('abort', () => reject(new Error("request aborted")))
// TODO look at listeners
// .addListener("abort", reject)

// .on("socket", (socket) => {
//   socket.once("connect", () => {
//     console.log("connected")
//   })
// })

// createServer((req, res) => {
//   console.log("REQ!")
//   // res.writeHead(200)
//   req.pipe(res)
//   }).listen(3000);
//
// const httpClient = new HttpClient({ baseUrl: "http://localhost:3000/" });

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

// httpClient.post("/", stream, { timeout: 2000 })
// .then(toBuffer)
// .then(console.log)
// .catch(console.log)

// httpClient
//   .post("/", stream)
//   .then(toBuffer)
//   .then((b) => b.toString())
//   .then(console.log)
//   .catch(console.log);

// httpClient.post("/", stream)
// .then(toBuffer)
// .then(console.log)
// .catch(console.log)
// httpClient.post("https://httpbin.org/post", stream)
//   .then(toBuffer)
//   .then(a => console.log(a.toString()))
//   .catch(console.log)

// httpClient.post("https://httpbin.org/post", "123").then(console.log).catch(console.log)
