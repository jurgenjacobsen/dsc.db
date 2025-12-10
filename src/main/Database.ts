import { QueryFilter } from 'mongoose';
import { DataUtil } from '../utils/Data';
import { Data, Options, Errors } from '../utils/Types';
import { Base } from './Base';

export class Database<T> extends Base<T> {
  constructor(options: Options) {
    super(options);
  }

  /**
   * Fetches raw data from the database
   * @param {string} query - The query to search for
   * @returns {Promise<Data<T>>} The raw data from the database
   * @example
   * database.fetch('key');
   */
  public fetch(query: QueryFilter<Data<T>> | string): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      if (!['object', 'string'].includes(typeof query)) throw new Error(Errors.FLAGS.TYPE('query', 'object or string', typeof query));
      let filter = DataUtil.parseFilter(query);
      let raw = await this.schema.findOne(filter);
      if (!raw) return resolve(null);
      return resolve(raw);
    });
  }

  /**
   * Set/Update/Create data on the database
   * @param {string} key - The key to set the data
   * @returns {Promise<Data<T>>} The data response from the database
   * @example
   * database.set('key', 'value');
   * database.set('key', ['value1', 'value2']);
   * database.set('key.secondKey', { data: 'value' });
   */
  public set(key: string, value: T | any): Promise<Data<T>> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
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

  /**
   * Pushes data to an array
   * @param {string} key - The key to push the data
   * @param {any} value - The value to push
   * @returns {Promise<Data<T> | null>} The data response from the database
   * @example
   * database.push('key', 'value');
   * database.push('key', ['value1', 'value2']);
   * database.push('key', { key: 'value' });
   * database.push('key', [{ key: 'value' }, { key: 'value' }]);
   * database.push('key', 1);
   * database.push('key', [1, 2]);
   */
  public push(key: string, value: any): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
      let data = await this.get(key);
      if (!data) throw new Error('Key not found!');

      if (!Array.isArray(data)) throw new Error(`Expected target type to be Array, received ${typeof data}!`);
      if (Array.isArray(value)) return resolve(await this.set(key, data.concat(value)));
      data.push(value);
      return resolve(await this.set(key, data));
    });
  }

  /**
   * Checks if the data exists
   * @param {string} key - The key to check
   * @returns {Promise<boolean>} The data response from the database
   * @example
   * database.has('key')
   */
  public has(key: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
      return resolve((await this.fetch(key)) ? true : false);
    });
  }

  /**
   * Pull data from an array
   * @param {string} key The key to pull the data
   * @param {any} value The data to pull
   * @param {boolean} multiple If true, it will pull multiple data with same key from the array
   * @returns {Promise<Data<T> | null>} The data response from the database
   * @example
   * database.pull('key', 'value');
   */
  public pull(key: string, value: any, multiple: boolean = false): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
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

  /**
   * Fetches all data from the database as an array
   * @returns {Promise<Array>} The data response from the database
   * @example
   * database.list();
   */
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

  /**
   * Deletes data from the database
   * @param {string} query The query to delete
   * @returns {Promise<Data<T> | null>} The data response from the database
   * @example
   * database.delete('key');
   */
  public delete(query: QueryFilter<Data<T>> | string): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      let filter = DataUtil.parseFilter(query);
      let raw = await this.schema.findOneAndDelete(filter).catch((err: Error) => {
        console.log(err);
        return resolve(null);
      });
      return resolve(raw);
    });
  }

  /**
   * Sum numbers to the key
   * @param {string} key The key to sum to
   * @param {number} amount Number to sum
   * @returns {Promise<Data<T> | null>} The data response from the database
   * @example
   * database.add('key', 1);
   */
  public add(key: string, amount: number): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
      if (typeof key !== 'number') throw new Error(Errors.FLAGS.TYPE('amount', 'number', typeof amount));
      return resolve(await this.__math(key, '+', amount));
    });
  }

  /**
   * Subtract numbers from the key
   * @param {string} key The key to subtract fro
   * @param {number} amount Number to subtract
   * @returns {Promise<Data<T> | null>} The data response from the database
   * @example
   * database.subtract('key', 1);
   */
  public subtract(key: string, amount: number): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
      if (typeof key !== 'number') throw new Error(Errors.FLAGS.TYPE('amount', 'number', typeof amount));
      return resolve(await this.__math(key, '-', amount));
    });
  }

  /**
   * Divide numbers from the key
   * @param {string} key The key to divide from
   * @param {number} divideBy Number to divide the key by
   * @returns {Promise<Data<T> | null>} The data response from the database
   * @example
   * database.div('key', 4);
   */
  public div(key: string, divideBy: number): Promise<Data<T> | null> {
    return new Promise(async (resolve) => {
      if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
      if (typeof key !== 'number') throw new Error(Errors.FLAGS.TYPE('amount', 'number', typeof divideBy));
      return resolve(await this.__math(key, '/', divideBy));
    });
  }

  /**
   * @private
   * Get data from the database
   * @param {string} key The key to get the data
   * @returns {Promise<Data<T> | null>} The data response from the database
   * @example
   * database.get('key');
   */
  private get(key: string): Promise<Data<T> | any | null> {
    if (typeof key !== 'string') throw new Error(Errors.FLAGS.TYPE('key', 'string', typeof key));
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
