[@hqoss/http-client](../README.md) › [Globals](../globals.md) › [HttpClient](httpclient.md)

# Class: HttpClient ‹**T**›

## Type parameters

▪ **T**

## Hierarchy

* **HttpClient**

  ↳ [BufferHttpClient](bufferhttpclient.md)

  ↳ [BufferHttpClient](bufferhttpclient.md)

  ↳ [JsonHttpClient](jsonhttpclient.md)

  ↳ [JsonHttpClient](jsonhttpclient.md)

## Index

### Constructors

* [constructor](httpclient.md#constructor)

### Properties

* [baseUrl](httpclient.md#readonly-baseurl)
* [transformResponse](httpclient.md#transformresponse)

### Methods

* [get](httpclient.md#get)
* [post](httpclient.md#post)

## Constructors

###  constructor

\+ **new HttpClient**(`__namedParameters`: object): *[HttpClient](httpclient.md)*

*Defined in [lib/httpClient/httpClient.ts:16](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L16)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`baseReqOpts` | undefined &#124; RequestOptions |
`baseUrl` | string |

**Returns:** *[HttpClient](httpclient.md)*

## Properties

### `Readonly` baseUrl

• **baseUrl**: *string*

*Defined in [lib/httpClient/httpClient.ts:13](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L13)*

___

###  transformResponse

• **transformResponse**: *[ResponseTransformer](../globals.md#responsetransformer)‹T›*

*Defined in [lib/httpClient/httpClient.ts:16](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L16)*

## Methods

###  get

▸ **get**(`pathOrUrl`: string | URL, `reqOpts?`: RequestOptions): *Promise‹T›*

*Defined in [lib/httpClient/httpClient.ts:37](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L37)*

**Parameters:**

Name | Type |
------ | ------ |
`pathOrUrl` | string &#124; URL |
`reqOpts?` | RequestOptions |

**Returns:** *Promise‹T›*

___

###  post

▸ **post**(`pathOrUrl`: string | URL, `body`: [Consumable](../globals.md#consumable), `reqOpts?`: RequestOptions): *Promise‹T›*

*Defined in [lib/httpClient/httpClient.ts:48](https://github.com/hqoss/node-http-client/blob/d317187/lib/httpClient/httpClient.ts#L48)*

**Parameters:**

Name | Type |
------ | ------ |
`pathOrUrl` | string &#124; URL |
`body` | [Consumable](../globals.md#consumable) |
`reqOpts?` | RequestOptions |

**Returns:** *Promise‹T›*
