import { Connection, Model } from 'mongoose';
import { Data, Options } from '../utils/Types';
export declare class Base<T> {
    options: Options;
    connection: Connection;
    schema: Model<Data<T>, any, any>;
    constructor(options: Options);
    debug(str: string): void;
    private connect;
}
