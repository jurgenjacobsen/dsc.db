"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const Schema = new mongoose_1.default.Schema({
    id: {
        type: mongoose_1.default.Schema.Types.String,
        required: true,
    },
    data: {
        type: mongoose_1.default.Schema.Types.Mixed,
        required: true,
    },
});
exports.default = Schema;
