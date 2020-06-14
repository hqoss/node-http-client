[@hqoss/http-client](../README.md) › [Globals](../globals.md) › [JsonHttpClient](jsonhttpclient.md)

# Class: JsonHttpClient

## Hierarchy

* [HttpClient](httpclient.md)‹[TransformedResponse](../globals.md#transformedresponse)‹object››

* [HttpClient](httpclient.md)‹[TransformedResponse](../globals.md#transformedresponse)‹object››

  ↳ **JsonHttpClient**

## Index

### Constructors

* [constructor](jsonhttpclient.md#constructor)

### Properties

* [baseUrl](jsonhttpclient.md#readonly-baseurl)
* [transformResponse](jsonhttpclient.md#transformresponse)

### Methods

* [get](jsonhttpclient.md#get)
* [post](jsonhttpclient.md#post)
* [sendData](jsonhttpclient.md#senddata)

## Constructors

###  constructor

\+ **new JsonHttpClient**(): *[JsonHttpClient](jsonhttpclient.md)*

*Overrides [HttpClient](httpclient.md).[constructor](httpclient.md#constructor)*

Defined in test/httpClient/httpClient.custom.test.ts:42

**Returns:** *[JsonHttpClient](jsonhttpclient.md)*

## Properties

### `Readonly` baseUrl

• **baseUrl**: *string*

*Inherited from [HttpClient](httpclient.md).[baseUrl](httpclient.md#readonly-baseurl)*

*Overrides [HttpClient](httpclient.md).[baseUrl](httpclient.md#readonly-baseurl)*

*Defined in [lib/httpClient/httpClient.ts:13](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L13)*

___

###  transformResponse

• **transformResponse**: *function* = jsonResponseTransformer

*Overrides [HttpClient](httpclient.md).[transformResponse](httpclient.md#transformresponse)*

Defined in test/httpClient/httpClient.custom.test.ts:50

*Defined in [test/httpClient/httpClient.test.ts:173](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L173)*

#### Type declaration:

▸ (`response`: IncomingMessage): *T | Promise‹T›*

**Parameters:**

Name | Type |
------ | ------ |
`response` | IncomingMessage |

## Methods

###  get

▸ **get**(`pathOrUrl`: string | URL, `reqOpts?`: RequestOptions): *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹object››*

*Inherited from [HttpClient](httpclient.md).[get](httpclient.md#get)*

*Overrides [HttpClient](httpclient.md).[get](httpclient.md#get)*

*Defined in [lib/httpClient/httpClient.ts:37](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`pathOrUrl` | string &#124; URL |
`reqOpts?` | RequestOptions |

**Returns:** *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹object››*

___

###  post

▸ **post**(`pathOrUrl`: string | URL, `body`: [Consumable](../globals.md#consumable), `reqOpts?`: RequestOptions): *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹object››*

*Inherited from [HttpClient](httpclient.md).[post](httpclient.md#post)*

*Overrides [HttpClient](httpclient.md).[post](httpclient.md#post)*

*Defined in [lib/httpClient/httpClient.ts:48](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`pathOrUrl` | string &#124; URL |
`body` | [Consumable](../globals.md#consumable) |
`reqOpts?` | RequestOptions |

**Returns:** *Promise‹[TransformedResponse](../globals.md#transformedresponse)‹object››*

___

###  sendData

▸ **sendData**(`data`: object): *Promise‹object›*

Defined in test/httpClient/httpClient.custom.test.ts:52

**Parameters:**

Name | Type |
------ | ------ |
`data` | object |

**Returns:** *Promise‹object›*

▸ **sendData**(`data`: object): *Promise‹object›*

*Defined in [test/httpClient/httpClient.test.ts:175](https://github.com/hqoss/node-http-client/blob/d317187/test/httpClient/httpClient.test.ts#L175)*

**Parameters:**

Name | Type |
------ | ------ |
`data` | object |

**Returns:** *Promise‹object›*
