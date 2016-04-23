/// <reference path="../../decls/mongoose.d.ts" />
/// <reference path="../../shared/Table.ts" />

import mongoose = require("mongoose");

var tableActivitySchema = new mongoose.Schema({
    tableid: String,
    restaurantCode: String,
    type: String,
    time: Date
}, { minimize: false });

interface ITableActivity extends TableActivity {};

export interface ITableActivityModel extends ITableActivity, mongoose.Document { };

export var TableActivity = mongoose.model<ITableActivityModel>('TableActivity', tableActivitySchema);