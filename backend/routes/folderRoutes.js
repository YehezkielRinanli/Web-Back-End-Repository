import express from 'express';
import { 
    getAllFolders, 
    createFolder, 
    updateFolder, 
    deleteFolder 
} from '../controllers/folderController.js';
import { verifyToken } from '../middleware/auth.js'; // Tambahkan import ini

const router = express.Router();

// Pasang verifyToken di semua rute folder
router.get('/', verifyToken, getAllFolders);
router.post('/', verifyToken, createFolder);
router.put('/:id', verifyToken, updateFolder);
router.delete('/:id', verifyToken, deleteFolder);

export default router;