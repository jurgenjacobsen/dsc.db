import { Connection, Model, createConnection } from 'mongoose';
import { Main } from '../schemas/Main';
import { Data, Options } from '../interfaces';

export class Base {
  public options: Options;
  public connection: Connection;
  public schema: Model<Data, any, any>;

  constructor(options: Options) {
    this.options = options;

    this.connection = this._connect();
    this.schema = this.connection.model(this.options.collection, Main);
  }

  private _connect(): Connection {
    return createConnection(this.options.uri, {
      dbName: this.options.name,
      user: this.options.user,
      pass: this.options.pass,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  }
}
