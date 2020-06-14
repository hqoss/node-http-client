import { IncomingMessage } from "http";
import { Readable } from "stream";

import { StatusClass, TransformedResponse } from "./types";

export const toBuffer = async (
  response: IncomingMessage,
): Promise<TransformedResponse<Buffer>> => {
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

export const toJSON = async <T = any>(
  response: IncomingMessage,
): Promise<TransformedResponse<T>> => {
  const { data, ...rest } = await toBuffer(response);

  if (Buffer.byteLength(data) === 0) {
    throw new TypeError("cannot convert empty buffer to JSON");
  }

  return {
    ...rest,
    data: JSON.parse(data.toString()),
  };
};

const readableToBuffer = async (source: Readable) => {
  const chunks = [];
  for await (const chunk of source) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const getStatusClass = (statusCode?: number): StatusClass => {
  if (!statusCode) return StatusClass.Unknown;
  if (statusCode >= 100 && statusCode < 200) return StatusClass.Informational;
  if (statusCode >= 200 && statusCode < 300) return StatusClass.Successful;
  if (statusCode >= 300 && statusCode < 400) return StatusClass.Redirection;
  if (statusCode >= 400 && statusCode < 500) return StatusClass.BadRequest;
  return StatusClass.ServerError;
};
