import { performance } from "perf_hooks";

export class TelemetryEvent {
  readonly timestamp: number;
  readonly type: symbol;
  readonly data?: any;
  readonly error?: Error;

  constructor(type: symbol, data?: any, error?: Error) {
    this.timestamp = performance.now();
    this.type = type;
    if (data) this.data = data;
    if (error) this.error = error;
  }
}

export const EventType = {
  RequestStreamInitialised: Symbol("RequestStreamInitialised"),
  RequestStreamEnded: Symbol("RequestStreamEnded"),
  SocketObtained: Symbol("SocketObtained"),
  ConnectionEstablished: Symbol("ConnectionEstablished"),
  ResponseStreamReceived: Symbol("ResponseStreamReceived"),
  RequestError: Symbol("RequestError"),
};
