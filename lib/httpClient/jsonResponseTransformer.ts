import { IncomingMessage } from "http";

import { ResponseTransformer, TransformedResponse } from "./types";

export const jsonResponseTransformer: ResponseTransformer<TransformedResponse<
  object
>> = async (response) => {
  if (!(response instanceof IncomingMessage)) {
    throw new TypeError("response must be instanceof IncomingMessage");
  }

  const { headers, statusCode, statusMessage } = response;

  const chunks = [];

  for await (const chunk of response) {
    chunks.push(chunk);
  }

  const jsonString = Buffer.concat(chunks).toString();

  return {
    headers,
    statusCode,
    statusMessage,
    data: JSON.parse(jsonString),
  };
};
