import { Document } from 'mongoose';

export interface Options {
  uri: string;
  collection: string;
  debug?: boolean;
}

export interface Data<T> extends Document {
  id: string;
  data: T;
}

export interface ParsedKey {
  key?: string;
  target?: string;
}

export const Errors = {
  FLAGS: {
    TYPE: (p: string, t: string, r: string) => {
      return `Incorrect ${p} type used, expected a ${t} and received: ${r}`;
    },
  },
};
