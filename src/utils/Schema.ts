import Mongoose from 'mongoose';
import { Data } from './Types';

const Schema = new Mongoose.Schema<Data<any>>({
  id: {
    type: Mongoose.Schema.Types.String,
    required: true,
  },
  data: {
    type: Mongoose.Schema.Types.Mixed,
    required: true,
  },
});

export default Schema;
