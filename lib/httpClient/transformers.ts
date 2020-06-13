import { Readable } from "stream";

export const toBuffer = async (source: Readable) => {
  if (!(source instanceof Readable)) {
    throw new TypeError("source be instanceof Readable");
  }

  const chunks = [];

  for await (const chunk of source) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
};
