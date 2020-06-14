import { IncomingMessage, IncomingHttpHeaders } from "http";
import { Readable } from "stream";

export type TransformedResponse<T> = {
  headers: IncomingHttpHeaders;
  statusCode?: number;
  statusMessage?: string;
  data: T;
};

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
