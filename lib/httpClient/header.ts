import { IncomingHttpHeaders } from "http";

export const key = {
  Authorization: "authorization",
  Accept: "accept",
  ContentLength: "content-length",
  ContentType: "content-type",
  CorrelationId: "x-correlation-id",
  RequestId: "x-request-id",
  IdToken: "x-id-token",
  UserAgent: "user-agent",
};

export const pickHeaders = (
  headers: IncomingHttpHeaders,
  desiredHeaders: Array<string>,
): IncomingHttpHeaders => {
  return Object.keys(headers).reduce((acc, current) => {
    if (desiredHeaders.includes(current)) {
      return {
        ...acc,
        [current]: headers[current],
      };
    }

    return acc;
  }, {});
};
