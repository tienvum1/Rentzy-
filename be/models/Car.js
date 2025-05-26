const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Vehicle = require('./Vehicle');

const Car = sequelize.define('Car', {
  vehicle_id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: { model: 'vehicles', key: 'vehicle_id' }
  },
  seats: DataTypes.INTEGER,
  body_type: DataTypes.STRING,
  transmission: DataTypes.STRING,
  fuel_type: DataTypes.STRING,
}, {
  tableName: 'cars',
  timestamps: false,
});

Car.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

module.exports = Car;