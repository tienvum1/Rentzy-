const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const Vehicle = require('./Vehicle');

const VehicleImage = sequelize.define('VehicleImage', {
  image_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vehicle_id: {
    type: DataTypes.UUID,
    references: { model: 'vehicles', key: 'vehicle_id' }
  },
  image_url: DataTypes.STRING,
  is_primary: DataTypes.BOOLEAN,
}, {
  tableName: 'vehicle_images',
  timestamps: false,
});

VehicleImage.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });

module.exports = VehicleImage;