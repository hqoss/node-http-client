import { IncomingMessage } from "http";

import { ResponseTransformer, TransformedResponse } from "./types";

export const bufferResponseTransformer: ResponseTransformer<TransformedResponse<
  Buffer
>> = async (response) => {
  if (!(response instanceof IncomingMessage)) {
    throw new TypeError("response must be instanceof IncomingMessage");
  }

  const { headers, statusCode, statusMessage } = response;

  const chunks = [];

  for await (const chunk of response) {
    chunks.push(chunk);
  }

  return {
    headers,
    statusCode,
    statusMessage,
    data: Buffer.concat(chunks),
  };
};
