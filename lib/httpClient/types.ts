import type { ClientRequest, IncomingHttpHeaders } from "http";
import type { Readable } from "stream";

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

export type RequestInterceptor = (url: URL, request: ClientRequest) => void;
