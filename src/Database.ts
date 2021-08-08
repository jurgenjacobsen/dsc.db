import { ConnectOptions } from "mongoose";
import { Base } from "./Base";
import Util from "./Util";

export class Database extends Base {
  constructor(options: Options) {
    super(options);
  }

  public set(key: string, value: any): Promise<any> {
    return new Promise(async (resolve) => {
      if(!Util.isKey(key)) throw new Error("Invalid key!");
      if(!Util.isValue(value)) throw new Error(`Invalid value type: ${typeof value}`);

      let parsed = Util.parseKey(key);
      let raw = await this.schema.findOne({ ID: parsed.key });

      if(!raw) {
          let data = new this.schema({ ID: parsed.key, data: parsed.target ? Util.setData(key, {}, value) : value });
          await data.save().catch((err: Error) => { });
          resolve(data.data);
      } else {
        const _data = parsed.target ? Util.setData(key, Object.assign({}, raw.data), value) : value;
        const update: any = {
            ["$set"]: { }
        };

        update["$set"]["data"] = _data;

        let response = await this.schema.findOneAndUpdate({ 
            "ID": parsed.key 
        }, update, {
            upsert: true, new: true 
        })
        .catch((err: Error) => { });

        resolve(response.data);
      }
    })
  }

  public push(key: string, value: any): Promise<any | void> {
    return new Promise(async (resolve) => {
      let data = await this.get(key);
      if(!data) throw new Error("Key not found!");

      if(!Array.isArray(data)) throw new Error(`Expected target type to be Array, received ${typeof data}!`);
      if(Array.isArray(value)) return resolve(await this.set(key, data.concat(value)));

      data.push(value);
      return resolve(await this.set(key, data));  
    })
  }

  public pull(key: string, value: any, multiple=true): Promise<any> {
    return new Promise(async (resolve) => {
      let data = await this.get(key);
      if(data === undefined || data === undefined) return resolve(false);
      if(!Array.isArray(data)) throw new Error(`Expected existing data to be an Array, received ${typeof data}`);
      if(Array.isArray(value)) {
        data = data.filter(i => !value.includes(i));
        return resolve(await this.set(key, data));
      } else {
        if(!!multiple) {
          data = data.filter(i => i !== value);
          return resolve(await this.set(key, data));
        } else {
          let itemExists = data.some((x) => x === value);
          if(!itemExists) return false;
          let index = data.findIndex((x) => x === value);
          data = data.splice(index, 1);
          return resolve(await this.set(key, data));
        }
      }
    });
  }

  public get(key: string): Promise<any | undefined> {
    return new Promise(async (resolve) => {
      if(!Util.isKey(key)) throw new Error("Invalid key!");
      const parsed = Util.parseKey(key);

      let get = await this.schema.findOne({ ID: parsed.key }).catch((err: Error) => { });

      if(!get) return resolve(undefined);
      let item;
      if(parsed.target) item = Util.getData(key, Object.assign({}, get.data));
      else item = get.data;
      return resolve(item !== undefined ? item : undefined);
    });
  }

  public fetch(key: string): Promise<any | void | undefined> {
    return this.get(key);
  }

  public ensure(key: string): Promise<any> {
    return new Promise(async (resolve) => {
      if(typeof this.options.defaultData === "undefined") throw new Error("DefaultData is invalid, define a real value!");
      let exists = await this.get(key);
      if(exists) {
        return resolve(exists);
      } else {
        let data = await this.set(key, this.options.defaultData);
        return resolve(data);
      }
    });
  }

  public all(limit = 0): Promise<Data[]> {
    return new Promise(async (resolve) => {
      if (typeof limit !== "number" || limit < 1) limit = 0;
      let data = await this.schema.find().catch((e: Error) => { });
      if (!!limit) data = data.slice(0, limit);
      return resolve(data.map((m: any) => ({
        ID: m.ID, data: m.data
      })));
    })
  }

  public raw(params: any): Promise<Data[]> {
    return new Promise(async (resolve) => {
      return resolve(await this.schema.find(params));
    })
  }

  public fetchAll(limit = 0): Promise<Map<string, any>> {
    return new Promise(async (resolve) => {
      let data = await this.all(limit);
      let map: Map<string, any> = new Map();
      data.map((y) => {
          map.set(y.ID, y.data);
      });
      return resolve(map);
    })
  }

  public exists(key: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if(!Util.isKey(key)) return reject("Invalid key!");
      const parsed = Util.parseKey(key);

      let get = await this.schema.findOne({ ID: parsed.key }).catch((e: Error) => { });

      if(!get) return resolve(false);
      if(!get.data || typeof get.data === "undefined" || get.data === null) return resolve(false);
      return resolve(true);
    })
  }

  public has(key: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      return resolve(await this.exists(key));
    });
  }

  public async deleteAll() {
      await this.schema.deleteMany().catch((e: any) => {});
      return true;
  }

  public delete(key: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if(!Util.isKey(key)) return reject("Invalid key!");
      const parsed = Util.parseKey(key);
      const raw = await this.schema.findOne({ ID: parsed.key });
      if(!raw) return resolve(false);
      await this.schema.findOneAndDelete({ ID: parsed.key }).catch((e: Error) => { });
      return resolve(true);
    })
  }

  public async add(key: string, value: number): Promise<any> {
      return await this._math(key, "+", value);
  }

  public async subtract(key: string, value: number): Promise<any> {
      return await this._math(key, "-", value);
  }

  public async div(key: string, value: number): Promise<any> {
      return await this._math(key, "/", value);
  }

  private async _math(key: string, operator: MathOperators, value: number): Promise<any> {
    if(!Util.isKey(key)) throw new Error("Invalid key!");
    if(!operator) throw new Error("No operator provided!");
    if(!Util.isValue(value)) throw new Error("Invalid value!");

    switch(operator) {
        case "+": {
            let add = await this.get(key);
            if(!add) {
                return this.set(key, value);
            } else {
                if(typeof add !== "number") throw new Error(`Expected existing data to be a number, received ${typeof add}`);
                return this.set(key, add + value);
            }
        };
        break;
        case "-": {
            let less = await this.get(key);
            if(!less) {
                return this.set(key, 0 - value);
            } else {
                if(typeof less !== "number") throw new Error(`Expected existing data to be a number, received ${typeof less}`);
                return this.set(key, less - value);
            }
        };
        break;
        case "/": {
            let div = await this.get(key);
            if(!div) {
                return this.set(key,  0 / value);
            } else {
                if(typeof div !== "number") throw new Error(`Expected existing data to be a number, received ${typeof div}`);
                return this.set(key, div / value);
            }
        };
        break;
        default:
            throw new Error("Unknown operator!");
    }

}
}

export interface Options {
  mongoURL: string;
  mongoUser: string;
  mongoPass: string;
  collection: string;
  connectionOptions?: ConnectOptions;
  defaultData?: any;
}

export interface Data extends Document {
  ID: string;
  data: any;
}

export type MathOperators = '+' | '-' | '/';