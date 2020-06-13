import { ResponseTransformer, Header } from "./types";

const jsonResponseTransformer: ResponseTransformer = (response) => {
  const contentType = response.headers.get(Header.ContentType);
  const contentLength = response.headers.get(Header.ContentLength);

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
