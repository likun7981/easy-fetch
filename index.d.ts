/// <reference types="whatwg-fetch" />
export interface RequestReturn {
  success(callback): RequestReturn;
  error(callback): RequestReturn;
  complete(callback): RequestReturn;
  abort(message: string): void;
}
export interface GlobalConfigs {
  body?: BodyInit;
  timeout?: number;
  headers?: Headers;
}

type req = (url: string, params?: Object) => RequestReturn;

declare function createRequest(options: {
  headers?: Headers;
  credentials?: RequestCredentials;
  timeout?: number;
  onStart?: () => void;
  onComplete?: (error: Error, any) => void;
  onSuccess?: (any) => void;
  onError?: (error: Error) => void;
  successFilter?: (response: Response) => Promise<any | never>;
}): req;

declare let request: req;

declare function globalConfig(gconfig: GlobalConfigs): void;
