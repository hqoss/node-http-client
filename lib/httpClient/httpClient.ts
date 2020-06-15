import { Agent, IncomingMessage, RequestOptions, request } from "http";
import { Readable } from "stream";

import { Consumable, Method, RequestInterceptor } from "./types";

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
  ): Promise<IncomingMessage> => {
    const url = this.buildUrl(pathOrUrl);
    const opts = this.combineOpts(Method.Get, reqOpts);

    const req = request(url, opts);

    if (this.willSendRequest) {
      this.willSendRequest(url, req);
    }

    return new Promise((resolve, reject) =>
      req
        .once("error", (error) => {
          // @ts-ignore
          if (error.code === "ECONNRESET") {
            // Retry
            return this.get(url, opts).then(resolve).catch(reject);
          }

          return reject(error);
        })
        .once("response", resolve)
        .end(),
    );
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
