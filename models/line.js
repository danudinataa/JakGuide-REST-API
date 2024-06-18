const mongoose = require("mongoose");
const { Stop } = require("./stop.js");
const { v4 } = require('uuid');

const lineSchema = mongoose.Schema({
        id:  {
            type: String,
            default: v4
        },
        nama: String,
        moda: String,
        pemberhentian_awal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stop'
        },
        pemberhentian_akhir: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stop'
        },
        pemberhentian: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stop',
            default: []
        }],
        rute_integrasi: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Line',
            default: []
        }]
    },
    {
        timestamps: true
    }
);

lineSchema.methods.toJSON = function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
};

const Line = mongoose.model("Line", lineSchema);

module.exports = Line;