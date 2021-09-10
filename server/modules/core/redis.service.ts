
import { Service, Inject } from 'typedi';
import * as Redis from 'ioredis';
import { environment } from '../../environment';

@Service()
export class RedisService {

  private _client: Redis.Redis;

  constructor() {
    this._client = new Redis(environment.redis as any);
  }

  get client(): Redis.Redis {
    return this._client;
  }

}
