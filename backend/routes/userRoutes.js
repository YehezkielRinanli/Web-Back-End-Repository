import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getAllUsers, resetCollabLimit, requestLimitReset } from '../controllers/userController.js'; 
import { updateAvatar } from "../controllers/userController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { verifyToken, verifyAdmin } from '../middleware/auth.js';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Mengambil JWT_SECRET secara aman dari file .env
const JWT_SECRET = process.env.JWT_SECRET;

router.get('/', verifyToken, verifyAdmin, getAllUsers);
router.put('/:id/reset-collab', verifyToken, verifyAdmin, resetCollabLimit);
router.put('/request-reset', verifyToken, requestLimitReset);

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ success: false, message: "Email sudah terdaftar!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({ 
            success: true, 
            message: "Registrasi berhasil!",
            data: { id: newUser.id, username: newUser.username }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Password salah!" });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, 
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ 
            success: true, 
            message: "Login berhasil!",
            token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/profile', verifyToken, async (req, res) => {
    try {
        const { id, username, email, password } = req.body;
        
        if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Akses ditolak!" });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan!" });
        }

        let updatedData = { username, email };

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            updatedData.password = await bcrypt.hash(password, salt);
        }

        await user.update(updatedData);

        res.json({ 
            success: true, 
            message: "Profil berhasil diperbarui!",
            user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/profile/avatar", verifyToken, upload.single("avatar"), updateAvatar);

router.delete('/:id', verifyToken, async (req, res) => {
    try {
        if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Akses ditolak!" });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User tidak ditemukan!" });
        }

        await user.destroy();
        res.json({ success: true, message: "Akun dan data terkait telah dihapus." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;