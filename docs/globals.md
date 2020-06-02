[@hqoss/http-client](README.md) › [Globals](globals.md)

# @hqoss/http-client

## Index

### Enumerations

* [Header](enums/header.md)
* [HttpMethod](enums/httpmethod.md)

### Classes

* [HttpClient](classes/httpclient.md)

### Type aliases

* [HttpClientInitOpts](globals.md#httpclientinitopts)
* [RequestInterceptor](globals.md#requestinterceptor)
* [ResponseTransformer](globals.md#responsetransformer)

### Functions

* [identityResponseTransformer](globals.md#const-identityresponsetransformer)
* [jsonResponseTransformer](globals.md#const-jsonresponsetransformer)

## Type aliases

###  HttpClientInitOpts

Ƭ **HttpClientInitOpts**: *object*

*Defined in [httpClient/types.ts:10](https://github.com/hqoss/node-agent/blob/3b2a284/src/httpClient/types.ts#L10)*

#### Type declaration:

* **baseHeaders**? : *Record‹string, string›*

* **baseOptions**? : *Omit‹RequestInit, "headers"›*

* **baseUrl**: *string*

* **json**? : *undefined | false | true*

___

###  RequestInterceptor

Ƭ **RequestInterceptor**: *function*

*Defined in [httpClient/types.ts:3](https://github.com/hqoss/node-agent/blob/3b2a284/src/httpClient/types.ts#L3)*

#### Type declaration:

▸ (`url`: string, `request`: RequestInit): *void | Promise‹void›*

**Parameters:**

Name | Type |
------ | ------ |
`url` | string |
`request` | RequestInit |

___

###  ResponseTransformer

Ƭ **ResponseTransformer**: *function*

*Defined in [httpClient/types.ts:8](https://github.com/hqoss/node-agent/blob/3b2a284/src/httpClient/types.ts#L8)*

#### Type declaration:

▸ (`res`: Response): *any*

**Parameters:**

Name | Type |
------ | ------ |
`res` | Response |

## Functions

### `Const` identityResponseTransformer

▸ **identityResponseTransformer**(`response`: Response‹›): *Response‹›*

*Defined in [httpClient/identityResponseTransformer.ts:3](https://github.com/hqoss/node-agent/blob/3b2a284/src/httpClient/identityResponseTransformer.ts#L3)*

**Parameters:**

Name | Type |
------ | ------ |
`response` | Response‹› |

**Returns:** *Response‹›*

___

### `Const` jsonResponseTransformer

▸ **jsonResponseTransformer**(`response`: Response‹›): *Promise‹any›*

*Defined in [httpClient/jsonResponseTransformer.ts:3](https://github.com/hqoss/node-agent/blob/3b2a284/src/httpClient/jsonResponseTransformer.ts#L3)*

**Parameters:**

Name | Type |
------ | ------ |
`response` | Response‹› |

**Returns:** *Promise‹any›*
