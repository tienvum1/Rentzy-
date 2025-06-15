import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import TimePicker from 'react-time-picker';
import { toast } from 'react-toastify';
import "react-datepicker/dist/react-datepicker.css";
import "react-time-picker/dist/TimePicker.css";
import "react-toastify/dist/ReactToastify.css";
import './DateTimeSelector.css'; // Assuming some basic styling

const DateTimeSelector = ({ bookedDates, onDateTimeChange, initialStartDate, initialEndDate, initialPickupTime, initialReturnTime }) => {
    const [startDate, setStartDate] = useState(initialStartDate ? new Date(initialStartDate) : null);
    const [endDate, setEndDate] = useState(initialEndDate ? new Date(initialEndDate) : null);
    const [pickupTime, setPickupTime] = useState(initialPickupTime || '08:00');
    const [returnTime, setReturnTime] = useState(initialReturnTime || '17:00');

    const handleConfirm = () => {
        if (!startDate || !endDate || !pickupTime || !returnTime) {
            toast.error('Vui lòng chọn đầy đủ ngày và giờ');
            return;
        }

        // Validate date range
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        const [startHours, startMinutes] = pickupTime.split(':').map(Number);
        const [endHours, endMinutes] = returnTime.split(':').map(Number);

        startDateTime.setHours(startHours, startMinutes, 0, 0);
        endDateTime.setHours(endHours, endMinutes, 0, 0);

        if (endDateTime <= startDateTime) {
            toast.error('Thời gian kết thúc phải sau thời gian bắt đầu');
            return;
        }

        // Format dates in YYYY-MM-DD format
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        onDateTimeChange({
            startDate: formatDate(startDateTime),
            endDate: formatDate(endDateTime),
            pickupTime: pickupTime,
            returnTime: returnTime
        });
    };

    const isDateAvailable = useCallback((date) => {
        if (!bookedDates || bookedDates.length === 0) return true;

        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        // Kiểm tra từng booking
        for (const booking of bookedDates) {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            
            // Nếu ngày hiện tại nằm trong khoảng thời gian booking
            if (currentDate >= bookingStart && currentDate <= bookingEnd) {
                // Lấy giờ bắt đầu và kết thúc của booking
                const [startHour] = booking.pickupTime.split(':').map(Number);
                const [endHour] = booking.returnTime.split(':').map(Number);
                
                // Nếu booking kéo dài cả ngày (từ 00:00 đến 23:59)
                if (startHour === 0 && endHour === 23) {
                    return false;
                }
                
                // Nếu booking chỉ trong một khoảng thời gian cụ thể
                // Chúng ta vẫn cho phép chọn ngày này, nhưng sẽ hiển thị icon
                return true;
            }
        }
        return true;
    }, [bookedDates]);

    const getDateClassName = useCallback((date) => {
        if (!isDateAvailable(date)) {
            return 'disabled-date';
        }

        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        // Kiểm tra xem ngày này có booking nào không
        const hasBooking = bookedDates?.some(booking => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            return currentDate >= bookingStart && currentDate <= bookingEnd;
        });

        if (hasBooking) {
            return 'has-booking';
        }

        return '';
    }, [bookedDates, isDateAvailable]);

    // Thêm hàm để lấy thông tin booking cho một ngày cụ thể
    const getBookingInfoForDate = useCallback((date) => {
        if (!bookedDates || bookedDates.length === 0) return null;

        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        return bookedDates.find(booking => {
            const bookingStart = new Date(booking.startDate);
            const bookingEnd = new Date(booking.endDate);
            return currentDate >= bookingStart && currentDate <= bookingEnd;
        });
    }, [bookedDates]);

    // Thêm component để hiển thị thông tin booking
    const BookingInfo = ({ date }) => {
        const booking = getBookingInfoForDate(date);
        if (!booking) return null;

        return (
            <div className="booking-info">
                <span className="booking-time">
                    {booking.pickupTime} - {booking.returnTime}
                </span>
            </div>
        );
    };

    const isHourBooked = useCallback((hour, date) => {
        if (!bookedDates || bookedDates.length === 0) return false;
        if (!date) return false;

        const selectedDateTime = new Date(date);
        selectedDateTime.setHours(hour, 0, 0, 0);

        const vietnamOffset = 7 * 60; // 7 hours in minutes
        const localOffset = selectedDateTime.getTimezoneOffset();
        const totalOffset = vietnamOffset + localOffset;
        selectedDateTime.setMinutes(selectedDateTime.getMinutes() + totalOffset);

        return bookedDates.some(booking => {
            const startDateTime = new Date(booking.startDateTime);
            const endDateTime = new Date(booking.endDateTime);

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                return false;
            }

            startDateTime.setMinutes(startDateTime.getMinutes() + totalOffset);
            endDateTime.setMinutes(endDateTime.getMinutes() + totalOffset);

            return selectedDateTime >= startDateTime && selectedDateTime < endDateTime;
        });
    }, [bookedDates]);

    const getAvailableHours = useCallback((date) => {
        if (!date) return [];
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(dateObj.getTime())) {
            return [];
        }

        return Array.from({ length: 24 }, (_, i) => {
            const hour = i.toString().padStart(2, '0');
            const time = `${hour}:00`;
            return {
                time,
                isAvailable: !isHourBooked(i, dateObj)
            };
        });
    }, [isHourBooked]);

    const filterPassedDates = useCallback((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today && isDateAvailable(date);
    }, [isDateAvailable]);

    const getHighlightDates = useCallback(() => {
        if (!bookedDates || bookedDates.length === 0) return [];

        const highlight = bookedDates.map(booking => {
            const start = new Date(booking.startDateTime);
            const end = new Date(booking.endDateTime);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return null;
            }

            const dates = [];
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dates.push(new Date(d));
            }
            return dates;
        }).filter(Boolean).flat();

        return [
            {
                "react-datepicker__day--highlighted-custom": highlight
            }
        ];
    }, [bookedDates]);

    const handleDateChange = (type, date) => {
        if (!date) {
            if (type === 'startDate') setStartDate(null);
            else setEndDate(null);
            return;
        }

        if (isNaN(date.getTime())) {
            toast.error('Ngày được chọn không hợp lệ.');
            return;
        }

        // Kiểm tra ngày bắt đầu phải lớn hơn thời gian hiện tại
        const now = new Date();
        const selectedDate = new Date(date);
        
        // Nếu chọn ngày hiện tại, kiểm tra giờ
        if (type === 'startDate') {
            if (selectedDate.toDateString() === now.toDateString()) {
                // Nếu là ngày hiện tại, giờ phải lớn hơn giờ hiện tại
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                if (pickupTime) {
                    const [selectedHour, selectedMinute] = pickupTime.split(':').map(Number);
                    if (selectedHour < currentHour || (selectedHour === currentHour && selectedMinute <= currentMinute)) {
                        toast.warning(`Không thể chọn giờ trong quá khứ. Vui lòng chọn giờ sau ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
                        return;
                    }
                }
            } else if (selectedDate < now) {
                toast.warning('Ngày bắt đầu phải lớn hơn thời gian hiện tại.');
                return;
            }
        }

        if (type === 'startDate') {
            setStartDate(date);
            if (endDate && date > endDate) {
                setEndDate(null);
                toast.warning('Ngày trả xe không thể trước ngày nhận xe. Vui lòng chọn lại ngày trả.');
            }
        } else {
            setEndDate(date);
            if (startDate && date < startDate) {
                setStartDate(null);
                toast.warning('Ngày trả xe không thể trước ngày nhận xe. Vui lòng chọn lại ngày nhận.');
            }
        }
    };

    const handleTimeChange = (type, value) => {
        if (!value) return;

        const now = new Date();
        const [selectedHour, selectedMinute] = value.split(':').map(Number);

        // Kiểm tra nếu đang chọn giờ cho ngày hiện tại
        if (type === 'pickup' && startDate && startDate.toDateString() === now.toDateString()) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            if (selectedHour < currentHour || (selectedHour === currentHour && selectedMinute <= currentMinute)) {
                toast.warning(`Không thể chọn giờ trong quá khứ. Vui lòng chọn giờ sau ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`);
                return;
            }
        }

        // Kiểm tra logic thời gian nhận/trả xe
        if (type === 'pickup') {
            if (endDate && returnTime) {
                // Tạo đối tượng Date cho thời gian nhận xe
                const pickupDateTime = new Date(startDate);
                pickupDateTime.setHours(selectedHour, selectedMinute, 0, 0);

                // Tạo đối tượng Date cho thời gian trả xe
                const [returnHour, returnMinute] = returnTime.split(':').map(Number);
                const returnDateTime = new Date(endDate);
                returnDateTime.setHours(returnHour, returnMinute, 0, 0);

                // So sánh cả ngày và giờ
                if (pickupDateTime >= returnDateTime) {
                    if (startDate.toDateString() === endDate.toDateString()) {
                        toast.warning('Giờ nhận xe phải trước giờ trả xe.');
                    } else {
                        toast.warning('Ngày nhận xe phải trước ngày trả xe.');
                    }
                    return;
                }
            }
            setPickupTime(value);
        } else {
            if (startDate && pickupTime) {
                // Tạo đối tượng Date cho thời gian nhận xe
                const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
                const pickupDateTime = new Date(startDate);
                pickupDateTime.setHours(pickupHour, pickupMinute, 0, 0);

                // Tạo đối tượng Date cho thời gian trả xe
                const returnDateTime = new Date(endDate);
                returnDateTime.setHours(selectedHour, selectedMinute, 0, 0);

                // So sánh cả ngày và giờ
                if (pickupDateTime >= returnDateTime) {
                    if (startDate.toDateString() === endDate.toDateString()) {
                        toast.warning('Giờ trả xe phải sau giờ nhận xe.');
                    } else {
                        toast.warning('Ngày trả xe phải sau ngày nhận xe.');
                    }
                    return;
                }
            }
            setReturnTime(value);
        }
    };

    return (
        <div className="date-time-modal-overlay">
            <div className="date-time-modal">
                <div className="modal-header">
                    <h3>Chọn thời gian thuê xe</h3>
                    <button onClick={() => onDateTimeChange(null)}>✕</button>
                </div>

                <div className="date-time-selection">
                    <div className="pickup-section">
                        <h4>Thời gian nhận xe</h4>
                        <DatePicker
                            selected={startDate}
                            onChange={(date) => handleDateChange('startDate', date)}
                            minDate={new Date()}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Chọn ngày nhận xe"
                            className="date-picker-input"
                            filterDate={filterPassedDates}
                            highlightDates={getHighlightDates()}
                            tileClassName={getDateClassName}
                            tileContent={({ date }) => <BookingInfo date={date} />}
                        />
                        {startDate && !isNaN(startDate.getTime()) ? (
                            <div className="time-slots">
                                {getAvailableHours(startDate).map(({ time, isAvailable }) => (
                                    <button
                                        key={time}
                                        className={`time-slot ${pickupTime === time ? 'selected' : ''} ${!isAvailable ? 'time-slot-booked' : ''}`}
                                        onClick={() => isAvailable && handleTimeChange('pickup', time)}
                                        disabled={!isAvailable}
                                        title={!isAvailable ? 'Giờ này đã được đặt' : ''}
                                    >
                                        {time}
                                    </button>
                                ))}
                                {getAvailableHours(startDate).every(hour => !hour.isAvailable) && (
                                    <div className="no-available-hours">
                                        Không có giờ khả dụng cho ngày này
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-available-hours">
                                Vui lòng chọn ngày nhận xe hợp lệ
                            </div>
                        )}
                        <TimePicker
                            onChange={(value) => handleTimeChange('pickup', value)}
                            value={pickupTime}
                            disableClock={true}
                            format="HH:mm"
                            clearIcon={null}
                            className="custom-time-picker"
                            minTime={startDate && startDate.toDateString() === new Date().toDateString() ? new Date().getHours() + ':00' : '00:00'}
                            hourPlaceholder="HH"
                            minutePlaceholder="mm"
                        />
                    </div>

                    <div className="return-section">
                        <h4>Thời gian trả xe</h4>
                        <DatePicker
                            selected={endDate}
                            onChange={(date) => handleDateChange('endDate', date)}
                            minDate={startDate || new Date()}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Chọn ngày trả xe"
                            className="date-picker-input"
                            filterDate={filterPassedDates}
                            highlightDates={getHighlightDates()}
                            tileClassName={getDateClassName}
                            tileContent={({ date }) => <BookingInfo date={date} />}
                        />
                        {endDate && !isNaN(endDate.getTime()) ? (
                            <div className="time-slots">
                                {getAvailableHours(endDate).map(({ time, isAvailable }) => (
                                    <button
                                        key={time}
                                        className={`time-slot ${returnTime === time ? 'selected' : ''} ${!isAvailable ? 'time-slot-booked' : ''}`}
                                        onClick={() => isAvailable && handleTimeChange('return', time)}
                                        disabled={!isAvailable}
                                        title={!isAvailable ? 'Giờ này đã được đặt' : ''}
                                    >
                                        {time}
                                    </button>
                                ))}
                                {getAvailableHours(endDate).every(hour => !hour.isAvailable) && (
                                    <div className="no-available-hours">
                                        Không có giờ khả dụng cho ngày này
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-available-hours">
                                Vui lòng chọn ngày trả xe hợp lệ
                            </div>
                        )}
                        <TimePicker
                            onChange={(value) => handleTimeChange('return', value)}
                            value={returnTime}
                            disableClock={true}
                            format="HH:mm"
                            clearIcon={null}
                            className="custom-time-picker"
                            minTime={endDate && endDate.toDateString() === new Date().toDateString() ? new Date().getHours() + ':00' : '00:00'}
                            hourPlaceholder="HH"
                            minutePlaceholder="mm"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="confirm-button"
                        onClick={handleConfirm}
                    >
                        Xác nhận
                    </button>
                    <button
                        className="cancel-button"
                        onClick={() => onDateTimeChange(null)}
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DateTimeSelector; 