import type { Readable } from "stream";
import { RequestOptions as HttpRequestOptions } from "http";
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
