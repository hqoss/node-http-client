[@hqoss/http-client](../README.md) › [Globals](../globals.md) › [HttpClient](httpclient.md)

# Class: HttpClient

## Hierarchy

* **HttpClient**

## Index

### Constructors

* [constructor](httpclient.md#constructor)

### Properties

* [baseHeaders](httpclient.md#baseheaders)
* [baseOptions](httpclient.md#baseoptions)
* [baseUrl](httpclient.md#baseurl)
* [transformResponse](httpclient.md#protected-transformresponse)
* [useJson](httpclient.md#usejson)
* [willSendRequest](httpclient.md#protected-optional-willsendrequest)

### Methods

* [delete](httpclient.md#delete)
* [get](httpclient.md#get)
* [patch](httpclient.md#patch)
* [post](httpclient.md#post)
* [put](httpclient.md#put)

## Constructors

###  constructor

\+ **new HttpClient**(`__namedParameters`: object): *[HttpClient](httpclient.md)*

*Defined in [httpClient/httpClient.ts:24](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L24)*

**Parameters:**

▪ **__namedParameters**: *object*

Name | Type |
------ | ------ |
`baseHeaders` | undefined &#124; object |
`baseOptions` | undefined &#124; object |
`baseUrl` | string |
`json` | undefined &#124; false &#124; true |

**Returns:** *[HttpClient](httpclient.md)*

## Properties

###  baseHeaders

• **baseHeaders**: *Record‹string, string›*

*Defined in [httpClient/httpClient.ts:19](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L19)*

___

###  baseOptions

• **baseOptions**: *Omit‹RequestInit, "headers"›*

*Defined in [httpClient/httpClient.ts:20](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L20)*

___

###  baseUrl

• **baseUrl**: *string*

*Defined in [httpClient/httpClient.ts:18](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L18)*

___

### `Protected` transformResponse

• **transformResponse**: *[ResponseTransformer](../globals.md#responsetransformer)*

*Defined in [httpClient/httpClient.ts:23](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L23)*

___

###  useJson

• **useJson**: *boolean*

*Defined in [httpClient/httpClient.ts:21](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L21)*

___

### `Protected` `Optional` willSendRequest

• **willSendRequest**? : *[RequestInterceptor](../globals.md#requestinterceptor)*

*Defined in [httpClient/httpClient.ts:24](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L24)*

## Methods

###  delete

▸ **delete**<**T**>(`url`: string, `req`: RequestInit): *Promise‹T›*

*Defined in [httpClient/httpClient.ts:132](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L132)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`req` | RequestInit | {} |

**Returns:** *Promise‹T›*

___

###  get

▸ **get**<**T**>(`url`: string, `req`: RequestInit): *Promise‹T›*

*Defined in [httpClient/httpClient.ts:64](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L64)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`req` | RequestInit | {} |

**Returns:** *Promise‹T›*

___

###  patch

▸ **patch**<**T**>(`url`: string, `body?`: any, `req`: RequestInit): *Promise‹T›*

*Defined in [httpClient/httpClient.ts:114](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L114)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`body?` | any | - |
`req` | RequestInit | {} |

**Returns:** *Promise‹T›*

___

###  post

▸ **post**<**T**>(`url`: string, `body?`: any, `req`: RequestInit): *Promise‹T›*

*Defined in [httpClient/httpClient.ts:78](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L78)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`body?` | any | - |
`req` | RequestInit | {} |

**Returns:** *Promise‹T›*

___

###  put

▸ **put**<**T**>(`url`: string, `body?`: any, `req`: RequestInit): *Promise‹T›*

*Defined in [httpClient/httpClient.ts:96](https://github.com/hqoss/node-agent/blob/0ea739e/src/httpClient/httpClient.ts#L96)*

**Type parameters:**

▪ **T**

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`url` | string | - |
`body?` | any | - |
`req` | RequestInit | {} |

**Returns:** *Promise‹T›*
