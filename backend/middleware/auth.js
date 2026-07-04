import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Mengambil secret key dari environment variable
const JWT_SECRET = process.env.JWT_SECRET; 

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Akses ditolak. Silakan login kembali." 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: "Token tidak valid atau kadaluarsa." 
            });
        }
        
        req.user = user; 
        next();
    });
};

export const verifyAdmin = (req, res, next) => {
    // Proteksi tambahan jika lupa memasang verifyToken sebelum middleware ini
    if (!req.user) {
        return res.status(401).json({ 
            success: false, 
            message: "Autentikasi diperlukan." 
        });
    }

    if (req.user.role === 'admin') {
        next(); 
    } else {
        return res.status(403).json({ 
            success: false, 
            message: "Akses ditolak. Tindakan ini membutuhkan hak akses Admin." 
        });
    }
};