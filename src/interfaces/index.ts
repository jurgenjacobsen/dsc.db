export interface Options {
  /** MongoDB connection uri */
  uri: string;
  /** Name of your database */
  name: string;
  /** Your mongodb user */
  user: string;
  /** Your mongodb user pass */
  pass: string;
  /** Your database collection where all data will be stored */
  collection: string;
  /** A default data that will be set to the key you want to ensure that is in the database */
  default?: any;
}

export interface Data extends Document {
  id: string;
  data: any;
}

export interface ParsedKey {
  key: string | undefined;
  target: string | undefined;
}
