const express = require('express');
const {
    createStop,
    getAllStops,
    deleteStop,
    addStopIntegration,
    getStopById,
    deleteIntegration,
    updateStop
} = require("../controllers/stopController.js");

const {
    createLine,
    addStopToLine,
    getAllLines,
    getLineById,
    getStopsFromLine,
    updateLine,
    updateStopInLine,
    deleteLine,
    deleteStopFromLine
} = require("../controllers/lineController.js");

const router = express.Router();

/**
 * Router Pemberhentian
 */
router.post("/stop", createStop);
router.post("/integration/:id", addStopIntegration);
router.get("/stops", getAllStops);
router.get("/stop/:id", getStopById);
router.put("/stop/:id", updateStop);
router.delete("/stop/:id", deleteStop);
router.delete("/integration/:id", deleteIntegration);

/**
 * Router Rute
 */
router.post("/line", createLine);
router.post("/line/stop/:id", addStopToLine);
router.get("/lines", getAllLines);
router.get("/line/:id", getLineById);
router.get("/line/stop/:id", getStopsFromLine);
router.put("/line/:id", updateLine);
router.put("/line/stop/:id", updateStopInLine);
router.delete("/line/:id", deleteLine);
router.delete("/line/stop/:id", deleteStopFromLine);

module.exports = router;