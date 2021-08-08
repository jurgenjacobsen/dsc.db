import { EventEmitter } from "events";
import mongoose, { Connection, ConnectOptions } from 'mongoose';

export default class Base extends EventEmitter {
    public readyAt: Date | undefined;
    public connection: Connection;
    public defaultData: any | undefined;
    private options: DatabaseOptions;

    constructor(options: DatabaseOptions) {
        super();
        if(!options.collection || typeof options.collection !== "string") throw new Error("Collection name should be a string!");
        if(!options.mongoURL  || !options.mongoURL.startsWith("mongodb")) throw new Error(`MongoDB URI is invalid!`);
        if(typeof options.mongoURL !== "string") throw new Error(`MongoDB URI expected to be a string, but I received ${typeof options.mongoURL}`);
        if(options.connectionOptions && typeof options.connectionOptions !== "object") throw new Error(`Connection Options expected to be an object, but I received ${typeof options.connectionOptions}`);

        this.options = options;

        this.defaultData = options.defaultData;

        this.connection = this._create();
        
        this.connection.on("error", (e) => {
            this.emit("error", e);
        });

        this.connection.on("open", () => {
            this.readyAt = new Date();
            this.emit("ready");
        });
    }

    private _create() {
        this.emit("debug", "Creating database connection...");

        if(!this.options.mongoURL || typeof this.options.mongoURL !== "string") throw new Error(`Invalid MongoURL provided!`);
        
        return mongoose.createConnection(this.options.mongoURL, {
            ...this.options.connectionOptions,
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
            pass: this.options.mongoPass,
            user: this.options.mongoUser,
        });
    }

    private _destroyDatabase(): void {
        this.connection.close();
        this.readyAt = undefined;
        this.emit("debug", "Database disconnected");
    }

    get url(): string {
        return this.options.mongoURL;
    }

    get state() {
        if (!this.connection || typeof this.connection.readyState !== "number") return "DISCONNECTED";
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
    }

    /**
    * Emitted when database creates connection
    * @event Base#ready
    * @example db.on("ready", () => {
    *     console.log("Successfully connected to the database!");
    * });
    */

    /**
    * Emitted when database encounters error
    * @event Base#error
    * @param {Error} Error Error Message
    * @example db.on("error", console.error);
    */

    /**
    * Emitted on debug mode
    * @event Base#debug
    * @param {string} Message Debug message
    * @example db.on("debug", console.log);
    */

    /**
    * Emitted on debug mode
    * @event Base#change
    * @param {string} Message Debug message
    * @example db.on("debug", console.log);
    */

}

export interface DatabaseOptions {
    collection: string,
    mongoURL: string;
    mongoUser: string;
    mongoPass: string;
    connectionOptions?: ConnectOptions,
    /* Used for the ensure method */
    defaultData?: any,
}