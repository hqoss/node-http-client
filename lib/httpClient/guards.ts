import { Readable } from "stream";

import { Consumable } from "./types";

export const assertIsConsumable = (
  maybeConsumable: Consumable,
): asserts maybeConsumable is Consumable => {
  if (!isConsumable(maybeConsumable)) {
    throw new TypeError("source must be one of: Readable, Buffer, string");
  }
};

export const assertIsReadable = (
  maybeReadable: Readable,
): asserts maybeReadable is Readable => {
  if (!isReadable(maybeReadable)) {
    throw new TypeError("source be instanceof Readable");
  }
};

export const isReadable = (source: Readable): source is Readable => {
  return source instanceof Readable;
};

export const isConsumable = (chunks: Consumable): chunks is Consumable => {
  return (
    Buffer.isBuffer(chunks) ||
    chunks instanceof Readable ||
    typeof chunks === "string"
  );
};
