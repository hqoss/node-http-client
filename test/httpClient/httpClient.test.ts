import assert from "assert";
import { EventEmitter } from "events";
import { createReadStream } from "fs";
import { Agent, createServer } from "http";

import HttpClient from "../../lib/httpClient/httpClient";
import { EventType } from "../../lib/httpClient/telemetry";
import { Method, StatusClass } from "../../lib/httpClient/types";
import { toBufferResponse } from "../../lib";

const noop = () => {};

const tests = new Map();

tests.set("handle connection error", async () => {
  const possibleErrorCodes = ["EAI_AGAIN", "ENOTFOUND"];
  const client = new HttpClient("http://non-existent-host/");

  const telemetry = new EventEmitter();

  telemetry.once(EventType.RequestStreamInitialised, noop);
  telemetry.once(EventType.RequestStreamEnded, noop);
  telemetry.once(EventType.SocketObtained, noop);
  telemetry.once(EventType.RequestError, ({ error }) => {
    assert.ok(possibleErrorCodes.includes(error.code));
  });

  // These will be left dangling. See related assert below.
  telemetry.once(EventType.ConnectionEstablished, noop);
  telemetry.once(EventType.ResponseStreamReceived, noop);

  try {
    await client
      .request("/", Method.Get, undefined, undefined, telemetry)
      .then(() => {
        throw new Error("expected request error");
      });
  } catch (error) {
    assert.ok(possibleErrorCodes.includes(error.code));
    assert.deepStrictEqual(telemetry.eventNames(), [
      EventType.ConnectionEstablished,
      EventType.ResponseStreamReceived,
    ]);
  }
});

tests.set("handle destroyed request after connect", async () => {
  const runner = new EventEmitter();
  const port = 3000;

  const server = createServer((_req, res) => res.destroy()).listen(port, () => {
    runner.emit("init");
  });

  const client = new HttpClient(`http://localhost:${port}/`);

  const telemetry = new EventEmitter();

  telemetry.once(EventType.RequestStreamInitialised, noop);
  telemetry.once(EventType.RequestStreamEnded, noop);
  telemetry.once(EventType.SocketObtained, noop);
  telemetry.once(EventType.ConnectionEstablished, noop);
  telemetry.once(EventType.RequestError, ({ error }) => {
    assert.equal(error.code, "ECONNRESET");
  });

  // These will be left dangling. See related assert below.
  telemetry.once(EventType.ResponseStreamReceived, noop);

  runner.once("init", async () => {
    try {
      await client
        .request("/", Method.Get, undefined, undefined, telemetry)
        .then(toBufferResponse);
      runner.emit("end", new Error("expected request error"));
    } catch (error) {
      assert.equal(error.code, "ECONNRESET");
      assert.deepStrictEqual(telemetry.eventNames(), [
        EventType.ResponseStreamReceived,
      ]);
      runner.emit("end");
    }
  });

  return new Promise((resolve, reject) => {
    runner.once("end", (error) => {
      server.close();

      if (error) return reject(error);
      return resolve();
    });
  });
});

tests.set("perform GET request, get back response", () => {
  const runner = new EventEmitter();
  const port = 3000;
  const data = Buffer.from("Hello, world!");
  const date = new Date().toISOString();

  const server = createServer((_req, res) => {
    res.setHeader("date", date);
    res.end(data);
  }).listen(port, () => {
    runner.emit("init");
  });

  const client = new HttpClient(`http://localhost:${port}/`, { agent: false });

  const telemetry = new EventEmitter();

  telemetry.once(EventType.RequestStreamInitialised, ({ data: { opts } }) => {
    assert.deepStrictEqual(opts, { agent: false, method: Method.Get });
  });
  telemetry.once(EventType.RequestStreamEnded, noop);
  telemetry.once(EventType.SocketObtained, noop);
  telemetry.once(EventType.ConnectionEstablished, noop);
  telemetry.once(EventType.RequestError, (_) => {
    throw new Error("unexpected event");
  });
  telemetry.once(EventType.ResponseStreamReceived, noop);

  runner.once("init", async () => {
    try {
      const response = await client
        .request("/", Method.Get, undefined, undefined, telemetry)
        .then(toBufferResponse);

      assert.deepStrictEqual(response, {
        data,
        headers: {
          "content-length": `${Buffer.byteLength(data)}`,
          connection: "close",
          date,
        },
        statusClass: StatusClass.Successful,
        statusCode: 200,
        statusMessage: "OK",
      });
      assert.deepStrictEqual(telemetry.eventNames(), [EventType.RequestError]);
      runner.emit("end");
    } catch (error) {
      runner.emit("end", error);
    }
  });

  return new Promise((resolve, reject) => {
    runner.once("end", (error) => {
      server.close();

      if (error) return reject(error);
      return resolve();
    });
  });
});

tests.set(
  "handle consumable stream errors when writing data to request",
  () => {
    const runner = new EventEmitter();
    const port = 3000;
    const data = createReadStream("unknown-file");

    const server = createServer((req, res) => req.pipe(res)).listen(
      port,
      () => {
        runner.emit("init");
      },
    );

    const client = new HttpClient(`http://localhost:${port}/`);

    const telemetry = new EventEmitter();

    telemetry.once(EventType.RequestStreamInitialised, noop);
    telemetry.once(EventType.RequestStreamEnded, noop);
    telemetry.once(EventType.SocketObtained, noop);
    telemetry.once(EventType.RequestError, ({ error }) => {
      assert.equal(error.code, "ENOENT");
    });

    // These will be left dangling. See related assert below.
    telemetry.once(EventType.ConnectionEstablished, noop);
    telemetry.once(EventType.ResponseStreamReceived, noop);

    runner.once("init", async () => {
      try {
        await client
          .request("/", Method.Post, undefined, data, telemetry)
          .then(toBufferResponse);
        runner.emit("end", new Error("expected request error"));
      } catch (error) {
        assert.equal(error.code, "ENOENT");
        assert.deepStrictEqual(telemetry.eventNames(), [
          EventType.ConnectionEstablished,
          EventType.ResponseStreamReceived,
        ]);
        runner.emit("end");
      }
    });

    return new Promise((resolve, reject) => {
      runner.once("end", (error) => {
        server.close();

        if (error) return reject(error);
        return resolve();
      });
    });
  },
);

tests.set("perform POST request, get back response", () => {
  const runner = new EventEmitter();
  const port = 3000;
  const data = Buffer.from("This will be streamed right back...");

  const server = createServer((req, res) => req.pipe(res)).listen(port, () => {
    runner.emit("init");
  });

  const client = new HttpClient(`http://localhost:${port}/`, { agent: false });

  const telemetry = new EventEmitter();

  telemetry.once(EventType.RequestStreamInitialised, ({ data: { opts } }) => {
    assert.deepStrictEqual(opts, {
      agent: false,
      headers: {
        "content-length": Buffer.byteLength(data),
      },
      method: Method.Post,
    });
  });
  telemetry.once(EventType.RequestStreamEnded, noop);
  telemetry.once(EventType.SocketObtained, noop);
  telemetry.once(EventType.ConnectionEstablished, noop);
  telemetry.once(EventType.RequestError, (_) => {
    throw new Error("unexpected event");
  });
  telemetry.once(EventType.ResponseStreamReceived, noop);

  runner.once("init", async () => {
    try {
      const {
        headers: { date: _date, ...headers },
        ...response
      } = await client
        .request("/", Method.Post, undefined, data, telemetry)
        .then(toBufferResponse);

      assert.deepStrictEqual(headers, {
        connection: "close",
        "transfer-encoding": "chunked",
      });
      assert.deepStrictEqual(response, {
        data,
        statusClass: StatusClass.Successful,
        statusCode: 200,
        statusMessage: "OK",
      });
      assert.deepStrictEqual(telemetry.eventNames(), [EventType.RequestError]);
      runner.emit("end");
    } catch (error) {
      runner.emit("end", error);
    }
  });

  return new Promise((resolve, reject) => {
    runner.once("end", (error) => {
      server.close();

      if (error) return reject(error);
      return resolve();
    });
  });
});

tests.set("handle keep-alive", () => {
  const runner = new EventEmitter();
  const port = 3000;
  const data = Buffer.from("Hello, world!");
  const date = new Date().toISOString();
  const numberOfRequests = 100;

  const server = createServer((_req, res) => {
    res.setHeader("date", date);
    res.end(data);
  }).listen(port, () => {
    runner.emit("init");
  });

  const client = new HttpClient(`http://localhost:${port}/`);

  const telemetry = new EventEmitter();

  telemetry.once(EventType.RequestStreamInitialised, ({ data: { opts } }) => {
    assert.ok(opts.agent instanceof Agent);
    assert.equal(opts.agent.keepAlive, true);
    assert.equal(opts.method, Method.Get);
  });

  runner.once("init", async () => {
    try {
      const tasks = [...Array(numberOfRequests).keys()].map(() => {
        return client
          .request("/", Method.Get, undefined, undefined, telemetry)
          .then(toBufferResponse);
      });

      const res = await Promise.all(tasks);

      assert.equal(res.length, numberOfRequests);
      assert.deepStrictEqual(telemetry.eventNames(), []);

      res.forEach((response) => {
        assert.deepStrictEqual(response, {
          data,
          headers: {
            "content-length": `${Buffer.byteLength(data)}`,
            connection: "keep-alive",
            date,
          },
          statusClass: StatusClass.Successful,
          statusCode: 200,
          statusMessage: "OK",
        });
      });

      runner.emit("end");
    } catch (error) {
      runner.emit("end", error);
    }
  });

  return new Promise((resolve, reject) => {
    runner.once("end", (error) => {
      server.close();

      if (error) return reject(error);
      return resolve();
    });
  });
});

(async () => {
  console.log("⏳ Running tests...\n");

  // Runs tests sequentially.
  // Consider using Promise.all for parallel execution.
  for (const [description, test] of tests) {
    console.log("Running:", description, "...");
    await test();
  }

  console.log("\n ✅ Ran all tests...");
  process.exit(0);
})().catch((error) => {
  console.log("❗️ Error running tests:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, _promise) => {
  console.log("Unhandled Rejection;", reason);
  process.exit(1);
});
