'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Database = void 0;
const Data_1 = require('../utils/Data');
const Base_1 = require('./Base');
class Database extends Base_1.Base {
  constructor(options) {
    super(options);
  }
  fetch(query) {
    return new Promise(async (resolve) => {
      if (!['object', 'string'].includes(typeof query)) return resolve(null);
      let filter = Data_1.DataUtil.parseFilter(query);
      let raw = await this.schema.findOne(filter);
      if (!raw) return resolve(null);
      return resolve(raw);
    });
  }
  set(key, value) {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error('Key should be type string, received:' + typeof key);
      let parsed = Data_1.DataUtil.parseKey(key);
      let raw = await this.schema.findOne({ id: parsed.key });
      if (!raw) {
        let data = new this.schema({ id: parsed.key, data: parsed.target ? Data_1.DataUtil.setData(key, {}, value) : value });
        await data.save().catch((err) => {
          console.log(err);
        });
        resolve(await this.schema.findOne({ id: parsed.key }));
      } else {
        let data = parsed.target ? Data_1.DataUtil.setData(key, Object.assign({}, raw.data), value) : value;
        let update = {
          ['$set']: {},
        };
        update['$set']['data'] = data;
        await this.schema
          .findOneAndUpdate(
            {
              id: parsed.key,
            },
            update,
            {
              upsert: true,
              new: true,
            },
          )
          .catch((err) => {
            console.log(err);
          });
        resolve(await this.schema.findOne({ id: parsed.key }));
      }
    });
  }
  push(key, value) {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error('Key should be type string, received:' + typeof key);
      let data = await this.get(key);
      if (!data) throw new Error('Key not found!');
      if (!Array.isArray(data)) throw new Error(`Expected target type to be Array, received ${typeof data}!`);
      if (Array.isArray(value)) return resolve(await this.set(key, data.concat(value)));
      data.push(value);
      return resolve(await this.set(key, data));
    });
  }
  has(id) {
    return new Promise(async (resolve) => {
      if (typeof id !== 'string') throw new Error('ID should be type string, received:' + typeof id);
      return resolve((await this.fetch(id)) ? true : false);
    });
  }
  pull(key, value, multiple = false) {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error('Key should be type string, received:' + typeof key);
      if (typeof multiple !== 'boolean') throw new Error('Multiple should be type boolean, received:' + typeof multiple);
      let data = await this.get(key);
      if (!data) return resolve(null);
      if (!Array.isArray(data)) throw new Error(`Expected existing data to be an Array, received ${typeof data}`);
      if (Array.isArray(value)) {
        data = data.filter((i) => !value.includes(i));
        return resolve(await this.set(key, data));
      } else {
        if (multiple) {
          data = data.filter((i) => i !== value);
          return resolve(await this.set(key, data));
        } else {
          let i = data.findIndex((y) => y === value);
          data.splice(i, 1);
          return resolve(await this.set(key, data));
        }
      }
    });
  }
  list() {
    return new Promise(async (resolve) => {
      let data = await this.schema.find().catch((err) => {
        console.log(err);
        return resolve(null);
      });
      resolve(
        data?.map((i) => {
          return {
            id: i.id,
            data: i.data,
          };
        }),
      );
    });
  }
  delete(query) {
    return new Promise(async (resolve) => {
      let filter = Data_1.DataUtil.parseFilter(query);
      let raw = await this.schema.findOneAndDelete(filter).catch((err) => {
        console.log(err);
        return resolve(null);
      });
      return resolve(raw);
    });
  }
  add(key, amount) {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '+', amount));
    });
  }
  async subtract(key, amount) {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '-', amount));
    });
  }
  async div(key, amount) {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '/', amount));
    });
  }
  get(key) {
    return new Promise(async (resolve) => {
      let parsed = Data_1.DataUtil.parseKey(key);
      let get = await this.schema.findOne({ id: parsed.key }).catch((err) => {
        console.log(err);
        return resolve(null);
      });
      if (!get) return resolve(null);
      let item;
      if (parsed.target) item = Data_1.DataUtil.getData(key, Object.assign({}, get.data));
      else item = get.data;
      return resolve(item !== null ? item : null);
    });
  }
  __math(key, operator, value) {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error('Key should be string, received: ' + typeof key);
      if (!['+', '-', '/'].includes(operator)) throw new Error('Operator not supported');
      if (typeof value !== 'number') throw new Error('Value should be a number, received: ' + typeof value);
      switch (operator) {
        case '+':
          {
            let add = await this.get(key);
            if (!add) {
              return resolve(this.set(key, value));
            } else {
              if (typeof add !== 'number') throw new Error(`Expected existing data to be a number, received ${typeof add}`);
              return resolve(this.set(key, add + value));
            }
          }
          break;
        case '-':
          {
            let less = await this.get(key);
            if (!less) {
              return resolve(this.set(key, 0 - value));
            } else {
              if (typeof less !== 'number') throw new Error(`Expected existing data to be a number, received ${typeof less}`);
              return resolve(this.set(key, less - value));
            }
          }
          break;
        case '/':
          {
            let div = await this.get(key);
            if (!div) {
              return resolve(this.set(key, 0 / value));
            } else {
              if (typeof div !== 'number') throw new Error(`Expected existing data to be a number, received ${typeof div}`);
              return resolve(this.set(key, div / value));
            }
          }
          break;
        default:
          throw new Error('Unknown operator!');
      }
    });
  }
}
exports.Database = Database;
