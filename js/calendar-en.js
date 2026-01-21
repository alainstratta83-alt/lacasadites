// ===================================
// Calendar System - La Casa di Tes
// ENGLISH VERSION
// ===================================

// ⚙️ MINIMUM STAY CONFIGURATION
// ====================================
const MINIMUM_NIGHTS = 5; // 🔧 MODIFY THIS NUMBER TO CHANGE MINIMUM STAY

// ⚙️ ADVANCE NOTICE CONFIGURATION
// ====================================
const ADVANCE_NOTICE_DAYS = 5; // 🔧 MODIFY THIS NUMBER TO CHANGE ADVANCE NOTICE

class BookingCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedStartDate = null;
        this.selectedEndDate = null;
        this.occupiedDates = new Set();
        this.adminMode = false;
        this.minimumNights = MINIMUM_NIGHTS;
        this.advanceNoticeDays = ADVANCE_NOTICE_DAYS;
        this.init();
    }

    async init() {
        this.occupiedDates = await this.loadOccupiedDates();
        this.renderCalendar();
        this.setupEventListeners();
        this.updateBookingInfo();
    }

    async loadOccupiedDates() {
        try {
            const response = await fetch('/tables/occupied_dates?limit=1000');
            if (response.ok) {
                const data = await response.json();
                const dates = data.data.map(record => record.date);
                console.log('📅 Dates loaded from server:', dates.length);
                return new Set(dates);
            }
        } catch (error) {
            console.error('❌ Error loading dates:', error);
        }
        return new Set();
    }

    saveOccupiedDates() {
        localStorage.setItem('casadiTesOccupiedDates', 
            JSON.stringify([...this.occupiedDates]));
        this.showNotification('✅ Availability saved!', 'success');
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        document.getElementById('calendarMonthYear').textContent = 
            `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        const daysContainer = document.getElementById('calendarDays');
        daysContainer.innerHTML = '';

        for (let i = 0; i < adjustedFirstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            daysContainer.appendChild(emptyDay);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const minBookableDate = new Date(today);
        minBookableDate.setDate(minBookableDate.getDate() + this.advanceNoticeDays);
        minBookableDate.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDayDate = new Date(year, month, day);
            currentDayDate.setHours(0, 0, 0, 0);
            const dateString = this.formatDate(currentDayDate);

            if (currentDayDate < minBookableDate) {
                dayElement.classList.add('occupied');
                dayElement.style.opacity = '0.4';
                dayElement.style.cursor = 'not-allowed';
                if (currentDayDate >= today && currentDayDate < minBookableDate) {
                    dayElement.title = `${this.advanceNoticeDays} days advance notice required`;
                }
            } else {
                if (this.occupiedDates.has(dateString)) {
                    dayElement.classList.add('occupied');
                } else {
                    dayElement.classList.add('available');
                }

                if (currentDayDate.getTime() === today.getTime()) {
                    dayElement.classList.add('today');
                }

                if (this.selectedStartDate && this.selectedEndDate) {
                    const start = new Date(this.selectedStartDate);
                    const end = new Date(this.selectedEndDate);
                    
                    if (currentDayDate.getTime() === start.getTime()) {
                        dayElement.classList.add('selected-start');
                    } else if (currentDayDate.getTime() === end.getTime()) {
                        dayElement.classList.add('selected-end');
                    } else if (currentDayDate > start && currentDayDate < end) {
                        dayElement.classList.add('in-range');
                    }
                }

                dayElement.addEventListener('click', () => {
                    this.handleDayClick(currentDayDate, dateString);
                });
            }

            daysContainer.appendChild(dayElement);
        }
    }

    handleDayClick(date, dateString) {
        if (this.adminMode) {
            if (this.occupiedDates.has(dateString)) {
                this.occupiedDates.delete(dateString);
            } else {
                this.occupiedDates.add(dateString);
            }
            this.renderCalendar();
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const minBookableDate = new Date(today);
            minBookableDate.setDate(minBookableDate.getDate() + this.advanceNoticeDays);
            minBookableDate.setHours(0, 0, 0, 0);
            
            if (date < minBookableDate) {
                const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
                if (daysUntil < this.advanceNoticeDays && daysUntil >= 0) {
                    this.showNotification(`⏰ ${this.advanceNoticeDays} days advance notice required. This date is too soon (${daysUntil} days)`, 'error');
                } else {
                    this.showNotification('❌ Date in the past', 'error');
                }
                return;
            }
            
            const isOccupied = this.occupiedDates.has(dateString);
            
            if (isOccupied) {
                this.showNotification('❌ This date is not available', 'error');
                return;
            }

            if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
                this.selectedStartDate = date;
                this.selectedEndDate = null;
            } else if (date < this.selectedStartDate) {
                this.selectedEndDate = this.selectedStartDate;
                this.selectedStartDate = date;
                
                const nights = Math.ceil((this.selectedEndDate - this.selectedStartDate) / (1000 * 60 * 60 * 24));
                if (nights < this.minimumNights) {
                    this.showNotification(`⚠️ Minimum stay required: ${this.minimumNights} nights. You selected ${nights} night(s).`, 'error');
                    this.selectedStartDate = null;
                    this.selectedEndDate = null;
                    this.renderCalendar();
                    this.updateBookingInfo();
                    return;
                }
            } else {
                this.selectedEndDate = date;
                
                const nights = Math.ceil((this.selectedEndDate - this.selectedStartDate) / (1000 * 60 * 60 * 24));
                if (nights < this.minimumNights) {
                    this.showNotification(`⚠️ Minimum stay required: ${this.minimumNights} nights. You selected ${nights} night(s).`, 'error');
                    this.selectedStartDate = null;
                    this.selectedEndDate = null;
                    this.renderCalendar();
                    this.updateBookingInfo();
                    return;
                }
                
                if (this.hasOccupiedInRange(this.selectedStartDate, this.selectedEndDate)) {
                    this.showNotification('❌ There are occupied dates in the selected period', 'error');
                    this.selectedStartDate = null;
                    this.selectedEndDate = null;
                }
            }
            
            this.renderCalendar();
            this.updateBookingInfo();
        }
    }

    hasOccupiedInRange(start, end) {
        const current = new Date(start);
        current.setDate(current.getDate() + 1);
        
        while (current < end) {
            const dateString = this.formatDate(current);
            if (this.occupiedDates.has(dateString)) {
                return true;
            }
            current.setDate(current.getDate() + 1);
        }
        return false;
    }

    updateBookingInfo() {
        const infoBox = document.getElementById('bookingInfoBox');
        
        if (this.selectedStartDate && this.selectedEndDate) {
            const nights = Math.ceil((this.selectedEndDate - this.selectedStartDate) / (1000 * 60 * 60 * 24));
            
            document.getElementById('checkInDate').textContent = 
                this.formatDateDisplay(this.selectedStartDate);
            document.getElementById('checkOutDate').textContent = 
                this.formatDateDisplay(this.selectedEndDate);
            document.getElementById('nightsCount').textContent = nights;
            
            infoBox.style.display = 'block';
        } else {
            infoBox.style.display = 'none';
        }
    }

    setupEventListeners() {
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        document.getElementById('resetDates').addEventListener('click', () => {
            this.selectedStartDate = null;
            this.selectedEndDate = null;
            this.renderCalendar();
            this.updateBookingInfo();
        });

        document.getElementById('bookNow').addEventListener('click', () => {
            if (this.selectedStartDate && this.selectedEndDate) {
                const bookingForm = document.getElementById('prenota');
                bookingForm.scrollIntoView({ behavior: 'smooth' });
                
                const checkinInput = document.getElementById('checkin');
                const checkoutInput = document.getElementById('checkout');
                
                if (checkinInput && checkoutInput) {
                    checkinInput.value = this.formatDate(this.selectedStartDate);
                    checkoutInput.value = this.formatDate(this.selectedEndDate);
                }
                
                this.showNotification('✅ Dates selected! Fill in the form below', 'success');
            }
        });

        const toggleAdmin = document.getElementById('toggleAdminMode');
        if (toggleAdmin) {
            toggleAdmin.addEventListener('click', () => {
                this.adminMode = !this.adminMode;
                const indicator = document.getElementById('adminModeIndicator');
                const adminPanel = document.querySelector('.admin-panel');
                
                if (this.adminMode) {
                    indicator.textContent = '🔧 ADMIN MODE ACTIVE';
                    indicator.style.background = '#FFE69C';
                    adminPanel.style.border = '3px solid #FF9800';
                    this.showNotification('🔧 Admin Mode: Click days to modify availability', 'info');
                } else {
                    indicator.textContent = '👤 Guest Mode';
                    indicator.style.background = '#E0E0E0';
                    adminPanel.style.border = '3px dashed var(--primary-color)';
                }
                
                this.selectedStartDate = null;
                this.selectedEndDate = null;
                this.renderCalendar();
                this.updateBookingInfo();
            });
        }

        const saveBtn = document.getElementById('saveAvailability');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                this.saveOccupiedDates();
            });
        }

        const clearBtn = document.getElementById('clearOccupied');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear ALL dates?')) {
                    this.occupiedDates.clear();
                    this.saveOccupiedDates();
                    this.renderCalendar();
                }
            });
        }

        const exportBtn = document.getElementById('exportCalendar');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportCalendar();
            });
        }
    }

    exportCalendar() {
        const data = {
            occupiedDates: [...this.occupiedDates],
            exportDate: new Date().toISOString(),
            property: 'La Casa di Tes - Donnas'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `calendar-casa-tes-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('📥 Calendar exported!', 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateDisplay(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendarDays')) {
        window.bookingCalendar = new BookingCalendar();
        console.log('📅 Booking calendar initialized');
    }
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
