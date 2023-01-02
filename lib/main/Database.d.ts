import { FilterQuery } from 'mongoose';
import { Data, Options } from '../utils/Types';
import { Base } from './Base';
export declare class Database<T> extends Base<T> {
    constructor(options: Options);
    fetch(query: FilterQuery<Data<T>> | string): Promise<Data<T> | null>;
    set(key: string, value: T | any): Promise<Data<T>>;
    push(key: string, value: any): Promise<Data<T> | null>;
    has(id: string): Promise<boolean>;
    pull(key: string, value: any, multiple?: boolean): Promise<Data<T> | null>;
    list(): Promise<Data<T>[] | null>;
    delete(query: FilterQuery<Data<T>> | string): Promise<Data<T> | null>;
    add(key: string, amount: number): Promise<Data<T> | null>;
    subtract(key: string, amount: number): Promise<Data<T> | null>;
    div(key: string, amount: number): Promise<Data<T> | null>;
    private get;
    private __math;
}
