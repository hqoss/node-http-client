import { ResponseTransformer, HeaderKey } from "./types";

const jsonResponseTransformer: ResponseTransformer = (response) => {
  const contentType = response.headers.get(HeaderKey.ContentType);
  const contentLength = response.headers.get(HeaderKey.ContentLength);

  if (
    contentType?.startsWith("application/json") &&
    response.status !== 204 &&
    contentLength !== "0"
  ) {
    return response.json();
  } else {
    return response.text();
  }
};

export default jsonResponseTransformer;
