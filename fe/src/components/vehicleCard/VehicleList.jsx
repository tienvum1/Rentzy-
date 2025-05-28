import React from 'react';
import VehicleCard from './VehicleCard';
import './VehicleList.css';

const vehicles = [
  {
    image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
    name: 'Audi Q5',
    year: '2022',
    seats: 5,
    transmission: 'Số tự động',
    fuel: 'Xăng',
    pricePerHour: '20',
    pricePerDay: '120',
    location: 'Hà Nội',
    isSaved: false,
  },
  {
    image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
    name: 'Mercedes-Benz GLE',
    year: '2023',
    seats: 5,
    transmission: 'Số tự động',
    fuel: 'Gasoline',
    pricePerHour: '25',
    pricePerDay: '150',
    location: 'TP. Hồ Chí Minh',
    isSaved: true,
  },
  {
    image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
    name: 'Nissan Rogue',
    year: '2021',
    seats: 5,
    transmission: 'Số tự động',
    fuel: 'Petrol',
    pricePerHour: '18',
    pricePerDay: '110',
    location: 'Đà Nẵng',
    isSaved: false,
  },
  {
    image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
    name: 'Honda Civic',
    year: '2022',
    seats: 5,
    transmission: 'Số tự động',
    fuel: 'Gasoline',
    pricePerHour: '19',
    pricePerDay: '115',
    location: 'Hải Phòng',
    isSaved: false,
  },
  {
    image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
    name: 'Mazda CX-5',
    year: '2022',
    seats: 5,
    transmission: 'Số tự động',
    fuel: 'Gasoline',
    pricePerHour: '22',
    pricePerDay: '130',
    location: 'Cần Thơ',
    isSaved: false,
  },
  {
    image: 'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg',
    name: 'Ford Mustang',
    year: '2023',
    seats: 5,
    transmission: 'Số tự động',
    fuel: 'Gasoline',
    pricePerHour: '30',
    pricePerDay: '180',
    location: 'Nha Trang',
    isSaved: false,
  },
];

const VehicleList = () => {
  return (
    <div  className='vehicle-list-container'>
     <h1>Vehicle List</h1>
    <div className="vehicle-list">
     
      {vehicles.map((v, idx) => (
        <VehicleCard key={idx} {...v} onSave={() => {}} onViewDetails={() => {}} />
      ))}
    </div>
    </div>
  );
};

export default VehicleList; 