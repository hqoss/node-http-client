import type { Readable } from "stream";
import {
  ClientRequest,
  IncomingHttpHeaders,
  IncomingMessage,
  RequestOptions as HttpRequestOptions,
} from "http";
import { RequestOptions as HttpsRequestOptions } from "https";

export type Consumable = Readable | Buffer | string;

export enum Method {
  Get = "GET",
  Post = "POST",
  // TODO add more...
}

export type HttpClientOpts = {
  baseUrl: string;
  baseReqOpts?: HttpRequestOptions;
};

export type HttpsClientOpts = {
  baseUrl: string;
  baseReqOpts?: HttpsRequestOptions;
};

// TODO missing implementation.
export type RequestInterceptor = (
  url: URL,
  request: ClientRequest,
) => void | Promise<void>;

// TODO explore generic typing.
export type ResponseTransformer<T> = (
  response: IncomingMessage,
) => T | Promise<T>;

export type TransformedResponse<T> = {
  headers: IncomingHttpHeaders;
  statusCode?: number;
  statusMessage?: string;
  data: T;
};
