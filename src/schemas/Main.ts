import { Schema } from 'mongoose';
import { Data } from '../interfaces';

export const Main = new Schema<Data<any>>({
  id: { type: Schema.Types.String, required: true },
  data: { type: Schema.Types.Mixed, required: true },
});
