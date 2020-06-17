import type { IncomingHttpHeaders, RequestOptions } from "http";
import type { Readable } from "stream";
import type { RequestOptions as SecureRequestOptions } from "https";

export type Consumable = Readable | Buffer | string;

export enum Method {
  Get = "GET",
  Post = "POST",
  Delete = "DELETE",
  // TODO add more...
}

export enum StatusClass {
  Unknown = 0,
  Informational = 1,
  Successful = 2,
  Redirection = 3,
  BadRequest = 4,
  ServerError = 5,
}

export type ConsumedResponse<T> = {
  headers: IncomingHttpHeaders;
  statusClass: StatusClass;
  statusCode?: number;
  statusMessage?: string;
  data: T;
};

type RequestInterceptor<T> = (url: URL, opts: T) => void;
export type HttpRequestInterceptor = RequestInterceptor<RequestOptions>;
export type HttpsRequestInterceptor = RequestInterceptor<SecureRequestOptions>;
