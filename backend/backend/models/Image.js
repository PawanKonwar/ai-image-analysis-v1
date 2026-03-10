import { DataTypes } from 'sequelize';
import sequelize from './db.js';

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  objects: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  text: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  dominant_colors: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  s3_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'analyses',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Image;
