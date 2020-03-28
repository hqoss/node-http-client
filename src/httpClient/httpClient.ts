import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import fetch, { RequestInit } from "node-fetch";
import urlJoin from "url-join";

import identityResponseTransformer from "./identityResponseTransformer";
import jsonResponseTransformer from "./jsonResponseTransformer";

import {
  HeaderKey,
  HttpClientInitOpts,
  HttpMethod,
  RequestInterceptor,
  ResponseTransformer,
} from "./types";

class HttpClient {
  readonly baseUrl: string;
  readonly baseHeaders: Record<string, string>;
  readonly baseOptions: Omit<RequestInit, "headers">;
  readonly useJson: boolean;

  protected transformResponse: ResponseTransformer;
  protected willSendRequest?: RequestInterceptor;

  constructor({ baseUrl, baseHeaders, baseOptions, json }: HttpClientInitOpts) {
    const { protocol } = new URL(baseUrl);

    const isHttps = protocol.startsWith("https");
    const useJson = Boolean(json);

    const agentOpts = {
      keepAlive: true,
      maxSockets: 64,
      keepAliveMsecs: 5000,
    };

    const jsonHeaders = useJson
      ? {
          [HeaderKey.Accept]: "application/json",
          [HeaderKey.ContentType]: "application/json",
        }
      : undefined;

    this.baseUrl = baseUrl;

    this.baseHeaders = {
      ...jsonHeaders,
      ...baseHeaders,
    };

    this.baseOptions = {
      agent: isHttps ? new HttpsAgent(agentOpts) : new HttpAgent(agentOpts),
      ...baseOptions,
    };

    this.transformResponse = useJson
      ? jsonResponseTransformer
      : identityResponseTransformer;

    this.useJson = useJson;
  }

  get = async <T>(url: string, req: RequestInit = {}): Promise<T> => {
    const { buildRequestArgs, transformResponse } = this;

    const args = await buildRequestArgs(url, HttpMethod.Get, undefined, req);
    const response = await fetch(args.url, args.request);

    return transformResponse(response);
  };

  post = async <T>(
    url: string,
    body?: any,
    req: RequestInit = {},
  ): Promise<T> => {
    const { buildRequestArgs, transformResponse } = this;

    const args = await buildRequestArgs(url, HttpMethod.Post, body, req);
    const response = await fetch(args.url, args.request);

    return transformResponse(response);
  };

  put = async <T>(
    url: string,
    body?: any,
    req: RequestInit = {},
  ): Promise<T> => {
    const { buildRequestArgs, transformResponse } = this;

    const args = await buildRequestArgs(url, HttpMethod.Put, body, req);
    const response = await fetch(args.url, args.request);

    return transformResponse(response);
  };

  patch = async <T>(
    url: string,
    body?: any,
    req: RequestInit = {},
  ): Promise<T> => {
    const { buildRequestArgs, transformResponse } = this;

    const args = await buildRequestArgs(url, HttpMethod.Patch, body, req);
    const response = await fetch(args.url, args.request);

    return transformResponse(response);
  };

  delete = async <T>(
    url: string,
    body?: any,
    req: RequestInit = {},
  ): Promise<T> => {
    const { buildRequestArgs, transformResponse } = this;

    const args = await buildRequestArgs(url, HttpMethod.Delete, body, req);
    const response = await fetch(args.url, args.request);

    return transformResponse(response);
  };

  buildRequestArgs = async (
    url: string,
    method: HttpMethod,
    body: any,
    opts: RequestInit,
  ): Promise<{ url: string; request: RequestInit }> => {
    const {
      baseUrl,
      baseHeaders,
      baseOptions,
      buildUrl,
      useJson,
      willSendRequest,
    } = this;

    const args = {
      url: buildUrl(baseUrl, url),
      request: {
        // First, use base/shared options
        ...baseOptions,
        // Next, set the method
        method,
        // If json mode is enabled, it needs to be serialised
        body: useJson && body ? JSON.stringify(body) : body,
        // Then, we merge the user-provided opts
        ...opts,
        // Lastly, we make sure headers are merged and applied correctly
        headers: {
          ...baseHeaders,
          ...opts.headers,
        },
      },
    };

    if (willSendRequest) {
      await willSendRequest(args.url, args.request);
    }

    return args;
  };

  buildUrl = (...args: Array<string>) => urlJoin(...args);
}

export default HttpClient;
