import React, { useState } from 'react';
import './ConsignForm.css';
import RentalSteps  from './RentalSteps'

const initialState = {
  brand: '',
  model: '',
  year: '',
  location: '',
  ownerType: '',
  name: '',
  phone: '',
  note: ''
};

const carBrands = [
  { value: '', label: 'Chọn hãng xe' },
  { value: 'Audi', label: 'Audi' },
  { value: 'Toyota', label: 'Toyota' },
  { value: 'Mazda', label: 'Mazda' },
  { value: 'Mercedes', label: 'Mercedes' },
  { value: 'VinFast', label: 'VinFast' }
];

const carModels = {
  Audi: ['A4', 'A6', 'Q5'],
  Toyota: ['Vios', 'Camry', 'Fortuner'],
  Mazda: ['CX-5', 'Mazda 3'],
  Mercedes: ['C200', 'E300'],
  VinFast: ['Lux A2.0', 'Fadil']
};

const years = Array.from({ length: 10 }, (_, i) => `${2025 - i}`);

const locations = [
  'TP HỒ CHÍ MINH',
  'HÀ NỘI',
  'ĐÀ NẴNG',
  'CẦN THƠ',
  'HẢI PHÒNG'
];

const ownerTypes = [
  'Chủ xe cá nhân',
  'Công ty cho thuê'
];

const ConsignForm = () => {
  const [form, setForm] = useState(initialState);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleBrandChange = e => {
    setForm({ ...form, brand: e.target.value, model: '' });
    setError('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Simple validation
    if (!form.brand || !form.model || !form.year || !form.location || !form.ownerType || !form.name || !form.phone) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    setSubmitted(true);
    // Gửi dữ liệu lên server tại đây nếu cần
  };

  return (
    <div className="consign-main-bg">
      <div className="consign-main-container">
        <div className="consign-form-left">
          <h2 className="consign-title">
            Đăng ký ký gửi xe <span className="brand-highlight">Rentzy</span>
          </h2>
          <p className="consign-desc">
            Nhận thu nhập thụ động từ chiếc xe của bạn. Đăng ký ký gửi xe chỉ với vài bước đơn giản, an toàn và minh bạch.
          </p>
          <form className="consign-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <select name="brand" value={form.brand} onChange={handleBrandChange} required>
                {carBrands.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              <select name="model" value={form.model} onChange={handleChange} required disabled={!form.brand}>
                <option value="">Chọn dòng xe</option>
                {form.brand && carModels[form.brand].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select name="year" value={form.year} onChange={handleChange} required>
                <option value="">Đời xe</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-row">
              <select name="location" value={form.location} onChange={handleChange} required>
                <option value="">Khu vực</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <select name="ownerType" value={form.ownerType} onChange={handleChange} required>
                <option value="">Loại chủ xe</option>
                {ownerTypes.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <input
              type="text"
              name="name"
              placeholder="Họ tên chủ xe *"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Số điện thoại *"
              value={form.phone}
              onChange={handleChange}
              required
              pattern="^0[0-9]{9,10}$"
              title="Số điện thoại hợp lệ bắt đầu bằng 0 và có 10-11 số"
            />
            <input
              type="text"
              name="note"
              placeholder="Ghi chú (không bắt buộc)"
              value={form.note}
              onChange={handleChange}
            />
            <div className="income-row">
              <span>Ước tính thu nhập/tháng:</span>
              <span className="income-value">45.430.000₫</span>
            </div>
            {error && <div className="form-error">{error}</div>}
            {submitted ? (
              <div className="form-success">Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ sớm.</div>
            ) : (
              <button type="submit" className="btn-submit">ĐĂNG KÝ NGAY</button>
            )}
          </form>
        </div>
        <div className="consign-form-right">
          <img
            src="https://images.unsplash.com/photo-1511918984145-48de785d4c4e?auto=format&fit=crop&w=600&q=80"
            alt="Giao xe"
            className="consign-img"
          />
        </div>
        
      </div>
      <RentalSteps/>
    </div>
  );
};

export default ConsignForm;
