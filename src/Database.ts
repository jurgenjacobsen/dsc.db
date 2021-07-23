import { Document, Model, Schema } from 'mongoose';
import Collection from '@discordjs/collection';

import Base, { DatabaseOptions } from './Base';
import DefaultSchema from './Schema';
import Util from './Util';

export class Database extends Base {
    private schema: Model<Document<any, any, any>, any>;
    constructor(options: DatabaseOptions) {
        super(options);
        this.schema = DefaultSchema(this.connection, options.collection);
    }
    
    public async set(key: string, value: any): Promise<any | void> {
        return new Promise(async (resolve) => {
            if(!Util.isKey(key)) throw new Error("Invalid key!");
            if(!Util.isValue(value)) throw new Error(`Invalid value type: ${typeof value}`);

            let parsed = Util.parseKey(key);
            let raw = await this.schema.findOne({ ID: parsed.key });

            if(!raw) {
                let data = new this.schema({ ID: parsed.key, data: parsed.target ? Util.setData(key, {}, value) : value });
                await data.save().catch(err => {
                    return this.emit("error", err);
                });
                resolve((data as any).data);
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
                .catch((err: any) => {
                    return this.emit("error", err);
                });

                resolve((response as any).data);
            }
        })
    }

    public async push(key: string, value: any): Promise<any | void> {
        let data = await this.get(key);
        if(!data) throw new Error("Key not found!");

        if(!Array.isArray(data)) throw new Error(`Expected target type to be Array, received ${typeof data}!`);
        if(Array.isArray(value)) return await this.set(key, data.concat(value));

        data.push(value);
        return await this.set(key, data);
    }

    public async pull(key: string, value: any, multiple=true): Promise<any | boolean> {
        let data = await this.get(key);
        if(data === undefined || data === undefined) return false;
        if(!Array.isArray(data)) throw new Error(`Expected existing data to be an Array, received ${typeof data}`);
        if(Array.isArray(value)) {
            data = data.filter(i => !value.includes(i));
            return await this.set(key, data);
        } else {
            if(!!multiple) {
                data = data.filter(i => i !== value);
                return await this.set(key, data);
            } else {
                let itemExists = data.some((x) => x === value);
                if(!itemExists) return false;
                let index = data.findIndex((x) => x === value);
                data = data.splice(index, 1);
                return await this.set(key, data);
            }
        }
    }

    public async get(key: string): Promise<any | void | undefined> {
        if(!Util.isKey(key)) throw new Error("Invalid key!");
        const parsed = Util.parseKey(key);

        let get = await this.schema.findOne({ ID: parsed.key })
        .catch((err: any) => {
            return this.emit("error", err);
        });

        if(!get) return undefined;
        let item;
        if(parsed.target) item = Util.getData(key, Object.assign({}, get.data));
        else item = get.data;
        return item !== undefined ? item : undefined;
    }

    public async fetch(key: string): Promise<any | void | undefined> {
        return this.get(key);
    }

    public async ensure(key: string): Promise<any> {
        return new Promise(async (resolve) => {
            if(typeof this.defaultData === "undefined") throw new Error("DefaultData is invalid, define a real value!");
            let exists = await this.exists(key);
            if(exists) return await this.get(key);
            let data = await this.set(key, this.defaultData);
            resolve(data);
        });
    }

    public async all(limit = 0): Promise<Data[]> {
        if (typeof limit !== "number" || limit < 1) limit = 0;
        let data = await this.schema.find().catch((e: any) => {
            this.emit("error", e);
        });
        if (!!limit) data = data.slice(0, limit);

        return data.map((m: any) => ({
            ID: m.ID, data: m.data
        }));
    }

    public async raw(params: any) {
        return await this.schema.find(params);
    }

    public async fetchAll(limit = 0): Promise<DataCollection> {
        let data = await this.all(limit);
        let map: DataCollection = new Collection();
        data.map((y) => {
            map.set(y.ID, y.data);
        });
        return map;
    }

    public async exists(key: string): Promise<boolean> {
        if(!Util.isKey(key)) throw new Error("Invalid key!");
        const parsed = Util.parseKey(key);

        let get = await this.schema.findOne({ ID: parsed.key })
        .catch((e: any) => {
            return this.emit("error", e);
        });

        if(!get) return false;
        if(!get.data || typeof get.data === "undefined" || get.data === null) return false;
        return true;
    }

    public async has(key: string): Promise<boolean> {
        return await this.exists(key);
    }

    public async deleteAll() {
        this.emit("debug", "Deleting everything from the database...");
        await this.schema.deleteMany().catch((e: any) => {});
        return true;
    }
    
    public async delete(key: string): Promise<boolean> {
        if(!Util.isKey(key)) throw new Error("Invalid key!");
        const parsed = Util.parseKey(key);
        const raw = await this.schema.findOne({ ID: parsed.key });
        if(!raw) return false;
        await this.schema.findOneAndDelete({ ID: parsed.key })
        .catch((e: any) => {
            return this.emit("error", e);
        });
        return true;
    }

    public async add(key: string, value: number): Promise<any | undefined | void> {
        return await this._math(key, "+", value);
    }

    public async subtract(key: string, value: number): Promise<any | undefined | void> {
        return await this._math(key, "-", value);
    }

    public async div(key: string, value: number): Promise<any | undefined | void> {
        return await this._math(key, "/", value);
    }
    
    public async latency(): Promise<any> {
        let read = await this._read();
        let write = await this._write();
        let average = (read + write) / 2;
        this.delete("LQ==").catch((e: any) => {});
        return { read, write, average };
    }

    public async entries(): Promise<number> {
        return await this.schema.estimatedDocumentCount();
    }

    public get uptime(): number {
        if(!this.readyAt) return 0;
        const timestamp = this.readyAt.getTime();
        return Date.now() - timestamp;
    }

    public get name(): string {
        return this.schema.modelName;
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

    private async _read(): Promise<any> {
        let start = Date.now();
        await this.get("LQ==");
        return Date.now() - start;
    }

    private async _write(): Promise<any> {
        let start = Date.now();
        await this.set("LQ==", Buffer.from(start.toString()).toString("base64"));
        return Date.now() - start;
    }

}

export interface Data {
    ID: string,
    data: any,    
}

export type DataCollection = Collection<string, any>;
export type MathOperators = '+' | '-' | '/';