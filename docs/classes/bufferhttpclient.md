[@hqoss/http-client](../README.md) › [Globals](../globals.md) › [BufferHttpClient](bufferhttpclient.md)

# Class: BufferHttpClient

## Hierarchy

* [HttpClient](httpclient.md)‹[TransformedResponse](../globals.md#transformedresponse)‹Buffer››

* [HttpClient](httpclient.md)‹[TransformedResponse](../globals.md#transformedresponse)‹Buffer››

  ↳ **BufferHttpClient**

## Index

### Constructors

* [constructor](bufferhttpclient.md#constructor)

### Properties

* [baseUrl](bufferhttpclient.md#readonly-baseurl)
* [transformResponse](bufferhttpclient.md#transformresponse)

### Methods

* [get](bufferhttpclient.md#get)
* [post](bufferhttpclient.md#post)
* [sendData](bufferhttpclient.md#senddata)

## Constructors

###  constructor

\+ **new BufferHttpClient**(): *[BufferHttpClient](bufferhttpclient.md)*

*Overrides [HttpClient](httpclient.md).[constructor](httpclient.md#constructor)*

Defined in test/httpClient/httpClient.custom.test.ts:32

**Returns:** *[BufferHttpClient](bufferhttpclient.md)*

## Properties

### `Readonly` baseUrl

• **baseUrl**: *string*

*Inherited from [HttpClient](httpclient.md).[baseUrl](httpclient.md#readonly-baseurl)*

*Overrides [HttpClient](httpclient.md).[baseUrl](httpclient.md#readonly-baseurl)*

*Defined in [lib/httpClient/httpClient.ts:13](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L13)*

___

###  transformResponse

• **transformResponse**: *function* = bufferResponseTransformer

*Overrides [HttpClient](httpclient.md).[transformResponse](httpclient.md#transformresponse)*

Defined in test/httpClient/httpClient.custom.test.ts:37

*Defined in [test/httpClient/httpClient.test.ts:160](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L160)*

#### Type declaration:

▸ (`response`: IncomingMessage): *T | Promise‹T›*

**Parameters:**

Name | Type |
------ | ------ |
`response` | IncomingMessage |

## Methods

###  get

▸ **get**(`pathOrUrl`: string | URL, `reqOpts?`: RequestOptions): *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹Buffer››*

*Inherited from [HttpClient](httpclient.md).[get](httpclient.md#get)*

*Overrides [HttpClient](httpclient.md).[get](httpclient.md#get)*

*Defined in [lib/httpClient/httpClient.ts:37](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`pathOrUrl` | string &#124; URL |
`reqOpts?` | RequestOptions |

**Returns:** *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹Buffer››*

___

###  post

▸ **post**(`pathOrUrl`: string | URL, `body`: [Consumable](../globals.md#consumable), `reqOpts?`: RequestOptions): *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹Buffer››*

*Inherited from [HttpClient](httpclient.md).[post](httpclient.md#post)*

*Overrides [HttpClient](httpclient.md).[post](httpclient.md#post)*

*Defined in [lib/httpClient/httpClient.ts:48](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`pathOrUrl` | string &#124; URL |
`body` | [Consumable](../globals.md#consumable) |
`reqOpts?` | RequestOptions |

**Returns:** *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹Buffer››*

___

###  sendData

▸ **sendData**(`data`: string): *Promise‹object›*

Defined in test/httpClient/httpClient.custom.test.ts:39

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*

▸ **sendData**(`data`: string): *Promise‹object›*

*Defined in [test/httpClient/httpClient.test.ts:162](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L162)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | string |

**Returns:** *Promise‹object›*
