import express from "express";
import { 
    getAllNotes, 
    getNoteById, 
    createNote, 
    updateNote, 
    deleteNote
 } from "../controllers/notesController.js"; 
import { upload } from "../middleware/uploadMiddleware.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Semua rute notes wajib melewati verifikasi token JWT terlebih dahulu
router.get("/", verifyToken, getAllNotes);
router.get("/:id", verifyToken, getNoteById);
router.post("/", verifyToken, upload.single("lampiran"), createNote);
router.put("/:id", verifyToken, upload.single("lampiran"), updateNote);
router.delete("/:id", verifyToken, deleteNote);

export default router;