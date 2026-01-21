// ===================================
// Calendar System - La Casa di Tes
// ===================================

// ⚙️ CONFIGURAZIONE SOGGIORNO MINIMO
// ====================================
// Modifica questo valore per cambiare il soggiorno minimo richiesto
// Esempi: 
//   MINIMUM_NIGHTS = 2  → soggiorno minimo 2 notti
//   MINIMUM_NIGHTS = 3  → soggiorno minimo 3 notti
//   MINIMUM_NIGHTS = 5  → soggiorno minimo 5 notti (settimana corta)
//   MINIMUM_NIGHTS = 7  → soggiorno minimo 7 notti (settimana intera)
const MINIMUM_NIGHTS = 5; // 🔧 MODIFICA QUESTO NUMERO PER CAMBIARE IL MINIMO

// ⚙️ CONFIGURAZIONE PREAVVISO MINIMO
// ====================================
// Modifica questo valore per cambiare i giorni di preavviso richiesti
// Esempi:
//   ADVANCE_NOTICE_DAYS = 0  → prenotazioni istantanee (anche per oggi)
//   ADVANCE_NOTICE_DAYS = 1  → prenotazioni da domani
//   ADVANCE_NOTICE_DAYS = 3  → preavviso di 3 giorni
//   ADVANCE_NOTICE_DAYS = 5  → preavviso di 5 giorni (ATTUALE)
//   ADVANCE_NOTICE_DAYS = 7  → preavviso di 1 settimana
const ADVANCE_NOTICE_DAYS = 5; // 🔧 MODIFICA QUESTO NUMERO PER CAMBIARE IL PREAVVISO

class BookingCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedStartDate = null;
        this.selectedEndDate = null;
        this.occupiedDates = new Set();
        this.adminMode = false;
        this.minimumNights = MINIMUM_NIGHTS; // Usa la costante configurabile
        this.advanceNoticeDays = ADVANCE_NOTICE_DAYS; // Usa la costante configurabile
        this.init();
    }

    async init() {
        this.occupiedDates = await this.loadOccupiedDates();
        this.renderCalendar();
        this.setupEventListeners();
        this.updateBookingInfo();
    }

    // Load occupied dates from API
    async loadOccupiedDates() {
        try {
            const response = await fetch('/tables/occupied_dates?limit=1000');
            if (response.ok) {
                const data = await response.json();
                const dates = data.data.map(record => record.date);
                console.log('📅 Date caricate dal server:', dates.length);
                return new Set(dates);
            }
        } catch (error) {
            console.error('❌ Errore caricamento date:', error);
        }
        // Fallback to empty set if API fails
        return new Set();
    }

    // Save occupied dates to localStorage
    saveOccupiedDates() {
        localStorage.setItem('casadiTesOccupiedDates', 
            JSON.stringify([...this.occupiedDates]));
        this.showNotification('✅ Disponibilità salvata!', 'success');
    }

    // Render calendar
    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year display
        const monthNames = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        document.getElementById('calendarMonthYear').textContent = 
            `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Adjust firstDay (Monday = 0, Sunday = 6)
        const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

        // Render days
        const daysContainer = document.getElementById('calendarDays');
        daysContainer.innerHTML = '';

        // Empty cells before first day
        for (let i = 0; i < adjustedFirstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            daysContainer.appendChild(emptyDay);
        }

        // Actual days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Calculate minimum bookable date (today + 5 days)
        const minBookableDate = new Date(today);
        minBookableDate.setDate(minBookableDate.getDate() + 5);
        minBookableDate.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDayDate = new Date(year, month, day);
            currentDayDate.setHours(0, 0, 0, 0);
            const dateString = this.formatDate(currentDayDate);

            // Check if past date or within 5-day notice period
            if (currentDayDate < minBookableDate) {
                dayElement.classList.add('occupied');
                dayElement.style.opacity = '0.4';
                dayElement.style.cursor = 'not-allowed';
                if (currentDayDate >= today && currentDayDate < minBookableDate) {
                    // Add a special indicator for "too soon" dates
                    dayElement.title = 'Richiesto preavviso di 5 giorni';
                }
            } else {
                // Check if occupied
                if (this.occupiedDates.has(dateString)) {
                    dayElement.classList.add('occupied');
                } else {
                    dayElement.classList.add('available');
                }

                // Check if today
                if (currentDayDate.getTime() === today.getTime()) {
                    dayElement.classList.add('today');
                }

                // Check if in selected range
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

                // Add click event
                dayElement.addEventListener('click', () => {
                    this.handleDayClick(currentDayDate, dateString);
                });
            }

            daysContainer.appendChild(dayElement);
        }
    }

    // Handle day click
    handleDayClick(date, dateString) {
        if (this.adminMode) {
            // Admin mode: toggle availability
            if (this.occupiedDates.has(dateString)) {
                this.occupiedDates.delete(dateString);
            } else {
                this.occupiedDates.add(dateString);
            }
            this.renderCalendar();
        } else {
            // Guest mode: select booking range
            
            // Check if date is within 5-day notice period
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const minBookableDate = new Date(today);
            minBookableDate.setDate(minBookableDate.getDate() + 5);
            minBookableDate.setHours(0, 0, 0, 0);
            
            if (date < minBookableDate) {
                const daysUntil = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
                if (daysUntil < 5 && daysUntil >= 0) {
                    this.showNotification(`⏰ Richiesto preavviso di 5 giorni. Questa data è troppo vicina (${daysUntil} giorni)`, 'error');
                } else {
                    this.showNotification('❌ Data nel passato', 'error');
                }
                return;
            }
            
            const isOccupied = this.occupiedDates.has(dateString);
            
            if (isOccupied) {
                this.showNotification('❌ Questa data non è disponibile', 'error');
                return;
            }

            if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
                // Start new selection
                this.selectedStartDate = date;
                this.selectedEndDate = null;
            } else if (date < this.selectedStartDate) {
                // Selected date is before start, swap
                this.selectedEndDate = this.selectedStartDate;
                this.selectedStartDate = date;
                
                // Validate minimum nights
                const nights = Math.ceil((this.selectedEndDate - this.selectedStartDate) / (1000 * 60 * 60 * 24));
                if (nights < this.minimumNights) {
                    this.showNotification(`⚠️ Soggiorno minimo richiesto: ${this.minimumNights} notti. Hai selezionato ${nights} notte/i.`, 'error');
                    this.selectedStartDate = null;
                    this.selectedEndDate = null;
                    this.renderCalendar();
                    this.updateBookingInfo();
                    return;
                }
            } else {
                // Set end date
                this.selectedEndDate = date;
                
                // Validate minimum nights
                const nights = Math.ceil((this.selectedEndDate - this.selectedStartDate) / (1000 * 60 * 60 * 24));
                if (nights < this.minimumNights) {
                    this.showNotification(`⚠️ Soggiorno minimo richiesto: ${this.minimumNights} notti. Hai selezionato ${nights} notte/i.`, 'error');
                    this.selectedStartDate = null;
                    this.selectedEndDate = null;
                    this.renderCalendar();
                    this.updateBookingInfo();
                    return;
                }
                
                // Check if any occupied dates in range
                if (this.hasOccupiedInRange(this.selectedStartDate, this.selectedEndDate)) {
                    this.showNotification('❌ Ci sono date occupate nel periodo selezionato', 'error');
                    this.selectedStartDate = null;
                    this.selectedEndDate = null;
                }
            }
            
            this.renderCalendar();
            this.updateBookingInfo();
        }
    }

    // Check if there are occupied dates in range
    hasOccupiedInRange(start, end) {
        const current = new Date(start);
        current.setDate(current.getDate() + 1); // Skip start date
        
        while (current < end) {
            const dateString = this.formatDate(current);
            if (this.occupiedDates.has(dateString)) {
                return true;
            }
            current.setDate(current.getDate() + 1);
        }
        return false;
    }

    // Update booking info box
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

    // Setup event listeners
    setupEventListeners() {
        // Previous month
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        // Next month
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Reset selection
        document.getElementById('resetDates').addEventListener('click', () => {
            this.selectedStartDate = null;
            this.selectedEndDate = null;
            this.renderCalendar();
            this.updateBookingInfo();
        });

        // Book now
        document.getElementById('bookNow').addEventListener('click', () => {
            if (this.selectedStartDate && this.selectedEndDate) {
                // Scroll to booking form
                const bookingForm = document.getElementById('prenota');
                bookingForm.scrollIntoView({ behavior: 'smooth' });
                
                // Pre-fill dates in form
                const checkinInput = document.getElementById('checkin');
                const checkoutInput = document.getElementById('checkout');
                
                if (checkinInput && checkoutInput) {
                    checkinInput.value = this.formatDate(this.selectedStartDate);
                    checkoutInput.value = this.formatDate(this.selectedEndDate);
                }
                
                this.showNotification('✅ Date selezionate! Compila il form sotto', 'success');
            }
        });

        // Admin mode toggle
        document.getElementById('toggleAdminMode').addEventListener('click', () => {
            this.adminMode = !this.adminMode;
            const indicator = document.getElementById('adminModeIndicator');
            const adminPanel = document.querySelector('.admin-panel');
            
            if (this.adminMode) {
                indicator.textContent = '🔧 MODALITÀ ADMIN ATTIVA';
                indicator.style.background = '#FFE69C';
                adminPanel.style.border = '3px solid #FF9800';
                this.showNotification('🔧 Modalità Admin: Clicca sui giorni per modificare disponibilità', 'info');
            } else {
                indicator.textContent = '👤 Modalità Ospite';
                indicator.style.background = '#E0E0E0';
                adminPanel.style.border = '3px dashed var(--primary-color)';
            }
            
            this.selectedStartDate = null;
            this.selectedEndDate = null;
            this.renderCalendar();
            this.updateBookingInfo();
        });

        // Save availability
        document.getElementById('saveAvailability').addEventListener('click', () => {
            this.saveOccupiedDates();
        });

        // Clear all occupied dates
        document.getElementById('clearOccupied').addEventListener('click', () => {
            if (confirm('Sei sicuro di voler liberare TUTTE le date?')) {
                this.occupiedDates.clear();
                this.saveOccupiedDates();
                this.renderCalendar();
            }
        });

        // Export calendar
        document.getElementById('exportCalendar').addEventListener('click', () => {
            this.exportCalendar();
        });
    }

    // Export calendar to JSON
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
        link.download = `calendario-casa-tes-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('📥 Calendario esportato!', 'success');
    }

    // Show notification
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

    // Format date to YYYY-MM-DD
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date for display
    formatDateDisplay(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// Initialize calendar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if calendar section exists
    if (document.getElementById('calendarDays')) {
        window.bookingCalendar = new BookingCalendar();
        console.log('📅 Calendario prenotazioni inizializzato');
    }
});

// Add animations
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
