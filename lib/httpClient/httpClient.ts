import { Agent, IncomingMessage, RequestOptions, request } from "http";
import { Readable } from "stream";

import { isConsumable } from "./guards";
import { Method, HttpClientOpts, Consumable } from "./types";

export default class HttpClient {
  private readonly baseReqOpts: RequestOptions;
  readonly baseUrl: string;

  constructor({ baseUrl, baseReqOpts }: HttpClientOpts) {
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

    return new Promise((resolve, reject) =>
      request(url, opts).once("error", reject).once("response", resolve).end(),
    );
  };

  post = (
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

      if (body instanceof Readable) {
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
