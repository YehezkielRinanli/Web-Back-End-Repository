import { Sequelize } from "sequelize";
import db from "../config/database.js";

const { DataTypes } = Sequelize;

const User = db.define('users', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user'
    },
    collab_edit_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    last_collab_edit_date: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    freezeTableName: true
});

export default User;