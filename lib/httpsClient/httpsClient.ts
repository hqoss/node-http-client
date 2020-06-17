import { EventEmitter } from "events";
import { Agent, request, RequestOptions } from "https";
import { Readable } from "stream";

import { EventType, TelemetryEvent } from "../httpClient/telemetry";
import {
  Consumable,
  HttpsRequestInterceptor,
  Method,
} from "../httpClient/types";
import { IncomingMessage } from "http";

class HttpsClient {
  private baseUrl: string;
  private baseReqOpts?: RequestOptions;
  willSendRequest?: HttpsRequestInterceptor;

  constructor(baseUrl: string, baseReqOpts?: RequestOptions) {
    const { protocol } = new URL(baseUrl);

    if (protocol !== "https:") {
      throw new Error(`
      only https protocol is supported, got ${protocol}
      use HttpClient for http, or Http2Client for http2
      `);
    }

    this.baseUrl = baseUrl;
    this.baseReqOpts = {
      agent: new Agent({ keepAlive: true }),
      ...baseReqOpts,
    };
  }

  get = (
    pathOrUrl: string | URL,
    reqOpts?: RequestOptions,
    telemetry?: EventEmitter,
  ): Promise<IncomingMessage> =>
    this.request(pathOrUrl, Method.Get, reqOpts, undefined, telemetry);

  post = (
    pathOrUrl: string | URL,
    data?: Consumable,
    reqOpts?: RequestOptions,
    telemetry?: EventEmitter,
  ): Promise<IncomingMessage> =>
    this.request(pathOrUrl, Method.Post, reqOpts, data, telemetry);

  delete = (
    pathOrUrl: string | URL,
    data?: Consumable,
    reqOpts?: RequestOptions,
    telemetry?: EventEmitter,
  ): Promise<IncomingMessage> =>
    this.request(pathOrUrl, Method.Delete, reqOpts, data, telemetry);

  request = (
    pathOrUrl: string | URL,
    method: Method,
    reqOpts?: RequestOptions,
    data?: Consumable,
    telemetry?: EventEmitter,
  ): Promise<IncomingMessage> => {
    if (data && !isConsumable(data)) {
      return Promise.reject(
        new TypeError("body must be one of: Readable, Buffer, string"),
      );
    }

    const resolver = new EventEmitter();
    const url = this.buildUrl(pathOrUrl);
    const contentLength = getContentLength(data);

    const opts = this.combineOpts(method, reqOpts);

    if (typeof contentLength === "number" && contentLength !== NaN) {
      Object.assign(opts, {
        headers: {
          ...opts.headers,
          "content-length": contentLength,
        },
      });
    }

    const req = request(url, opts);

    if (this.willSendRequest) {
      this.willSendRequest(url, opts);
    }

    telemetry?.emit(
      EventType.RequestStreamInitialised,
      new TelemetryEvent(EventType.RequestStreamInitialised, { url, opts }),
    );

    req.once("socket", (socket) => {
      telemetry?.emit(
        EventType.SocketObtained,
        new TelemetryEvent(EventType.SocketObtained),
      );

      if (socket.connecting) {
        socket.once("connect", () => {
          telemetry?.emit(
            EventType.ConnectionEstablished,
            new TelemetryEvent(EventType.ConnectionEstablished),
          );
        });
      }
    });

    req.once("response", (res) => {
      telemetry?.emit(
        EventType.ResponseStreamReceived,
        new TelemetryEvent(EventType.ResponseStreamReceived),
      );

      resolver.emit("resolve", res);
    });

    req.once("error", (error) => {
      // See https://nodejs.org/api/http.html#http_request_destroy_error
      //
      // No further events will be emitted.
      // All listeners will be removed once the request is garbage collected.
      // Remaining data in the response will be dropped and the socket will be destroyed.
      req.destroy();

      telemetry?.emit(
        EventType.RequestError,
        new TelemetryEvent(EventType.RequestError, undefined, error),
      );

      resolver.emit("reject", error);
    });

    if (data instanceof Readable) {
      // If there is an error reading data, destroy the request and pass the error.
      data.once("error", (error) => {
        // See https://nodejs.org/api/http.html#http_request_destroy_error
        //
        // No further events will be emitted.
        // All listeners will be removed once the request is garbage collected.
        // Remaining data in the response will be dropped and the socket will be destroyed.
        req.destroy(error);
      });

      // Pipe ends the writable stream (req) implicitly.
      // See https://nodejs.org/api/stream.html#stream_readable_pipe_destination_options.
      data.pipe(req);
    } else {
      req.end(data);
    }

    telemetry?.emit(
      EventType.RequestStreamEnded,
      new TelemetryEvent(EventType.RequestStreamEnded),
    );

    return new Promise((resolve, reject) => {
      resolver.once("resolve", (response) => resolve(response));
      resolver.once("reject", (error) => reject(error));
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

const isConsumable = (
  maybeConsumable: Consumable,
): maybeConsumable is Consumable => {
  return (
    Buffer.isBuffer(maybeConsumable) ||
    maybeConsumable instanceof Readable ||
    typeof maybeConsumable === "string"
  );
};

const getContentLength = (data?: Consumable): number | undefined => {
  if (Buffer.isBuffer(data)) return Buffer.byteLength(data);
  if (typeof data === "string") return data.length;

  // In all other cases, we don't provide a built-in mechanism
  // to calculate the content length.
  //
  // In the case of fs.ReadStream, it should be possible to use fs.stat,
  // but for now we ask users to provide the content-length header explicitly.
  return undefined;
};

export default HttpsClient;
