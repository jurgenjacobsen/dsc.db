import { Document } from 'mongoose';
export interface Options {
    uri: string;
    collection: string;
    debug?: boolean;
}
export interface Data<T> extends Document {
    id: string;
    data: T;
}
export interface ParsedKey {
    key?: string;
    target?: string;
}
