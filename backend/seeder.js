import db from './config/database.js';
import User from './models/User.js';
import Bulletin from './models/Bulletin.js';
import Note from './models/Note.js';
import Folder from './models/Folder.js';
import Tag from './models/Tag.js';
import Activity from './models/Activity.js';
import Collaboration from './models/Collaboration.js';
import bcrypt from 'bcryptjs';

const runSeeder = async () => {
    const isNuke = process.argv.includes('--nuke');

    try {
        await db.authenticate();
        
        // Sinkronisasi struktur database awal
        await db.sync({ alter: true });

        if (isNuke) {
            console.log('Memulai proses Nuke (Pembersihan database total)...');
            
            // Hapus tabel-tabel anak terlebih dahulu untuk menghindari Foreign Key Constraint Error
            await Collaboration.destroy({ truncate: { cascade: true } });
            await Note.destroy({ truncate: { cascade: true } });
            await Folder.destroy({ truncate: { cascade: true } });
            await Tag.destroy({ truncate: { cascade: true } });
            await Activity.destroy({ truncate: { cascade: true } });
            await Bulletin.destroy({ truncate: { cascade: true } });
            
            // Setelah tabel anak bersih, baru tabel induk User aman untuk dihapus
            await User.destroy({ truncate: { cascade: true } });
            
            console.log('✔ Database berhasil di-nuke dan dibersihkan!');
        } else {
            console.log('Struktur database berhasil disinkronkan.');
        }

        const email = 'RUAM@memoora.com';
        const isExist = await User.findOne({ where: { email } });

        if (!isExist || isNuke) {
            await User.create({
                username: 'RUAM',
                email,
                password: await bcrypt.hash('RUAM', 10),
                role: 'admin',
                collab_edit_count: 0
            });
            console.log(`[${email}] Akun Admin utama berhasil dibuat.`);
        }
    } catch (error) {
        console.error('Seeder Gagal:', error.message);
    } finally {
        process.exit(0);
    }
};

runSeeder();