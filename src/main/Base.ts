import { Connection, Model, createConnection } from 'mongoose';
import { Data, Options } from '../utils/Types';
import { Schema } from '..';

export class Base<T> {
  public options: Options;
  public connection: Connection;
  public schema: Model<Data<T>, any, any>;

  constructor(options: Options) {
    this.options = options;
    this.connection = this.connect();
    this.schema = this.connection.model(options.collection, Schema);

    this.connection.on('connection', () => {
      this.debug('Connecting...');
    });

    this.connection.on('connected', () => {
      this.debug('Connected');
    });

    this.connection.on('disconnected', () => {
      this.debug('Disconnected');
    });

    this.connection.on('reconnected', () => {
      this.debug('Reconnected');
    });

    this.connection.on('error', (err) => {
      this.debug('Error: ' + err);
    });
  }

  public debug(str: string) {
    if (this.options.debug) console.log(str);
  }

  private connect(): Connection {
    return createConnection(this.options.uri, {
      keepAlive: true,
    });
  }
}
