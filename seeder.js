import db from './config/database.js';
import User from './models/User.js';
import Bulletin from './models/Bulletin.js';
import bcrypt from 'bcryptjs';

const runSeeder = async () => {
    const isNuke = process.argv.includes('--nuke');

    try {
        await db.authenticate();
        
        await db.sync({ alter: true });

        if (isNuke) {
            await User.destroy({ truncate: { cascade: true } });
            await Bulletin.destroy({ truncate: { cascade: true } });
            console.log('Database direset');
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
            console.log(`[${email}]`);
        }
    } catch (error) {
        console.error('Seeder Gagal:', error.message);
    } finally {
        process.exit(0);
    }
};

runSeeder();