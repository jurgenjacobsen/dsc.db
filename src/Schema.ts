import { Connection, Schema } from "mongoose";

const Default = new Schema({
    ID: {
        type: Schema.Types.String,
        required: true,
    },
    data: {
        type: Schema.Types.Mixed,
        required: true,
    }
});

export default (connection: Connection, name: string) => {
    return connection.model(name, Default);
}