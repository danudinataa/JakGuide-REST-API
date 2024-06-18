const express = require('express');
const mongoose = require('mongoose');
const configDB = require('./config/dbConfig.js');
const router = require('./routes/router.js');
const app = express();

// Middleware
app.use(express.json());
app.use(router);

// Connect MongoDB
mongoose.set("strictQuery", false);
mongoose
    .connect(configDB.url)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log(err.message);
        process.exit(1);
    });

// Connect Server
const port = 3000 || process.env.PORT;
app.listen(port, () => console.log(`Server running on port ${port}`));