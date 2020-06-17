import { IncomingMessage } from "http";
import { Readable } from "stream";

import { StatusClass, ConsumedResponse } from "./types";

export const toBufferResponse = async (
  response: IncomingMessage,
): Promise<ConsumedResponse<Buffer>> => {
  if (!(response instanceof IncomingMessage)) {
    throw new TypeError("response must be instanceof IncomingMessage");
  }

  const { headers, statusCode, statusMessage } = response;
  const data = await readableToBuffer(response);

  return {
    headers,
    statusClass: getStatusClass(statusCode),
    statusCode,
    statusMessage,
    data,
  };
};

export const toJSONResponse = async <T = any>(
  response: ConsumedResponse<Buffer> | IncomingMessage,
): Promise<ConsumedResponse<T>> => {
  let consumedResponse: ConsumedResponse<Buffer>;

  if (response instanceof IncomingMessage) {
    consumedResponse = await toBufferResponse(response);
  } else {
    consumedResponse = response;
  }

  const { data, ...rest } = consumedResponse;

  if (Buffer.byteLength(data) === 0) {
    throw new TypeError("cannot convert empty buffer to JSON");
  }

  return {
    ...rest,
    data: JSON.parse(data.toString()),
  };
};

export const readableToBuffer = async (source: Readable) => {
  const chunks = [];
  for await (const chunk of source) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

export const getStatusClass = (statusCode?: number): StatusClass => {
  if (!statusCode) return StatusClass.Unknown;
  if (statusCode >= 100 && statusCode < 200) return StatusClass.Informational;
  if (statusCode >= 200 && statusCode < 300) return StatusClass.Successful;
  if (statusCode >= 300 && statusCode < 400) return StatusClass.Redirection;
  if (statusCode >= 400 && statusCode < 500) return StatusClass.BadRequest;
  return StatusClass.ServerError;
};
