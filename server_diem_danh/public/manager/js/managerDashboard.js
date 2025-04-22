// public/manager/js/dashboard.js
import { setupTimeFilter } from '/server_diem_danh/public/assets/js/attendanceFilter.js';
import { setupEventListeners } from './eventHandlers.js';

// Khởi tạo khi trang tải
document.addEventListener('DOMContentLoaded', () => {
    setupTimeFilter('filterDate', 'timeFilter', 'filterStartTime', 'filterEndTime');
    setupEventListeners();
});