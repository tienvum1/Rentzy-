const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');

const Vehicle = sequelize.define('Vehicle', {
  vehicle_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  owner_id: {
    type: DataTypes.UUID,
    references: { model: 'users', key: 'user_id' }
  },
  brand: DataTypes.STRING,
  model: DataTypes.STRING,
  type: DataTypes.STRING, // 'car' or 'motorbike'
  license_plate: DataTypes.STRING,
  location: DataTypes.TEXT,
  is_available: DataTypes.BOOLEAN,
  price_per_day: DataTypes.DECIMAL,
  deposit_required: DataTypes.DECIMAL,
  terms: DataTypes.TEXT,
  created_at: DataTypes.DATE,
}, {
  tableName: 'vehicles',
  timestamps: false,
});

Vehicle.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

module.exports = Vehicle;