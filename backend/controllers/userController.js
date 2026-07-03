import User from '../models/User.js';
import fs from "fs";

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'collab_edit_count','reset_request', 'createdAt']
        });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

export const resetCollabLimit = async (req, res, next) => {
    try {
        const targetUserId = req.params.id;

        const user = await User.findByPk(targetUserId);
        if (!user) {
            return next(new Error("404"));
        }

        user.collab_edit_count = 0;
        user.reset_request = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: `Limit edit kolaborasi untuk user ${user.email} berhasil di-reset menjadi 0.`
        });
    } catch (error) {
        next(error);
    }
};

export const updateAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            const error = new Error("File gambar tidak ditemukan. Harap unggah file!");
            error.status = 400;
            return next(error);
        }

        const userId = req.user.id; 

        const user = await User.findByPk(userId);
        if (!user) {
            return next(new Error("404"));
        }

        if (user.avatarUrl && fs.existsSync(user.avatarUrl)) {
            fs.unlinkSync(user.avatarUrl);
        }

        user.avatarUrl = req.file.path; 
        await user.save();

        res.status(200).json({
            success: true,
            message: "Foto profil berhasil diperbarui!",
            data: {
                avatarUrl: user.avatarUrl
            }
        });

    } catch (error) {
        next(error); 
    }
};

export const requestLimitReset = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

        if (user.collab_edit_count < 3) {
            return res.status(400).json({ success: false, message: "Limit Anda belum habis (masih ada sisa)." });
        }

        user.reset_request = true;
        await user.save();

        res.status(200).json({ success: true, message: "Permintaan reset berhasil dikirim ke Admin!" });
    } catch (error) {
        next(error);
    }
};