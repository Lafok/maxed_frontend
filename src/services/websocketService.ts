import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

class WebSocketService {
  private client: Client;
  private connectionPromise: Promise<void> | null = null;
  private resolveConnectionPromise: (() => void) | null = null;

  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('WebSocket Connected!');
      if (this.resolveConnectionPromise) {
        this.resolveConnectionPromise();
        this.resolveConnectionPromise = null;
      }
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
    };
  }

  public connect(token: string): void {
    if (this.client.active) {
      return;
    }
    this.connectionPromise = new Promise<void>((resolve) => {
      this.resolveConnectionPromise = resolve;
    });

    // ПРАВКА: Вот здесь мы передаем токен для аутентификации!
    this.client.connectHeaders = {
      Authorization: `Bearer ${token}`,
    };
    this.client.activate();
  }

  public disconnect(): void {
    this.client.deactivate();
    this.connectionPromise = null;
  }

  public async subscribe(topic: string, callback: (message: any) => void): Promise<StompSubscription | null> {
    if (this.connectionPromise) {
      await this.connectionPromise;
    }

    if (!this.client.connected) {
      console.error('STOMP client is not connected, cannot subscribe.');
      return null;
    }

    const subscription = this.client.subscribe(topic, (message: IMessage) => {
      callback(JSON.parse(message.body));
    });

    return subscription;
  }

  public async sendMessage(destination: string, body: any): Promise<void> {
    if (this.connectionPromise) {
      await this.connectionPromise;
    }

    if (this.client.connected) {
      this.client.publish({
        destination,
        body: JSON.stringify(body),
      });
    } else {
      console.error('Cannot send message, STOMP client is not connected.');
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
