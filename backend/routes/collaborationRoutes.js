import express from "express";
import {
    addCollaborator,
    getCollaborators,
    removeCollaborator,
    updateCollab,
} from "../controllers/collaborationController.js";
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Tambahkan verifyToken ke semua rute kolaborasi
router.post("/", verifyToken, addCollaborator);
router.get("/", verifyToken, getCollaborators);
router.delete("/:id", verifyToken, removeCollaborator);
router.put('/:id', verifyToken, updateCollab);

export default router;