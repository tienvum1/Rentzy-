const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Vehicle = require('./Vehicle');

const Motorbike = sequelize.define('Motorbike', {
  vehicle_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: { model: 'vehicles', key: 'vehicle_id' }
  },
  engine_capacity: DataTypes.INTEGER,
  has_gear: DataTypes.BOOLEAN,
}, {
  tableName: 'motorbikes',
  timestamps: false,
});

Motorbike.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

module.exports = Motorbike;