import { ResponseTransformer } from "./types";

const identityResponseTransformer: ResponseTransformer = (response) => response;

export default identityResponseTransformer;
