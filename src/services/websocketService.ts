import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

class WebSocketService {
  private client: Client;
  private connectionPromise: Promise<void>;
  private resolveConnectionPromise!: () => void;
  private rejectConnectionPromise!: (reason?: any) => void;
  private onConnectCallbacks: (() => void)[] = [];

  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.connectionPromise = Promise.resolve();

    this.client.onConnect = () => {
      console.log('WebSocket Connected!');
      if (this.resolveConnectionPromise) {
        this.resolveConnectionPromise();
      }
      this.onConnectCallbacks.forEach(callback => callback());
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message'], 'Additional details:', frame.body);
      if (this.rejectConnectionPromise) {
        this.rejectConnectionPromise(frame);
      }
    };
  }

  public registerOnConnect(callback: () => void): void {
    this.onConnectCallbacks.push(callback);
  }

  public connect(token: string): void {
    if (this.client.active) {
      console.log('WebSocket client is already active or connecting.');
      return;
    }
    
    console.log('WebSocket connection process initiated...');

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.resolveConnectionPromise = resolve;
      this.rejectConnectionPromise = reject;
    });

    this.client.connectHeaders = {
      Authorization: `Bearer ${token}`,
    };
    this.client.activate();
  }

  public disconnect(): void {
    if (this.client.active) {
      console.log('Deactivating WebSocket client...');
      this.client.deactivate().catch(error => console.error('Error during WebSocket deactivation:', error));
    }
  }

  public async subscribe(topic: string, callback: (message: any) => void): Promise<StompSubscription | null> {
    try {
      await this.connectionPromise;

      if (!this.client.connected) {
        console.error(`Cannot subscribe to topic "${topic}". Client is not connected.`);
        return null;
      }

      console.log(`Subscribing to ${topic}`);
      const subscription = this.client.subscribe(topic, (message: IMessage) => {
        try {
          callback(JSON.parse(message.body));
        } catch (e) {
          console.error('Failed to parse incoming message body:', message.body);
        }
      });
      return subscription;
    } catch (error) {
      console.error(`Failed to subscribe to topic "${topic}". Connection may have failed.`, error);
      return null;
    }
  }

  public async sendMessage(destination: string, body: any): Promise<void> {
    try {
      await this.connectionPromise;
      if (this.client.connected) {
        this.client.publish({
          destination,
          body: JSON.stringify(body),
        });
      } else {
        console.error('Cannot send message, STOMP client is not connected.');
      }
    } catch (error) {
      console.error(`Failed to send message to "${destination}". Connection may have failed.`, error);
    }
  }
}

const websocketService = new WebSocketService();
export default websocketService;
