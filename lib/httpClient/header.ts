import { IncomingHttpHeaders } from "http";

export const Authorization = "authorization";
export const Accept = "accept";
export const ContentLength = "content-length";
export const ContentType = "content-type";
export const CorrelationId = "x-correlation-id";
export const RequestId = "x-request-id";
export const IdToken = "x-id-token";
export const UserAgent = "user-agent";

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
