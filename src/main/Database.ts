import { FilterQuery } from 'mongoose';
import { DataUtil } from '../utils/Data';
import { Data, Options } from '../utils/Types';
import { Base } from './Base';

export class Database<T> extends Base<T> {
  constructor(options: Options) {
    super(options);
  }

  public fetch(query: FilterQuery<Data<T>> | string): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      if (!['object', 'string'].includes(typeof query)) return resolve(null);
      let filter = DataUtil.parseFilter(query);
      let raw = await this.schema.findOne(filter);
      if (!raw) return resolve(null);
      return resolve(raw);
    });
  }

  public set(key: string, value: T | any): Promise<Data<T>> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error('Key should be type string, received:' + typeof key);
      let parsed = DataUtil.parseKey(key);
      let raw = await this.schema.findOne({ id: parsed.key });

      if (!raw) {
        let data = new this.schema({ id: parsed.key, data: parsed.target ? DataUtil.setData(key, {}, value) : value });
        await data.save().catch((err: Error) => {
          console.log(err);
        });
        resolve(await this.schema.findOne({ id: parsed.key }));
      } else {
        let data = parsed.target ? DataUtil.setData(key, Object.assign({}, raw.data), value) : value;
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

  public push(key: string, value: any): Promise<Data<T> | null> {
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

  public has(id: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (typeof id !== 'string') throw new Error('ID should be type string, received:' + typeof id);
      return resolve((await this.fetch(id)) ? true : false);
    });
  }

  public pull(key: string, value: any, multiple: boolean = false): Promise<Data<T> | null> {
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

  public list(): Promise<Data<T>[] | null> {
    return new Promise(async (resolve) => {
      let data = await this.schema.find().catch((err: Error) => {
        console.log(err);
        return resolve(null);
      });

      resolve(
        data?.map((i: any) => {
          return {
            id: i.id,
            data: i.data,
          };
        }),
      );
    });
  }

  public delete(query: FilterQuery<Data<T>> | string): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      let filter = DataUtil.parseFilter(query);
      let raw = await this.schema.findOneAndDelete(filter).catch((err: Error) => {
        console.log(err);
        return resolve(null);
      });
      return resolve(raw);
    });
  }

  public add(key: string, amount: number): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '+', amount));
    });
  }

  public async subtract(key: string, amount: number): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '-', amount));
    });
  }

  public async div(key: string, amount: number): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      return resolve(await this.__math(key, '/', amount));
    });
  }

  private get(key: string): Promise<Data<T> | any | null> {
    return new Promise(async (resolve) => {
      let parsed = DataUtil.parseKey(key);
      let get = await this.schema.findOne({ id: parsed.key }).catch((err: Error) => {
        console.log(err);
        return resolve(null);
      });
      if (!get) return resolve(null);
      let item;
      if (parsed.target) item = DataUtil.getData(key, Object.assign({}, get.data));
      else item = get.data;
      return resolve(item !== null ? item : null);
    });
  }

  private __math(key: string, operator: '+' | '-' | '/', value: number): Promise<Data<T> | null> {
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
