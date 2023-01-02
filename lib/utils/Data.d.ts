import { FilterQuery } from 'mongoose';
import { Data, ParsedKey } from './Types';
export declare class DataUtil {
    constructor();
    static parseFilter(query: FilterQuery<Data<any>> | string): FilterQuery<Data<any>>;
    static parseKey(key: any): ParsedKey;
    static setData(key: string, data: any, value: any): any;
    static getData(key: string, data: any): any;
    static parseData(key: string, data: any): any;
}
