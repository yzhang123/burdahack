/// <reference path="../../decls/mongoose.d.ts" />
/// <reference path="../../shared/Table.ts" />

import mongoose = require("mongoose");

var tableSchema = new mongoose.Schema({
    tableid: { type: String, index: {unique: true} },
    restaurantCode: String
}, { minimize: false });

interface ITable extends Table {};

export interface ITableModel extends ITable, mongoose.Document { };

export var Table = mongoose.model<ITableModel>('Table', tableSchema);