import { Sequelize } from "sequelize";

//sesuaikan nama database kita dgn yg dibawah, dan untuk password boleh diubah saat pull
//sebelum push kosongkan bagian password database nya untuk mempermudah kita
const db = new Sequelize('project_uts_db', 'root', 'Lohengr@M|945', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false,
});

export default db;
