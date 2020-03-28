import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import nock, { Scope } from "nock";
import { FetchError, RequestInit, Response } from "node-fetch";
import urlJoin from "url-join";

import { HttpClient, jsonResponseTransformer } from "../../src/httpClient";
import {
  HeaderKey,
  HttpMethod,
  RequestInterceptor,
  ResponseTransformer,
} from "../../src/httpClient/types";

describe("HttpClient", () => {
  const baseUrl = "http://httpstat.us/";
  const baseUrlHttps = "https://httpstat.us/";

  describe("get", () => {
    let scope: Scope;

    beforeAll(() => {
      scope = nock(baseUrl);
    });

    afterEach(() => {
      scope.done();
    });

    afterAll(() => {
      nock.cleanAll();
    });

    it("configures a default agent with connection keep-alive", () => {
      const httpClient = new HttpClient({ baseUrl });

      expect(httpClient.baseOptions.agent).toBeInstanceOf(HttpAgent);
      expect(httpClient.baseOptions.agent).toMatchObject({
        keepAlive: true,
        maxSockets: 64,
        keepAliveMsecs: 5000,
      });
    });

    it("configures a default HTTPS agent with connection keep-alive when url protocol is https", () => {
      const httpClient = new HttpClient({ baseUrl: baseUrlHttps });

      expect(httpClient.baseOptions.agent).toBeInstanceOf(HttpsAgent);
      expect(httpClient.baseOptions.agent).toMatchObject({
        keepAlive: true,
        maxSockets: 64,
        keepAliveMsecs: 5000,
      });
    });

    it("allows using custom agent", () => {
      const httpClient = new HttpClient({
        baseUrl,
        baseOptions: {
          agent: new HttpAgent({
            keepAlive: false,
            maxSockets: 128,
            keepAliveMsecs: 500,
          }),
        },
      });

      expect(httpClient.baseOptions.agent).toMatchObject({
        keepAlive: false,
        maxSockets: 128,
        keepAliveMsecs: 500,
      });
    });

    it("correctly configures a raw get request", async () => {
      // We will check if the headers are correctly merged
      // when making the request.
      const httpClient = new HttpClient({
        baseUrl,
        baseHeaders: {
          [HeaderKey.Authorization]: "Bearer token",
          [HeaderKey.CorrelationId]: "29bf6cc3-531c-40ed-9633-dc235a7f12ba",
        },
      });

      const url = "/200";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "291d2954-982d-4e36-a6f1-67dcec088a5f",
      };

      const expectedReply = "OK";

      scope
        .get(url)
        .matchHeader(
          HeaderKey.Authorization,
          httpClient.baseHeaders[HeaderKey.Authorization],
        )
        // Ensures the request-specific x-correlation-id will take precedence
        // over the one in baseHeaders.
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(200, expectedReply);

      const response = await httpClient.get<Response>(url, {
        headers: requestHeaders,
      });

      expect(response).toBeInstanceOf(Response);
      expect(await response.text()).toEqual(expectedReply);
    });

    it("correctly configures and parses a json get request", async () => {
      // Setting json: true adds the corresponding accept header,
      // and uses the jsonResponseTransformer module to parse the response.
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/200";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "91b20c71-f770-48dd-aa14-c6a87afb3dc5",
      };

      const expectedReply = {
        code: 200,
        description: "OK",
      };

      scope
        .get(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(expectedReply.code, expectedReply);

      const response = await httpClient.get(url, { headers: requestHeaders });

      expect(response).toEqual(expectedReply);
    });

    it("correctly parses 204 No Content json get request", async () => {
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/204";

      scope
        .get(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(204, undefined, {
          [HeaderKey.ContentType]: "application/json",
        });

      const response = await httpClient.get(url);

      expect(response).toEqual("");
    });

    it("json get request does not throw when non-ok codes are received", async () => {
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/400";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "f7ca3270-572d-4742-871f-9c7e6482d1df",
      };

      const expectedReply = {
        code: 400,
        description: "Bad Request",
      };

      scope
        .get(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(expectedReply.code, expectedReply);

      const response = await httpClient.get(url, { headers: requestHeaders });

      expect(response).toEqual(expectedReply);
    });

    it("rejects when unexpected error occurs", async () => {
      // For example, we are expeting a json response, but we get a text response.
      const httpClient = new HttpClient({ baseUrl, json: true });

      // Additional sanity check to ensure we are correctly passing url params.
      const urlParams = new URLSearchParams({ foo: "bar" }).toString();
      const url = `/200?${urlParams}`;

      const expectedReply = "OK";

      scope
        .get(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(200, expectedReply);

      try {
        await httpClient.get(url);
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError);
        expect(error.message).toMatch(
          "Unexpected token O in JSON at position 0",
        );
      }
    });

    it("runs willSendRequest with the url and request init when defined", async () => {
      let args: {
        url: string;
        request: RequestInit;
      } = {
        url: null!,
        request: null!,
      };

      class TestHttpClient extends HttpClient {
        protected willSendRequest: RequestInterceptor = (url, request) => {
          args.url = url;
          args.request = request;

          Object.assign(request.headers, {
            [HeaderKey.UserAgent]: "TestHttpClient",
          });
        };
      }

      const httpClient = new TestHttpClient({
        baseUrl,
        baseOptions: { timeout: 750 },
      });

      const url = "/202";

      const expectedReply = {
        code: 202,
        description: "Accepted",
      };

      scope
        .get(url)
        .matchHeader(HeaderKey.UserAgent, "TestHttpClient")
        .reply(expectedReply.code, expectedReply);

      await httpClient.get(url);

      expect(args.url).toEqual(urlJoin(baseUrl, url));
      expect(args.request).toMatchObject({
        headers: {
          [HeaderKey.UserAgent]: "TestHttpClient",
        },
        method: HttpMethod.Get,
        timeout: 750,
      });
    });

    it("processes the response with a custom responseTransformer", async () => {
      class TestHttpClient extends HttpClient {
        constructor() {
          super({ baseUrl, json: true });
        }

        // You might be used to request throwing upon non-ok response,
        // this responseTransformer simulates that.
        protected transformResponse: ResponseTransformer = async (response) => {
          const jsonResponse = await jsonResponseTransformer(response);

          if (response.ok) {
            return jsonResponse;
          } else {
            throw jsonResponse;
          }
        };
      }

      const httpClient = new TestHttpClient();

      const url = "/400";

      const expectedReply = {
        code: 400,
        description: "Bad Request",
      };

      scope
        .get(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply);

      try {
        await httpClient.get(url);
      } catch (error) {
        expect(error).toEqual(expectedReply);
      }
    });
  });

  describe("post", () => {
    let scope: Scope;

    beforeAll(() => {
      scope = nock(baseUrl);
    });

    afterEach(() => {
      scope.done();
    });

    afterAll(() => {
      nock.cleanAll();
    });

    it("correctly configures a raw post request", async () => {
      // We will check if the headers are correctly merged
      // when making the request.
      const httpClient = new HttpClient({
        baseUrl,
        baseHeaders: {
          [HeaderKey.Authorization]: "Bearer token",
          [HeaderKey.CorrelationId]: "29bf6cc3-531c-40ed-9633-dc235a7f12ba",
        },
      });

      const url = "/post-and-reply-with-200";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "291d2954-982d-4e36-a6f1-67dcec088a5f",
      };
      const requestBody = new URLSearchParams({ foo: "bar" });

      const expectedReply = "Accepted";

      scope
        .post(url, requestBody.toString())
        .matchHeader(
          HeaderKey.Authorization,
          httpClient.baseHeaders[HeaderKey.Authorization],
        )
        // Ensures the request-specific x-correlation-id will take precedence
        // over the one in baseHeaders.
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(202, expectedReply);

      const response = await httpClient.post<Response>(url, requestBody, {
        headers: requestHeaders,
      });

      expect(response).toBeInstanceOf(Response);
      expect(await response.text()).toEqual(expectedReply);
    });

    it("correctly configures and parses a json post request", async () => {
      // Setting json: true adds the corresponding accept header,
      // and uses the jsonResponseTransformer module to parse the response.
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/post-and-reply-with-200";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "91b20c71-f770-48dd-aa14-c6a87afb3dc5",
      };
      const requestBody = { foo: "bar" };

      const expectedReply = {
        code: 200,
        description: "OK",
      };

      scope
        .post(url, requestBody)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(expectedReply.code, expectedReply);

      const response = await httpClient.post(url, requestBody, {
        headers: requestHeaders,
      });

      expect(response).toEqual(expectedReply);
    });

    it("uses the body configured in the request options", async () => {
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/post-and-reply-with-200";
      const requestBody = { foo: "bar" };
      const requestBodyOverride = { foo: "baz" };

      const expectedReply = {
        code: 200,
        description: "OK",
      };

      scope
        .post(url, requestBodyOverride)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply);

      const response = await httpClient.post(url, requestBody, {
        body: JSON.stringify(requestBodyOverride),
      });

      expect(response).toEqual(expectedReply);
    });

    it("runs willSendRequest with the url and request init when defined", async () => {
      let args: {
        url: string;
        request: RequestInit;
      } = {
        url: null!,
        request: null!,
      };

      class TestHttpClient extends HttpClient {
        protected willSendRequest: RequestInterceptor = (url, request) => {
          args.url = url;
          args.request = request;

          Object.assign(request.headers, {
            [HeaderKey.UserAgent]: "TestHttpClient",
          });
        };
      }

      const httpClient = new TestHttpClient({
        baseUrl,
        baseOptions: { timeout: 750 },
      });

      const url = "/202";

      const expectedReply = {
        code: 202,
        description: "Accepted",
      };

      scope
        .post(url)
        .matchHeader(HeaderKey.UserAgent, "TestHttpClient")
        .reply(expectedReply.code, expectedReply);

      await httpClient.post(url);

      expect(args.url).toEqual(urlJoin(baseUrl, url));
      expect(args.request).toMatchObject({
        headers: {
          [HeaderKey.UserAgent]: "TestHttpClient",
        },
        method: HttpMethod.Post,
        timeout: 750,
      });
    });

    it("in json mode, nullable request body is omitted", async () => {
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/post-and-reply-with-200";

      const expectedReply = {
        code: 200,
        description: "OK",
      };

      scope
        .post(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply)
        .post(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply);

      const responseWithNullBody = await httpClient.post(url, null);
      const responseWithUndefinedBody = await httpClient.post(url, undefined);

      expect(responseWithNullBody).toEqual(expectedReply);
      expect(responseWithNullBody).toEqual(responseWithUndefinedBody);
    });
  });

  describe("put", () => {
    let scope: Scope;

    beforeAll(() => {
      scope = nock(baseUrl);
    });

    afterEach(() => {
      scope.done();
    });

    afterAll(() => {
      nock.cleanAll();
    });

    it("correctly configures a raw put request", async () => {
      // We will check if the headers are correctly merged
      // when making the request.
      const httpClient = new HttpClient({
        baseUrl,
        baseHeaders: {
          [HeaderKey.Authorization]: "Bearer token",
          [HeaderKey.CorrelationId]: "29bf6cc3-531c-40ed-9633-dc235a7f12ba",
        },
      });

      const url = "/put-and-reply-with-200";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "291d2954-982d-4e36-a6f1-67dcec088a5f",
      };
      const requestBody = new URLSearchParams({ foo: "bar" });

      const expectedReply = "Accepted";

      scope
        .put(url, requestBody.toString())
        .matchHeader(
          HeaderKey.Authorization,
          httpClient.baseHeaders[HeaderKey.Authorization],
        )
        // Ensures the request-specific x-correlation-id will take precedence
        // over the one in baseHeaders.
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(202, expectedReply);

      const response = await httpClient.put<Response>(url, requestBody, {
        headers: requestHeaders,
      });

      expect(response).toBeInstanceOf(Response);
      expect(await response.text()).toEqual(expectedReply);
    });

    it("runs willSendRequest with the url and request init when defined", async () => {
      let args: {
        url: string;
        request: RequestInit;
      } = {
        url: null!,
        request: null!,
      };

      class TestHttpClient extends HttpClient {
        protected willSendRequest: RequestInterceptor = (url, request) => {
          args.url = url;
          args.request = request;

          Object.assign(request.headers, {
            [HeaderKey.UserAgent]: "TestHttpClient",
          });
        };
      }

      const httpClient = new TestHttpClient({
        baseUrl,
        baseOptions: { timeout: 750 },
      });

      const url = "/202";

      const expectedReply = {
        code: 202,
        description: "Accepted",
      };

      scope
        .put(url)
        .matchHeader(HeaderKey.UserAgent, "TestHttpClient")
        .reply(expectedReply.code, expectedReply);

      await httpClient.put(url);

      expect(args.url).toEqual(urlJoin(baseUrl, url));
      expect(args.request).toMatchObject({
        headers: {
          [HeaderKey.UserAgent]: "TestHttpClient",
        },
        method: HttpMethod.Put,
        timeout: 750,
      });
    });

    it("in json mode, nullable request body is omitted", async () => {
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/put-and-reply-with-200";
      const requestBody = { foo: "bar" };

      const expectedReply = {
        code: 200,
        description: "OK",
      };

      scope
        .put(url, requestBody)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply)
        .put(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply)
        .put(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply);

      const response = await httpClient.put(url, requestBody);
      const responseWithNullBody = await httpClient.put(url, null);
      const responseWithUndefinedBody = await httpClient.put(url, undefined);

      expect(response).toEqual(expectedReply);

      expect(response).toEqual(responseWithNullBody);
      expect(responseWithNullBody).toEqual(responseWithUndefinedBody);
    });
  });

  describe("patch", () => {
    let scope: Scope;

    beforeAll(() => {
      scope = nock(baseUrl);
    });

    afterEach(() => {
      scope.done();
    });

    afterAll(() => {
      nock.cleanAll();
    });

    it("correctly configures a raw patch request", async () => {
      // We will check if the headers are correctly merged
      // when making the request.
      const httpClient = new HttpClient({
        baseUrl,
        baseHeaders: {
          [HeaderKey.Authorization]: "Bearer token",
          [HeaderKey.CorrelationId]: "29bf6cc3-531c-40ed-9633-dc235a7f12ba",
        },
      });

      const url = "/patch-and-reply-with-200";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "291d2954-982d-4e36-a6f1-67dcec088a5f",
      };
      const requestBody = new URLSearchParams({ foo: "bar" });

      const expectedReply = "Accepted";

      scope
        .patch(url, requestBody.toString())
        .matchHeader(
          HeaderKey.Authorization,
          httpClient.baseHeaders[HeaderKey.Authorization],
        )
        // Ensures the request-specific x-correlation-id will take precedence
        // over the one in baseHeaders.
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(202, expectedReply);

      const response = await httpClient.patch<Response>(url, requestBody, {
        headers: requestHeaders,
      });

      expect(response).toBeInstanceOf(Response);
      expect(await response.text()).toEqual(expectedReply);
    });

    it("runs willSendRequest with the url and request init when defined", async () => {
      let args: {
        url: string;
        request: RequestInit;
      } = {
        url: null!,
        request: null!,
      };

      class TestHttpClient extends HttpClient {
        protected willSendRequest: RequestInterceptor = (url, request) => {
          args.url = url;
          args.request = request;

          Object.assign(request.headers, {
            [HeaderKey.UserAgent]: "TestHttpClient",
          });
        };
      }

      const httpClient = new TestHttpClient({
        baseUrl,
        baseOptions: { timeout: 750 },
      });

      const url = "/202";

      const expectedReply = {
        code: 202,
        description: "Accepted",
      };

      scope
        .patch(url)
        .matchHeader(HeaderKey.UserAgent, "TestHttpClient")
        .reply(expectedReply.code, expectedReply);

      await httpClient.patch(url);

      expect(args.url).toEqual(urlJoin(baseUrl, url));
      expect(args.request).toMatchObject({
        headers: {
          [HeaderKey.UserAgent]: "TestHttpClient",
        },
        method: HttpMethod.Patch,
        timeout: 750,
      });
    });

    it("in json mode, nullable request body is omitted", async () => {
      const httpClient = new HttpClient({ baseUrl, json: true });

      const url = "/patch-and-reply-with-200";
      const requestBody = { foo: "bar" };

      const expectedReply = {
        code: 200,
        description: "OK",
      };

      scope
        .patch(url, requestBody)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply)
        .patch(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply)
        .patch(url)
        .matchHeader(HeaderKey.Accept, "application/json")
        .matchHeader(HeaderKey.ContentType, "application/json")
        .reply(expectedReply.code, expectedReply);

      const response = await httpClient.patch(url, requestBody);
      const responseWithNullBody = await httpClient.patch(url, null);
      const responseWithUndefinedBody = await httpClient.patch(url, undefined);

      expect(response).toEqual(expectedReply);

      expect(response).toEqual(responseWithNullBody);
      expect(responseWithNullBody).toEqual(responseWithUndefinedBody);
    });
  });

  describe("delete", () => {
    let scope: Scope;

    beforeAll(() => {
      scope = nock(baseUrl);
    });

    afterEach(() => {
      scope.done();
    });

    afterAll(() => {
      nock.cleanAll();
    });

    it("correctly configures a raw delete request", async () => {
      // We will check if the headers are correctly merged
      // when making the request.
      const httpClient = new HttpClient({
        baseUrl,
        baseHeaders: {
          [HeaderKey.Authorization]: "Bearer token",
          [HeaderKey.CorrelationId]: "29bf6cc3-531c-40ed-9633-dc235a7f12ba",
        },
      });

      const url = "/delete-and-reply-with-200";
      const requestHeaders = {
        [HeaderKey.CorrelationId]: "291d2954-982d-4e36-a6f1-67dcec088a5f",
      };
      const requestBody = new URLSearchParams({ foo: "bar" });

      const expectedReply = "Accepted";

      scope
        .delete(url, requestBody.toString())
        .matchHeader(
          HeaderKey.Authorization,
          httpClient.baseHeaders[HeaderKey.Authorization],
        )
        // Ensures the request-specific x-correlation-id will take precedence
        // over the one in baseHeaders.
        .matchHeader(
          HeaderKey.CorrelationId,
          requestHeaders[HeaderKey.CorrelationId],
        )
        .reply(202, expectedReply);

      const response = await httpClient.delete<Response>(url, {
        body: requestBody,
        headers: requestHeaders,
      });

      expect(response).toBeInstanceOf(Response);
      expect(await response.text()).toEqual(expectedReply);
    });

    it("runs willSendRequest with the url and request init when defined", async () => {
      let args: {
        url: string;
        request: RequestInit;
      } = {
        url: null!,
        request: null!,
      };

      class TestHttpClient extends HttpClient {
        protected willSendRequest: RequestInterceptor = (url, request) => {
          args.url = url;
          args.request = request;

          Object.assign(request.headers, {
            [HeaderKey.UserAgent]: "TestHttpClient",
          });
        };
      }

      const httpClient = new TestHttpClient({
        baseUrl,
        baseOptions: { timeout: 750 },
      });

      const url = "/202";

      const expectedReply = {
        code: 202,
        description: "Accepted",
      };

      scope
        .delete(url)
        .matchHeader(HeaderKey.UserAgent, "TestHttpClient")
        .reply(expectedReply.code, expectedReply);

      await httpClient.delete(url);

      expect(args.url).toEqual(urlJoin(baseUrl, url));
      expect(args.request).toMatchObject({
        headers: {
          [HeaderKey.UserAgent]: "TestHttpClient",
        },
        method: HttpMethod.Delete,
        timeout: 750,
      });
    });
  });
});
