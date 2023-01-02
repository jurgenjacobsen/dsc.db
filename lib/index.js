'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Database = exports.Base = exports.Schema = void 0;
const Schema_1 = __importDefault(require('./utils/Schema'));
exports.Schema = Schema_1.default;
const Base_1 = require('./main/Base');
Object.defineProperty(exports, 'Base', {
  enumerable: true,
  get: function () {
    return Base_1.Base;
  },
});
const Database_1 = require('./main/Database');
Object.defineProperty(exports, 'Database', {
  enumerable: true,
  get: function () {
    return Database_1.Database;
  },
});
