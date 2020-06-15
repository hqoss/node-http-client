import { Agent, IncomingMessage, RequestOptions, request } from "http";
import { EventEmitter } from "events";
import { Readable } from "stream";

import {
  Consumable,
  Method,
  RequestInterceptor,
  TransformedResponse,
} from "./types";
import { toBuffer } from "./transform";

export class HttpClient {
  private readonly baseReqOpts: RequestOptions;
  readonly baseUrl: string;
  willSendRequest?: RequestInterceptor;

  constructor(baseUrl: string, baseReqOpts?: RequestOptions) {
    const { protocol } = new URL(baseUrl);

    if (protocol !== "http:") {
      throw new Error(`
      only http protocol is supported, got ${protocol}
      use HttpsClient for https, or Http2Client for http2
      `);
    }

    const agent = new Agent({ keepAlive: true });

    this.baseReqOpts = {
      agent,
      ...baseReqOpts,
    };

    this.baseUrl = baseUrl;
  }

  get = (
    pathOrUrl: string | URL,
    reqOpts?: RequestOptions,
  ): Promise<TransformedResponse<Buffer>> => {
    const resolver = new EventEmitter();

    const url = this.buildUrl(pathOrUrl);
    const opts = this.combineOpts(Method.Get, reqOpts);

    const req = request(url, opts);

    // Successful request
    req.once("response", (response) => {
      // Error reading response
      // response.once("error", error => {
      //   resolver.emit("reject", error)

      //   req.removeAllListeners()
      //   response.removeAllListeners()
      // })

      // Premature connection close after response has been received
      response.once("aborted", () => {
        resolver.emit(
          "reject",
          new Error(
            "premature connection close after the response has been received",
          ),
        );

        req.removeAllListeners();
        response.removeAllListeners();
      });

      // const chunks: Array<Buffer> = []

      // response.once("data", chunk => {
      //   chunks.push(chunk)
      // })

      // response.on("end", () => {
      //   resolver.emit("resolve", Buffer.concat(chunks))

      //   req.removeAllListeners()
      //   response.removeAllListeners()
      // })

      toBuffer(response)
        .then((tranformedResponse) => {
          resolver.emit("resolve", tranformedResponse);

          req.removeAllListeners();
          response.removeAllListeners();
        })
        .catch((error) => {
          resolver.emit("reject", error);

          req.removeAllListeners();
          response.removeAllListeners();
        });
    });

    req.once("error", (error) => {
      resolver.emit("reject", error);
      req.removeAllListeners();
    });

    req.end();

    if (this.willSendRequest) {
      this.willSendRequest(url, req);
    }

    return new Promise((resolve, reject) => {
      resolver.once("resolve", resolve).once("reject", reject);
    });
  };

  delete = (
    pathOrUrl: string | URL,
    reqOpts?: RequestOptions,
  ): Promise<IncomingMessage> => {
    const url = this.buildUrl(pathOrUrl);
    const opts = this.combineOpts(Method.Delete, reqOpts);

    return new Promise((resolve, reject) => {
      const req = request(url, opts)
        .once("error", reject)
        .once("response", resolve);

      if (this.willSendRequest) {
        this.willSendRequest(url, req);
      }

      return req.end();
    });
  };

  post = async (
    pathOrUrl: string | URL,
    body: Consumable,
    reqOpts?: RequestOptions,
  ): Promise<IncomingMessage> => {
    const url = this.buildUrl(pathOrUrl);
    const opts = this.combineOpts(Method.Post, reqOpts);

    return this.write(url, body, opts);
  };

  private write = (
    url: URL,
    body: Consumable,
    opts: RequestOptions,
  ): Promise<IncomingMessage> => {
    if (!isConsumable(body)) {
      return Promise.reject(
        new TypeError("body must be one of: Readable, Buffer, string"),
      );
    }

    return new Promise((resolve, reject) => {
      const req = request(url, opts)
        .once("error", reject)
        .once("response", resolve);

      if (this.willSendRequest) {
        this.willSendRequest(url, req);
      }

      if (body instanceof Readable) {
        // If there is an error reading data,
        // destroy the request and pass the error.
        body.once("error", req.destroy);

        // Pipe ends the writable stream (req) implicitly.
        // See https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options.
        body.pipe(req);
      } else {
        // Buffers or strings can simply be written.
        req.write(body);
        req.end();
      }
    });
  };

  private buildUrl = (pathOrUrl: string | URL) =>
    pathOrUrl instanceof URL ? pathOrUrl : new URL(pathOrUrl, this.baseUrl);

  private combineOpts = (
    method: Method,
    reqOpts?: RequestOptions,
  ): RequestOptions => ({
    ...this.baseReqOpts,
    ...reqOpts,
    method,
  });
}

const isConsumable = (chunks: Consumable): chunks is Consumable => {
  return (
    Buffer.isBuffer(chunks) ||
    chunks instanceof Readable ||
    typeof chunks === "string"
  );
};
