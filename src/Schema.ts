import { Schema } from "mongoose";

export const DefaultSchema = new Schema({
  ID: {
    type: Schema.Types.String,
    required: true,
  },
  data: {
    type: Schema.Types.Mixed,
    required: true,
  }
});