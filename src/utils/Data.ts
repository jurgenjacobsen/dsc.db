import { FilterQuery } from 'mongoose';
import { Data, ParsedKey } from './Types';
import { get, set } from 'lodash';

export class DataUtil {
  constructor() {
    throw new Error('Class DataUtil should not be instantiated!');
  }

  static parseFilter(query: FilterQuery<Data<any>> | string): FilterQuery<Data<any>> {
    return typeof query === 'object' ? query : { id: query };
  }

  static parseKey(key: any): ParsedKey {
    if (!key || typeof key !== 'string') return { key: undefined, target: undefined };

    if (key.includes('.')) {
      let spl = key.split('.');
      let parsed = spl.shift();
      let target = spl.join('.');
      return { key: parsed, target };
    }

    return { key, target: undefined };
  }

  static setData(key: string, data: any, value: any): any {
    let parsed = this.parseKey(key);
    if (typeof data === 'object' && parsed.target) {
      return set(data, parsed.target, value);
    } else if (parsed.target) throw new Error('Cannot target non-object');
    return data;
  }

  static getData(key: string, data: any): any {
    let parsed = this.parseKey(key);
    if (parsed.target) data = get(data, parsed.target);
    return data;
  }

  static parseData(key: string, data: any) {
    let parsed = this.parseKey(key);
    if (!data) return undefined;
    let item;
    if (parsed.target) item = this.getData(key, Object.assign({}, data));
    else item = data;
    return item !== undefined ? item : undefined;
  }
}
