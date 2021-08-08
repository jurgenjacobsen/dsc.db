import mongoose, { Connection, Model } from "mongoose";
import { Options } from "./Database";
import { DefaultSchema } from "./Schema";

export class Base {
  public options: Options;
  public connection: Connection;
  public schema: Model<any, any, any>;
  constructor(options: Options) {
    
    this.options = options;
    this.connection = this._connect();
    this.schema = this.connection.model(this.options.collection, DefaultSchema, this.options.collection);
  }

  get state(): ReadyState {
    if(typeof this.connection?.readyState !== 'number') return "DISCONNECTED";

    switch(this.connection.readyState) {
      case 0:
        return "DISCONNECTED";
        case 1:
          return "CONNECTED";
        case 2:
          return "CONNECTING";
        case 3:
          return "DISCONNECTING";
    }
  };

  private _connect(): Connection {
    if(typeof this.options.mongoURL !== 'string') throw new Error(`A mongoURL wasn't provided properly.`);
    if(typeof this.options.mongoUser !== 'string') throw new Error(`A mongoUser wasn't provided properly.`);
    if(typeof this.options.mongoPass !== 'string') throw new Error(`A mongoPass wasn't provided properly.`);
  
    return mongoose.createConnection(this.options.mongoURL, {
      ...this.options.connectionOptions,
      pass: this.options.mongoPass,
      user: this.options.mongoUser,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
  };

  private _close(): void {
    this.connection.close();
  }
}

export type ReadyState = 'DISCONNECTED' | 'CONNECTED' | 'CONNECTING' | 'DISCONNECTING' | undefined;