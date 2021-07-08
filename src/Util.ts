import _ from 'lodash';

export default class Util {
    constructor() {
        throw new Error(`Class Util may not be instantiated!`);
    }

    static isKey(str: any): boolean {
        return typeof str === "string";
    }

    static isValue(data: any): boolean {
        if (data === Infinity || data === -Infinity) return false;
        if (typeof data === "undefined") return false;
        return true;
    }
    
    static parseKey(key: any): ParsedKey {
        if(!key || typeof key !== "string") return {key: undefined, target: undefined };
        if(key.includes(".")) {
            let spl = key.split(".");
            let parsed = spl.shift();
            let target = spl.join(".");;
            return { key: parsed, target };
        }
        return { key, target: undefined };
    }

    static setData(key: string, data: any, value: any): any {
        let parsed = this.parseKey(key);
        if(typeof data === "object" && parsed.target) {
            return _.set(data, parsed.target, value);
        } else if(parsed.target) throw new Error("Cannot target non-object");
        return data;
    }

    static getData(key: string, data: any): any {
        let parsed = this.parseKey(key);
        if (parsed.target) data = _.get(data, parsed.target);
        return data;
    }

}

export interface ParsedKey {
    key: string | undefined,
    target: string | undefined;
}