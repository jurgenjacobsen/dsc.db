'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.DataUtil = void 0;
const lodash_1 = require('lodash');
class DataUtil {
  constructor() {
    throw new Error('Class DataUtil should not be instantiated!');
  }
  static parseFilter(query) {
    return typeof query === 'object' ? query : { id: query };
  }
  static parseKey(key) {
    if (!key || typeof key !== 'string') return { key: undefined, target: undefined };
    if (key.includes('.')) {
      let spl = key.split('.');
      let parsed = spl.shift();
      let target = spl.join('.');
      return { key: parsed, target };
    }
    return { key, target: undefined };
  }
  static setData(key, data, value) {
    let parsed = this.parseKey(key);
    if (typeof data === 'object' && parsed.target) {
      return (0, lodash_1.set)(data, parsed.target, value);
    } else if (parsed.target) throw new Error('Cannot target non-object');
    return data;
  }
  static getData(key, data) {
    let parsed = this.parseKey(key);
    if (parsed.target) data = (0, lodash_1.get)(data, parsed.target);
    return data;
  }
  static parseData(key, data) {
    let parsed = this.parseKey(key);
    if (!data) return undefined;
    let item;
    if (parsed.target) item = this.getData(key, Object.assign({}, data));
    else item = data;
    return item !== undefined ? item : undefined;
  }
}
exports.DataUtil = DataUtil;
