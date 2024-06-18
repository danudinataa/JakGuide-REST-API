const mongoose = require("mongoose");
const { Line } = require("./line.js");
const { v4 } = require('uuid');

const stopSchema = mongoose.Schema({
        id: {
            type: String,
            default: v4
        },
        nama: String,
        jenis: String,
        latitude: {
            type: Number,
            default: ""
        },
        longitude: {
            type: Number,
            default: ""
        },
        maps_link: {
            type: String,
            default: ""
        },
        integrasi_pemberhentian: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stop',
            default: []
        }],
        rute: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Line',
            default: []
        }]
    },
    {
        timestamps: true
    }
);

stopSchema.methods.toJSON = function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
};

const Stop = mongoose.model("Stop", stopSchema);

module.exports = Stop;