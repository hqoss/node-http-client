import type { IncomingHttpHeaders, RequestOptions } from "http";
import type { RequestOptions as SecureRequestOptions } from "https";
import { EventEmitter } from "events";
import type { Readable } from "stream";

export type Consumable =
  | Readable
  | Buffer
  | string
  | (EventEmitter & {
      pipe<T extends NodeJS.WritableStream>(
        destination: T,
        options?: { end?: boolean },
      ): T;
    });

export enum Method {
  Get = "GET",
  Post = "POST",
  Patch = "PATCH",
  Put = "PUT",
  Delete = "DELETE",
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
