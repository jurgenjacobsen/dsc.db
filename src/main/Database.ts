import { FilterQuery } from 'mongoose';
import { Data, Options } from '../interfaces';
import { Base } from './Base';
import { Util } from '../utils/Util';

export class Database extends Base {
  constructor(options: Options) {
    super(options);
  }

  public fetch(query: FilterQuery<Data> | string): Promise<Data | null> {
    return new Promise(async (resolve) => {
      if (!['object', 'string'].includes(typeof query)) return resolve(null);
      let filter = Util.parseFilter(query);
      let raw = await this.schema.findOne(filter);
      if (!raw) return resolve(null);
      return resolve(raw);
    });
  }

  public set(key: string, value: any): Promise<Data> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error('Key should be type string, received:' + typeof key);
      let parsed = Util.parseKey(key);
      let raw = await this.schema.findOne({ id: parsed.key });

      if (!raw) {
        let data = new this.schema({ id: parsed.key, data: parsed.target ? Util.setData(key, {}, value) : value });
        await data.save().catch((err: Error) => {
          console.log(err);
        });
        resolve(await this.schema.findOne({ id: parsed.key }));
      } else {
        let data = parsed.target ? Util.setData(key, Object.assign({}, raw.data), value) : value;
        let update: any = {
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
          .catch((err: Error) => {
            console.log(err);
          });
        resolve(await this.schema.findOne({ id: parsed.key }));
      }
    });
  }

  public push(key: string, value: any): Promise<Data | null> {
    return new Promise(async (resolve) => {
      let data = await this.get(key);
      if (!data) throw new Error('Key not found!');

      if (!Array.isArray(data)) throw new Error(`Expected target type to be Array, received ${typeof data}!`);
      if (Array.isArray(value)) return resolve(await this.set(key, data.concat(value)));
      data.push(value);
      return resolve(await this.set(key, data));
    });
  }

  public has(id: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      return resolve((await this.fetch(id)) ? true : false);
    });
  }

  public pull(key: string, value: any, multiple = false): Promise<Data | null> {
    return new Promise(async (resolve) => {
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

  public list(): Promise<Data[] | null> {
    return new Promise(async (resolve) => {
      let data = await this.schema.find().catch((err: Error) => {
        console.log(err);
        return resolve(null);
      });
      resolve(data);
    });
  }

  public ensure(id: string): Promise<Data> {
    return new Promise(async (resolve) => {
      if (!this.options.default) throw new Error("Default data isn't defined, to use this method you should define one value in the options");
      let raw = await this.fetch(id);
      if (raw) {
        return resolve(raw);
      } else {
        return resolve(await this.set(id, this.options.default));
      }
    });
  }

  public delete(query: FilterQuery<Data> | string): Promise<Data | null> {
    return new Promise(async (resolve) => {
      let filter = Util.parseFilter(query);
      let raw = await this.schema.findOneAndDelete(filter).catch((err: Error) => {
        console.log(err);
        return resolve(null);
      });
      return resolve(raw);
    });
  }

  public add(key: string, value: number): Promise<Data | null> {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '+', value));
    });
  }

  public async subtract(key: string, value: number): Promise<Data | null> {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '-', value));
    });
  }

  public async div(key: string, value: number): Promise<Data | null> {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '/', value));
    });
  }

  private get(key: string): Promise<Data | any | null> {
    return new Promise(async (resolve) => {
      let parsed = Util.parseKey(key);
      let get = await this.schema.findOne({ id: parsed.key }).catch((err: Error) => {
        console.log(err);
        return resolve(null);
      });
      if (!get) return resolve(null);
      let item;
      if (parsed.target) item = Util.getData(key, Object.assign({}, get.data));
      else item = get.data;
      return resolve(item !== null ? item : null);
    });
  }

  private __math(key: string, operator: '+' | '-' | '/', value: number): Promise<Data | null> {
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
