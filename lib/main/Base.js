'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.Base = void 0;
const mongoose_1 = require('mongoose');
const __1 = require('..');
class Base {
  options;
  connection;
  schema;
  constructor(options) {
    this.options = options;
    this.connection = this.connect();
    this.schema = this.connection.model(options.collection, __1.Schema);
    this.connection.on('connection', () => {
      this.debug('Connecting...');
    });
    this.connection.on('connected', () => {
      this.debug('Connected');
    });
    this.connection.on('disconnected', () => {
      this.debug('Disconnected');
    });
    this.connection.on('reconnected', () => {
      this.debug('Reconnected');
    });
    this.connection.on('error', (err) => {
      this.debug('Error: ' + err);
    });
  }
  debug(str) {
    if (this.options.debug) console.log(str);
  }
  connect() {
    return (0, mongoose_1.createConnection)(this.options.uri, {
      keepAlive: true,
    });
  }
}
exports.Base = Base;
