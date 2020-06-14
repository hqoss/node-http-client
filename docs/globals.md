[@hqoss/http-client](README.md) › [Globals](globals.md)

# @hqoss/http-client

## Index

### Enumerations

* [Method](enums/method.md)

### Classes

* [BufferHttpClient](classes/bufferhttpclient.md)
* [HttpClient](classes/httpclient.md)
* [JsonHttpClient](classes/jsonhttpclient.md)

### Type aliases

* [Consumable](globals.md#consumable)
* [HttpClientOpts](globals.md#httpclientopts)
* [HttpsClientOpts](globals.md#httpsclientopts)
* [RequestInterceptor](globals.md#requestinterceptor)
* [ResponseTransformer](globals.md#responsetransformer)
* [TransformedResponse](globals.md#transformedresponse)

### Variables

* [echoServer](globals.md#const-echoserver)
* [httpClient](globals.md#const-httpclient)
* [port](globals.md#const-port)
* [runner](globals.md#const-runner)
* [tests](globals.md#const-tests)

### Functions

* [bufferResponseTransformer](globals.md#const-bufferresponsetransformer)
* [isConsumable](globals.md#const-isconsumable)
* [jsonResponseTransformer](globals.md#const-jsonresponsetransformer)
* [readableToBuffer](globals.md#const-readabletobuffer)

## Type aliases

###  Consumable

Ƭ **Consumable**: *Readable | Buffer | string*

*Defined in [lib/httpClient/types.ts:10](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/types.ts#L10)*

___

###  HttpClientOpts

Ƭ **HttpClientOpts**: *object*

*Defined in [lib/httpClient/types.ts:18](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/types.ts#L18)*

#### Type declaration:

* **baseReqOpts**? : *HttpRequestOptions*

* **baseUrl**: *string*

___

###  HttpsClientOpts

Ƭ **HttpsClientOpts**: *object*

*Defined in [lib/httpClient/types.ts:23](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/types.ts#L23)*

#### Type declaration:

* **baseReqOpts**? : *HttpsRequestOptions*

* **baseUrl**: *string*

___

###  RequestInterceptor

Ƭ **RequestInterceptor**: *function*

*Defined in [lib/httpClient/types.ts:29](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/types.ts#L29)*

#### Type declaration:

▸ (`url`: URL, `request`: ClientRequest): *void | Promise‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`url` | URL |
`request` | ClientRequest |

___

###  ResponseTransformer

Ƭ **ResponseTransformer**: *function*

*Defined in [lib/httpClient/types.ts:35](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/types.ts#L35)*

#### Type declaration:

▸ (`response`: IncomingMessage): *T | Promise‹T›*

**Parameters:**

Name | Type |
------ | ------ |
`response` | IncomingMessage |

___

###  TransformedResponse

Ƭ **TransformedResponse**: *object*

*Defined in [lib/httpClient/types.ts:39](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/types.ts#L39)*

#### Type declaration:

* **data**: *T*

* **headers**: *IncomingHttpHeaders*

* **statusCode**? : *undefined | number*

* **statusMessage**? : *undefined | string*

## Variables

### `Const` echoServer

• **echoServer**: *Server‹›* = createServer((req, res) => {
  const [method, statusCode = "200"] = req.url
    ? req.url.split("/").slice(1)
    : ["get", "200"];

  res.setHeader("x-method-ack", method.toLowerCase());
  res.writeHead(parseInt(statusCode));

  if (method === "get") {
    res.end("ok");
  } else {
    req.pipe(res);
  }
}).listen(port, () => {
  console.log(`Server listening on ${port}\n`);
  runner.emit("init");
})

Defined in test/httpClient/httpClient.custom.test.ts:14

*Defined in [test/httpClient/httpClient.test.ts:16](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L16)*

___

### `Const` httpClient

• **httpClient**: *[HttpClient](classes/httpclient.md)‹IncomingMessage‹››* = new HttpClient({ baseUrl: `http://localhost:${port}/` })

*Defined in [test/httpClient/httpClient.test.ts:34](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L34)*

___

### `Const` port

• **port**: *3000* = 3000

Defined in test/httpClient/httpClient.custom.test.ts:12

*Defined in [test/httpClient/httpClient.test.ts:14](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L14)*

___

### `Const` runner

• **runner**: *EventEmitter‹›* = new EventEmitter()

Defined in test/httpClient/httpClient.custom.test.ts:10

*Defined in [test/httpClient/httpClient.test.ts:12](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L12)*

___

### `Const` tests

• **tests**: *Map‹any, any›* = new Map()

Defined in test/httpClient/httpClient.custom.test.ts:55

*Defined in [test/httpClient/httpClient.test.ts:36](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L36)*

## Functions

### `Const` bufferResponseTransformer

▸ **bufferResponseTransformer**(`response`: IncomingMessage‹›): *Promise‹object›*

Defined in lib/httpClient/bufferResponseTransformer.ts:7

**Parameters:**

Name | Type |
------ | ------ |
`response` | IncomingMessage‹› |

**Returns:** *Promise‹object›*

___

### `Const` isConsumable

▸ **isConsumable**(`chunks`: [Consumable](globals.md#consumable)): *chunks is Consumable*

*Defined in [lib/httpClient/httpClient.ts:100](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L100)*

**Parameters:**

Name | Type |
------ | ------ |
`chunks` | [Consumable](globals.md#consumable) |

**Returns:** *chunks is Consumable*

___

### `Const` jsonResponseTransformer

▸ **jsonResponseTransformer**(`response`: IncomingMessage‹›): *Promise‹object›*

Defined in lib/httpClient/jsonResponseTransformer.ts:7

**Parameters:**

Name | Type |
------ | ------ |
`response` | IncomingMessage‹› |

**Returns:** *Promise‹object›*

___

### `Const` readableToBuffer

▸ **readableToBuffer**(`response`: Readable): *Promise‹Buffer‹››*

*Defined in [test/httpClient/httpClient.test.ts:178](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L178)*

**Parameters:**

Name | Type |
------ | ------ |
`response` | Readable |

**Returns:** *Promise‹Buffer‹››*
