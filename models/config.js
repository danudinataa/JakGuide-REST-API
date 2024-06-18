const configDB = require("../config/dbConfig.js");
const mongoose = require("mongoose");
const { Stop } = require("./stop.js");
const { Line } = require("./line.js");

const configModel = {
    mongoose,
    url: configDB.url,
    Stop,
    Line
};

module.exports = configModel;