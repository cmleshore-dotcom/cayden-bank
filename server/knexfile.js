"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const config = {
    development: {
        client: 'better-sqlite3',
        connection: {
            filename: path_1.default.join(__dirname, 'cayden_bank.sqlite'),
        },
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.join(__dirname, 'src', 'db', 'migrations'),
            extension: 'ts',
        },
        seeds: {
            directory: path_1.default.join(__dirname, 'src', 'db', 'seeds'),
            extension: 'ts',
        },
    },
    production: {
        client: 'better-sqlite3',
        connection: {
            filename: path_1.default.join(__dirname, 'cayden_bank.sqlite'),
        },
        useNullAsDefault: true,
        migrations: {
            directory: path_1.default.join(__dirname, 'src', 'db', 'migrations'),
        },
        seeds: {
            directory: path_1.default.join(__dirname, 'src', 'db', 'seeds'),
        },
    },
};
exports.default = config;
module.exports = config;
//# sourceMappingURL=knexfile.js.map