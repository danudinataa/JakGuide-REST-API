const Config = require("../models/config.js");
const Stop = require("../models/stop.js");
const Line = require("../models/line.js");

const createLine = async (req, res) => {
    var { nama, moda, pemberhentian_awal, pemberhentian_akhir } = req.body;

    try {
        // Fetch the stops by their IDs
        const startStop = await Stop.findById(pemberhentian_awal).populate('id nama jenis maps_link integrasi_pemberhentian rute');
        const endStop = await Stop.findById(pemberhentian_akhir).populate('id nama jenis maps_link integrasi_pemberhentian rute');

        // Check if the stops exist
        if (!startStop) {
            return res.status(404).json({ message: `Pemberhentian ${pemberhentian_awal} tidak ditemukan.` });
        }

        if (!endStop) {
            return res.status(404).json({ message: `Pemberhentian ${pemberhentian_akhir} tidak ditemukan.` });
        }

        // Check if all fields are provided
        if (!nama || !moda || !pemberhentian_awal || !pemberhentian_akhir) {
            return res.status(400).json({ message: "Semua field harus diisi." });
        }

        // Create new line data, including the start and end stops in the pemberhentian array
        const newLineData = {
            nama,
            moda,
            pemberhentian_awal,
            pemberhentian_akhir,
            pemberhentian: [pemberhentian_awal, pemberhentian_akhir]
        };

        // Create the new line
        const newLine = await Line.create(newLineData);

        // Add the line ID to the stops' routes
        if (!startStop.rute.includes(newLine._id)) {
            startStop.rute.push(newLine._id);
        }

        if (!endStop.rute.includes(newLine._id)) {
            endStop.rute.push(newLine._id);
        }

        // Save the updated stops
        await startStop.save();
        await endStop.save();

        // Save the new line
        await newLine.save();

        return res.status(201).json({
            message: `Berhasil membuat rute ${newLine.nama}`,
            line: newLine
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const addStopToLine = async (req, res) => {
    const lineId = req.params.id;
    const { stopId, position, referenceStopId } = req.body;

    try {
        const line = await Line.findById(lineId);

        if (!line) {
            return res.status(404).json({ message: `Rute dengan ID ${lineId} tidak ditemukan.` });
        }

        const stop = await Stop.findById(stopId);

        if (!stop) {
            return res.status(404).json({ message: `Pemberhentian dengan ID ${stopId} tidak ditemukan.` });
        }

        const referenceIndex = line.pemberhentian.findIndex(stop => stop.toString() === referenceStopId);

        if (referenceIndex === -1) {
            return res.status(404).json({ message: `Pemberhentian referensi dengan ID ${referenceStopId} tidak ditemukan dalam rute.` });
        }

        if (position === 'before') {
            line.pemberhentian.splice(referenceIndex, 0, stopId);
            // Update pemberhentian_awal if the new stop is placed before the first stop
            if (referenceIndex === 0) {
                line.pemberhentian_awal = stopId;
            }
        } else if (position === 'after') {
            line.pemberhentian.splice(referenceIndex + 1, 0, stopId);
            // Update pemberhentian_akhir if the new stop is placed after the last stop
            if (referenceIndex === line.pemberhentian.length - 1) {
                line.pemberhentian_akhir = stopId;
            }
        } else {
            return res.status(400).json({ message: 'Posisi harus "before" atau "after".' });
        }

        // Save the updated line
        await line.save();

        // Add the line ID to the stop's routes if not already present
        if (!stop.rute.includes(lineId)) {
            stop.rute.push(lineId);
        }

        // Save the updated stop
        await stop.save();

        return res.status(200).json({ message: 'Pemberhentian berhasil ditambahkan ke rute.', line });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getAllLines = async (req, res) => {
    try {
        const lines = await Line.find()
        .populate('pemberhentian_awal', 'id nama jenis maps_link integrasi_pemberhentian rute')
        .populate('pemberhentian_akhir', 'id nama jenis maps_link integrasi_pemberhentian rute')
        .populate('pemberhentian', 'id nama jenis maps_link integrasi_pemberhentian rute')
        .exec();
        return res.status(200).json({
            message: "Success",
            lines: lines
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getLineById = async (req, res) => {
    try {
        const line = await Line.findById(req.params.id)
        .populate('pemberhentian_awal', 'id nama jenis maps_link integrasi_pemberhentian rute')
        .populate('pemberhentian_akhir', 'id nama jenis maps_link integrasi_pemberhentian rute')
        .populate('pemberhentian', 'id nama jenis maps_link integrasi_pemberhentian rute');

        if (!line) {
            return res.status(404).json({ message: "Rute tidak ditemukan." });
        }

        return res.status(200).json({
            message: "Success",
            line: line
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getStopsFromLine = async (req, res) => {

    const lineId = req.params.id;

    try {
        const line = await Line.findById(lineId).populate({
            path: 'pemberhentian',
            populate: {
                path: 'integrasi_pemberhentian',
                select: 'nama jenis maps_link' // Menyertakan hanya field yang diperlukan
            }
        });

        if (!line) {
            return res.status(404).json({ message: `Rute dengan ID ${lineId} tidak ditemukan.` });
        }

        return res.status(200).json({
            message: `Daftar pemberhentian untuk rute ${line.nama}.`,
            stops: line.pemberhentian
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateLine = async (req, res) => {
    const lineId = req.params.id;
    const { nama, moda, pemberhentian_awal, pemberhentian_akhir } = req.body;

    try {
        const line = await Line.findById(lineId);

        if (!line) {
            return res.status(404).json({ message: `Rute dengan ID ${lineId} tidak ditemukan.` });
        }

        if (nama !== undefined) line.nama = nama;
        if (moda !== undefined) line.moda = moda;

        // Jika pemberhentian_awal diubah
        if (pemberhentian_awal !== undefined) {
            const newStartStop = await Stop.findById(pemberhentian_awal).populate('id nama jenis maps_link integrasi_pemberhentian rute');
            if (!newStartStop) {
                return res.status(404).json({ message: `Pemberhentian ${pemberhentian_awal} tidak ditemukan.` });
            }
            line.pemberhentian_awal = newStartStop;

            // Perbarui item pertama dalam daftar pemberhentian
            line.pemberhentian[0] = pemberhentian_awal;
        }

        // Jika pemberhentian_akhir diubah
        if (pemberhentian_akhir !== undefined) {
            const newEndStop = await Stop.findById(pemberhentian_akhir).populate('id nama jenis maps_link integrasi_pemberhentian rute');
            if (!newEndStop) {
                return res.status(404).json({ message: `Pemberhentian ${pemberhentian_akhir} tidak ditemukan.` });
            }
            line.pemberhentian_akhir = newEndStop;

            // Perbarui item terakhir dalam daftar pemberhentian
            line.pemberhentian[line.pemberhentian.length - 1] = pemberhentian_akhir;
        }

        await line.save();

        return res.status(200).json({
            message: `Rute ${line.nama} berhasil diperbaharui.`,
            line: line
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const updateStopInLine = async (req, res) => {

    const lineId = req.params.id;
    const { oldStopId, newStopId } = req.body;

    try {
        const line = await Line.findById(lineId);

        if (!line) {
            return res.status(404).json({ message: `Rute dengan ID ${lineId} tidak ditemukan.` });
        }

        const oldStopIndex = line.pemberhentian.findIndex(stop => stop.toString() === oldStopId);

        if (oldStopIndex === -1) {
            return res.status(404).json({ message: `Pemberhentian lama dengan ID ${oldStopId} tidak ditemukan dalam rute.` });
        }

        const newStop = await Stop.findById(newStopId);

        if (!newStop) {
            return res.status(404).json({ message: `Pemberhentian baru dengan ID ${newStopId} tidak ditemukan.` });
        }

        // Update the stop in the route
        line.pemberhentian[oldStopIndex] = newStopId;

        // Update pemberhentian_awal if the first stop is updated
        if (oldStopIndex === 0) {
            line.pemberhentian_awal = newStopId;
        }

        // Update pemberhentian_akhir if the last stop is updated
        if (oldStopIndex === line.pemberhentian.length - 1) {
            line.pemberhentian_akhir = newStopId;
        }

        await line.save();

        return res.status(200).json({
            message: 'Pemberhentian berhasil diperbarui dalam rute.',
            line
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const deleteLine = async (req, res) => {
    try {
        const line = await Line.findByIdAndDelete(req.params.id);
        if (line) {
            return res.status(200).json({
                message: `Rute ${line.nama} berhasil dihapus.`
            });
        } else {
            return res.status(404).json({
                message: "Rute tidak ditemukan."
            });
        }
    } catch (error) {
        return res.status(409).json({
            message: error.message
        });
    }
};

const deleteStopFromLine = async (req, res) => {
    const lineId = req.params.id;
    const { stopId } = req.body;

    try {
        const line = await Line.findById(lineId);

        if (!line) {
            return res.status(404).json({ message: `Rute dengan ID ${lineId} tidak ditemukan.` });
        }

        const stopIndex = line.pemberhentian.findIndex(stop => stop.toString() === stopId);

        if (stopIndex === -1) {
            return res.status(404).json({ message: `Pemberhentian dengan ID ${stopId} tidak ditemukan dalam rute.` });
        }

        // Cek jika pemberhentian yang tersisa hanya 2
        if (line.pemberhentian.length <= 2) {
            return res.status(400).json({ message: 'Tidak dapat menghapus pemberhentian karena rute harus memiliki setidaknya dua pemberhentian.' });
        }

        // Remove the stop from the route
        line.pemberhentian.splice(stopIndex, 1);

        // Update pemberhentian_awal if the first stop is deleted
        if (stopIndex === 0) {
            line.pemberhentian_awal = line.pemberhentian[0] || null;
        }

        // Update pemberhentian_akhir if the last stop is deleted
        if (stopIndex === line.pemberhentian.length) {
            line.pemberhentian_akhir = line.pemberhentian[line.pemberhentian.length - 1] || null;
        }

        await line.save();

        return res.status(200).json({
            message: 'Pemberhentian berhasil dihapus dari rute.',
            line
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { createLine, addStopToLine, getAllLines, getLineById, getStopsFromLine, updateLine, updateStopInLine, deleteLine, deleteStopFromLine };