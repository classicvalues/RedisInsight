import { RedisClient } from 'src/modules/pub-sub/model/redis-client';
import { UserClient } from 'src/modules/pub-sub/model/user-client';
import { ISubscription } from 'src/modules/pub-sub/interfaces/subscription.interface';
import { IMessage } from 'src/modules/pub-sub/interfaces/message.interface';
import { PubSubServerEvents, RedisClientEvents } from 'src/modules/pub-sub/constants';
import { Logger } from '@nestjs/common';
import ERROR_MESSAGES from 'src/constants/error-messages';
import { PubSubWsException } from 'src/modules/pub-sub/errors/pub-sub-ws.exception';

export class UserSession {
  private readonly logger: Logger = new Logger('UserSession');

  private readonly id: string;

  private readonly userClient: UserClient;

  private readonly redisClient: RedisClient;

  private subscriptions: Map<string, ISubscription> = new Map();

  constructor(userClient: UserClient, redisClient: RedisClient) {
    this.id = userClient.getId();
    this.userClient = userClient;
    this.redisClient = redisClient;
    redisClient.on(RedisClientEvents.Message, this.handleMessage.bind(this));
    redisClient.on(RedisClientEvents.End, this.handleDisconnect.bind(this));
  }

  getId() { return this.id; }

  getUserClient() { return this.userClient; }

  getRedisClient() { return this.redisClient; }

  async subscribe(subscription: ISubscription) {
    const client = await this.redisClient?.getClient();

    if (!client) { throw new Error('There is no Redis client initialized'); }

    if (!this.subscriptions.has(subscription.getId())) {
      this.subscriptions.set(subscription.getId(), subscription);
      await subscription.subscribe(client);
    }
  }

  async unsubscribe(subscription: ISubscription) {
    this.subscriptions.delete(subscription.getId());

    const client = await this.redisClient?.getClient();

    if (client) {
      await subscription.unsubscribe(client);

      if (!this.subscriptions.size) {
        this.redisClient.destroy();
      }
    }
  }

  handleMessage(id: string, message: IMessage) {
    const subscription = this.subscriptions.get(id);

    if (subscription) {
      subscription.pushMessage(message);
    }
  }

  handleDisconnect() {
    this.userClient.getSocket().emit(
      PubSubServerEvents.Exception,
      new PubSubWsException(ERROR_MESSAGES.NO_CONNECTION_TO_REDIS_DB),
    );

    this.destroy();
  }

  destroy() {
    this.logger.debug(`Destroy ${this}`);

    this.subscriptions = new Map();
    this.redisClient.destroy();
  }

  toString() {
    return `UserSession:${JSON.stringify({
      id: this.id,
      subscriptionsSize: this.subscriptions.size,
      subscriptions: [...this.subscriptions.keys()],
    })}`;
  }
}
