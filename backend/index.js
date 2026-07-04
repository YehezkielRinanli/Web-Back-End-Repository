import express from "express";
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import noteRoutes from './routes/notesRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import collaborationRoutes from "./routes/collaborationRoutes.js";
import userRoutes from './routes/userRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import bulletinRoutes from './routes/bulletinRoutes.js';

import db from "./config/database.js";
import User from "./models/User.js"; 
import Note from "./models/Note.js"; 
import Folder from "./models/Folder.js"; 
import Tag from "./models/Tag.js"; 
import Activity from "./models/Activity.js";
import Bulletin from "./models/Bulletin.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import { verifyToken } from "./middleware/auth.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.set('view engine', 'ejs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Folder, { foreignKey: 'userId', as: 'folders' });
Folder.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Folder.hasMany(Note, { foreignKey: 'folderId', as: 'folderNotes' }); 
Note.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });
User.hasMany(Tag, { foreignKey: 'userId', as: 'tags' });
Tag.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Bulletin, { foreignKey: 'author_id', as: 'bulletins' });
Bulletin.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

app.use(express.static(join(__dirname, "public")));
app.use("/uploads", express.static(join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/users', userRoutes);
app.use('/api/notes', verifyToken, noteRoutes);
app.use('/api/folders', verifyToken, folderRoutes);
app.use("/api/collabs", verifyToken, collaborationRoutes);
app.use('/api/tags', verifyToken, tagRoutes);
app.use('/api/activities', verifyToken, activityRoutes);
app.use('/api/bulletins', verifyToken, bulletinRoutes);
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/', (req, res) => {
    res.render('index');
});

app.use(errorMiddleware);

app.get('/api/status', (req, res) => {
    res.json({ message: "Server API Memoora berjalan dengan baik!" });
});

console.log("Memulai sinkronisasi database MySQL...");

db.sync({ alter: true })
    .then(() => {
        console.log("Database MySQL berhasil disinkronkan!");
        
        // Menggunakan port dari Railway jika ada, jika tidak ada (di laptop) pakai 3000
        const PORT = process.env.PORT || 3000; 
        
        httpServer.listen(PORT, () => {
            console.log(`Server API Memoora berjalan di port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("Gagal sinkronisasi database:", error);
    });