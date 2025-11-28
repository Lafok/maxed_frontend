import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

class WebSocketService {
  private client: Client;
  private connectionPromise: Promise<void>;
  private resolveConnectionPromise!: () => void;
  private rejectConnectionPromise!: (reason?: any) => void;
  private onConnectCallbacks: (() => void)[] = [];
  private connectionInitiated = false;

  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Создаем Promise подключения сразу в конструкторе.
    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.resolveConnectionPromise = resolve;
      this.rejectConnectionPromise = reject;
    });

    this.client.onConnect = () => {
      console.log('WebSocket Connected!');
      this.resolveConnectionPromise(); // Выполняем Promise при успешном подключении
      this.onConnectCallbacks.forEach(callback => callback());
    };

    this.client.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message']);
      this.rejectConnectionPromise(frame); // Отклоняем Promise при ошибке
    };
  }

  public registerOnConnect(callback: () => void): void {
    this.onConnectCallbacks.push(callback);
  }

  public connect(token: string): void {
    if (this.connectionInitiated) {
      return; // Не запускаем активацию повторно
    }
    this.connectionInitiated = true;
    console.log('WebSocket connection process initiated...');
    this.client.connectHeaders = {
      Authorization: `Bearer ${token}`,
    };
    this.client.activate();
  }

  public disconnect(): void {
    this.client.deactivate();
    // Сбрасываем состояние для возможности переподключения
    this.resetConnection();
  }

  private resetConnection(): void {
    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.resolveConnectionPromise = resolve;
      this.rejectConnectionPromise = reject;
    });
    this.connectionInitiated = false;
  }

  public async subscribe(topic: string, callback: (message: any) => void): Promise<StompSubscription | null> {
    try {
      // Теперь subscribe всегда ждет выполнения Promise.
      // Если connect еще не вызван, он будет просто ждать.
      // Если connect вызван и соединение установлено, он выполнится сразу.
      await this.connectionPromise;
      
      const subscription = this.client.subscribe(topic, (message: IMessage) => {
        callback(JSON.parse(message.body));
      });
      return subscription;
    } catch (error) {
      console.error(`Failed to subscribe to topic "${topic}". Connection may have failed.`, error);
      // Сбрасываем соединение, чтобы можно было попробовать снова.
      this.resetConnection();
      return null;
    }
  }

  public async sendMessage(destination: string, body: any): Promise<void> {
    await this.connectionPromise; // Ждем подключения перед отправкой
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
