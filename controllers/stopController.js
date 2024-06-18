const Config = require("../models/config.js");
const Stop = require("../models/stop.js");
const Line = require("../models/line.js");

/**
 * @returns Membuat sebuah pemberhentian ke database
 */
const createStop = async (req, res) => {

    const { nama, jenis, latitude, longitude, maps_link } = req.body;
    
    if (!nama || !jenis || !latitude || !longitude || !maps_link) {
        return res.status(400).json({ message: "Semua field harus diisi." });
    }

    const newStopData = { nama, jenis, latitude, longitude, maps_link };

    try {

        const newStop = await Stop.create(newStopData);

        await newStop.save();
        return res.status(201).json({
            message: "Success",
            stop: newStop
        });
    } catch (error) {
        return res.status(409).json({
            message: error.message
        });
    }  
};

/**
 * @returns Menambahkan pemberhentian integrasi ke sebuah pemberhentian
 */
const addStopIntegration = async (req, res) => {

    const stopId = req.params.id;
    const { id_pemberhentian } = req.body; // ID pemberhentian yang ingin diintegrasikan

    try {
        const stop = await Stop.findById(stopId).populate('integrasi_pemberhentian');
        const integrasiStop = await Stop.findById(id_pemberhentian).populate('integrasi_pemberhentian');

        if (!stop) {
            return res.status(404).json({ message: `Pemberhentian ${stopId} tidak ditemukan.` });
        }

        if (!integrasiStop) {
            return res.status(404).json({ message: `Pemberhentian ${id_pemberhentian} tidak ditemukan.` });
        }

        if (stopId === id_pemberhentian) {
            return res.status(400).json({ message: "Tidak bisa mengintegrasikan pemberhentian dengan dirinya sendiri." });
        }

        var whi = "";

        // Tambahkan integrasiStop ke stop jika belum ada
        if (!stop.integrasi_pemberhentian.some(p => p._id.toString() === id_pemberhentian)) {
            stop.integrasi_pemberhentian.push(id_pemberhentian);
            whi += "1";
        }

        // Tambahkan stop ke integrasiStop jika belum ada
        if (!integrasiStop.integrasi_pemberhentian.some(p => p._id.toString() === stopId)) {
            integrasiStop.integrasi_pemberhentian.push(stopId);
            whi += "2";
        }

        // Simpan kedua pemberhentian yang diperbarui
        await stop.save();
        await integrasiStop.save();

        // Dapatkan semua pemberhentian yang terintegrasi dengan stop
        const stopIntegrations = await Stop.find({ integrasi_pemberhentian: stopId }).populate('integrasi_pemberhentian');

        // Dapatkan semua pemberhentian yang terintegrasi dengan integrasiStop
        const integrasiStopIntegrations = await Stop.find({ integrasi_pemberhentian: id_pemberhentian }).populate('integrasi_pemberhentian');

        for (let s of stopIntegrations) {
            if (!s.integrasi_pemberhentian.some(p => p._id.toString() === id_pemberhentian) && s._id.toString() !== id_pemberhentian) {
                s.integrasi_pemberhentian.push(id_pemberhentian);
                whi += "3";
                console.log("3" + s.nama);
                await s.save();
            }
            if (!integrasiStop.integrasi_pemberhentian.some(p => p._id.toString() === s._id.toString()) && s._id.toString() !== id_pemberhentian) {
                integrasiStop.integrasi_pemberhentian.push(s._id);
                whi += "4";
                console.log("4" + s.nama + s._id + " " + id_pemberhentian);
                await integrasiStop.save();
            }
        }

        // Tambahkan stop ke semua integrasi integrasiStop, dan sebaliknya
        for (let s of integrasiStopIntegrations) {
            if (!s.integrasi_pemberhentian.some(p => p._id.toString() === stopId) && s._id.toString() !== stopId) {
                s.integrasi_pemberhentian.push(stopId);
                whi += "5";
                console.log("5" + s.nama);
                await s.save();
            }
            if (!stop.integrasi_pemberhentian.some(p => p._id.toString() === s._id.toString()) && s._id.toString() !== stopId) {
                stop.integrasi_pemberhentian.push(s._id);
                whi += "6";
                console.log("6" + s.nama);
                await stop.save();
            }
        }

        return res.status(200).json({ 
            message: `Integrasi ${stop.jenis} ${stop.nama} dan ${integrasiStop.jenis} ${integrasiStop.nama} berhasil ditambahkan. ${whi}`, 
            stop: stop,
            integrasi: integrasiStop
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @returns Menampilkan seluruh pemberhentian yang terdaftar
 */
const getAllStops = async (req, res) => {
    try {
        const stops = await Stop.find()
        .populate('integrasi_pemberhentian', 'id nama jenis rute')
        .populate({
            path: 'rute',
            select: 'id nama moda pemberhentian_awal pemberhentian_akhir',
            populate: [
                { path: 'pemberhentian_awal', select: 'nama' },
                { path: 'pemberhentian_akhir', select: 'nama' }
            ]
        })
        .exec();
        return res.status(200).json({
            message: "Success",
            stops: stops
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @returns Menampilkan pemberhentian berdasarkan id pemberhentian
 */
const getStopById = async (req, res) => {
    try {
        const stop = await Stop.findById(req.params.id)
            .populate('integrasi_pemberhentian', 'id nama moda rute')
            .populate({
                path: 'rute',
                select: 'id nama moda pemberhentian_awal pemberhentian_akhir',
                populate: [
                    { path: 'pemberhentian_awal', select: 'nama' },
                    { path: 'pemberhentian_akhir', select: 'nama' }
                ]
            });

        if (!stop) {
            return res.status(404).json({ message: "Pemberhentian tidak ditemukan" });
        }

        return res.status(200).json({
            message: "Success",
            stop: stop
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateStop = async (req, res) => {

    const stopId = req.params.id;
    const { nama, jenis, latitude, longitude, maps_link } = req.body;

    try {
        const stop = await Stop.findById(stopId);

        if (!stop) {
            return res.status(404).json({ message: `Pemberhentian ${stopId} tidak ditemukan.` });
        }

        // Update fields
        if (nama !== undefined) stop.nama = nama;
        if (jenis !== undefined) stop.jenis = jenis;
        if (latitude !== undefined) stop.latitude = latitude;
        if (longitude !== undefined) stop.longitude = longitude;
        if (maps_link !== undefined) stop.maps_link = maps_link;

        await stop.save();

        return res.status(200).json({
            message: `Pemberhentian ${stop.jenis} ${stop.nama} berhasil diperbaharui.`,
            stop: stop
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

/**
 * @returns Menghapus sebuah pemberhentian berdasarkan id pemberhentian
 */
const deleteStop = async (req, res) => {
    try {
        const stop = await Stop.findByIdAndDelete(req.params.id);
        if (stop) {
            return res.status(200).json({
                message: `Pemberhentian ${stop.jenis} ${stop.nama} berhasil dihapus.`
            });
        } else {
            return res.status(404).json({
                message: "Pemberhentian tidak ditemukan."
            });
        }
    } catch (error) {
        return res.status(409).json({
            message: error.message
        });
    }
};

const deleteIntegration = async (req, res) => {

    const stopId = req.params.id;
    const { id_pemberhentian } = req.body; // ID pemberhentian yang ingin dihapus integrasinya

    try {
        const stop = await Stop.findById(stopId);
        const integrasiStop = await Stop.findById(id_pemberhentian);

        if (!stop) {
            return res.status(404).json({ message: `Pemberhentian ${stopId} tidak ditemukan.` });
        }

        if (!integrasiStop) {
            return res.status(404).json({ message: `Pemberhentian ${id_pemberhentian} tidak ditemukan.` });
        }

        // Dapatkan semua pemberhentian yang terintegrasi dengan stop
        const stopIntegrations = await Stop.find({ integrasi_pemberhentian: stopId });

        // Untuk setiap pemberhentian yang terintegrasi, hapus integrasi dengan integrasiStop
        for (let s of stopIntegrations) {
            s.integrasi_pemberhentian = s.integrasi_pemberhentian.filter(p => p.toString() !== id_pemberhentian);
            await s.save();
        }

        // Hapus integrasiStop dari daftar integrasi_pemberhentian stop
        stop.integrasi_pemberhentian = stop.integrasi_pemberhentian.filter(p => p.toString() !== id_pemberhentian);

        // Simpan perubahan pada stop
        await stop.save();

        // Hapus stop dari daftar integrasi_pemberhentian integrasiStop
        integrasiStop.integrasi_pemberhentian = integrasiStop.integrasi_pemberhentian.filter(p => p.toString() !== stopId);

        // Simpan perubahan pada integrasiStop
        await integrasiStop.save();

        return res.status(200).json({ 
            message: `Integrasi ${stop.jenis} ${stop.nama} dan ${integrasiStop.jenis} ${integrasiStop.nama} berhasil dihapus.`, 
            stop: stop,
            integrasi: integrasiStop
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }

};

module.exports = { createStop, addStopIntegration, getAllStops, getStopById, deleteStop, deleteIntegration, updateStop };