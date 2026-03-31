declare module 'sockjs-client' {
  export default class SockJS {
    constructor(url: string, _reserved?: any, options?: Record<string, any>);
    close(code?: number, reason?: string): void;
    onclose?: (event?: any) => void;
    onmessage?: (event?: any) => void;
    onopen?: (event?: Event) => void;
    send(data: string): void;
  }
}

declare module 'stompjs' {
  export interface StompMessage {
    body: string;
  }

  export interface StompSubscription {
    unsubscribe(): void;
  }

  export interface StompClient {
    connect(
      headers: Record<string, any>,
      connectCallback: (frame?: any) => void,
      errorCallback?: (error?: any) => void,
    ): void;
    debug?: ((message: string) => void) | null;
    disconnect(disconnectCallback?: () => void): void;
    send(destination: string, headers?: Record<string, any>, body?: string): void;
    subscribe(
      destination: string,
      callback: (message: StompMessage) => void,
      headers?: Record<string, any>,
    ): StompSubscription;
  }

  const Stomp: {
    over(socket: any): StompClient;
  };

  export default Stomp;
}
