import type { Readable } from "stream";
import type { ClientRequest } from "http";

export type Consumable = Readable | Buffer | string;

export enum Method {
  Get = "GET",
  Post = "POST",
  Delete = "DELETE",
  // TODO add more...
}

export type RequestInterceptor = (url: URL, request: ClientRequest) => void;
