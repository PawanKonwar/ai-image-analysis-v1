import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Analysis = sequelize.define('Analysis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  image_metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  ai_response: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'analyses',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default Analysis;
