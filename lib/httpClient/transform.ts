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

export const toJson = async <T extends object = object>(
  response: IncomingMessage,
): Promise<TransformedResponse<T>> => {
  const { data, ...rest } = await toBuffer(response);

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
