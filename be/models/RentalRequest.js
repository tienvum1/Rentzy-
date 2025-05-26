const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const RentalRequest = sequelize.define('RentalRequest', {
  request_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  renter_id: { type: DataTypes.UUID },
  vehicle_id: { type: DataTypes.UUID },
  start_date: DataTypes.DATEONLY,
  end_date: DataTypes.DATEONLY,
  pickup_location: DataTypes.TEXT,
  status: DataTypes.STRING,
  created_at: DataTypes.DATE,
}, {
  tableName: 'rental_requests',
  timestamps: false,
});

module.exports = RentalRequest;