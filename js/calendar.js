// Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    const calendarDays = document.getElementById('calendarDays');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const toggleAdminBtn = document.getElementById('toggleAdminMode');
    const saveAvailabilityBtn = document.getElementById('saveAvailability');
    const clearOccupiedBtn = document.getElementById('clearOccupied');
    const exportCalendarBtn = document.getElementById('exportCalendar');
    const adminModeIndicator = document.getElementById('adminModeIndicator');
    const bookingInfoBox = document.getElementById('bookingInfoBox');
    const bookNowBtn = document.getElementById('bookNow');
    const resetDatesBtn = document.getElementById('resetDates');
    
    let currentDate = new Date();
    let selectedStartDate = null;
    let selectedEndDate = null;
    let isAdminMode = false;
    let occupiedDates = loadOccupiedDates();
    
    // Initialize calendar
    if (calendarDays) {
        renderCalendar();
        
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
            });
        }
        
        if (toggleAdminBtn) {
            toggleAdminBtn.addEventListener('click', toggleAdminMode);
        }
        
        if (saveAvailabilityBtn) {
            saveAvailabilityBtn.addEventListener('click', saveOccupiedDates);
        }
        
        if (clearOccupiedBtn) {
            clearOccupiedBtn.addEventListener('click', clearAllOccupied);
        }
        
        if (exportCalendarBtn) {
            exportCalendarBtn.addEventListener('click', exportCalendar);
        }
        
        if (bookNowBtn) {
            bookNowBtn.addEventListener('click', () => {
                document.getElementById('prenota').scrollIntoView({ behavior: 'smooth' });
            });
        }
        
        if (resetDatesBtn) {
            resetDatesBtn.addEventListener('click', resetSelection);
        }
    }
    
    function renderCalendar() {
        if (!calendarDays) return;
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Update month/year display
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                           'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        if (calendarMonthYear) {
            calendarMonthYear.textContent = `${monthNames[month]} ${year}`;
        }
        
        // Clear calendar
        calendarDays.innerHTML = '';
        
        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Adjust for Monday start (0 = Monday, 6 = Sunday)
        const adjustedStartDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
        
        // Add empty cells for days before month starts
        for (let i = 0; i < adjustedStartDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }
        
        // Add days
        const today = new Date();
        const minBookingDate = new Date(today);
        minBookingDate.setDate(today.getDate() + 5);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            const currentDay = new Date(year, month, day);
            const dateString = formatDate(currentDay);
            
            // Check if date is in the past or too soon
            if (currentDay < minBookingDate) {
                dayElement.classList.add('unavailable');
                dayElement.title = 'Preavviso insufficiente (minimo 5 giorni)';
            } else if (occupiedDates.includes(dateString)) {
                dayElement.classList.add('occupied');
                dayElement.title = 'Non disponibile';
            } else {
                dayElement.classList.add('available');
                dayElement.title = 'Disponibile';
            }
            
            // Add click handler
            dayElement.addEventListener('click', () => handleDayClick(currentDay, dayElement));
            
            calendarDays.appendChild(dayElement);
        }
    }
    
    function handleDayClick(date, element) {
        if (element.classList.contains('unavailable')) return;
        
        if (isAdminMode) {
            // Admin mode: toggle occupied status
            const dateString = formatDate(date);
            if (occupiedDates.includes(dateString)) {
                occupiedDates = occupiedDates.filter(d => d !== dateString);
                element.classList.remove('occupied');
                element.classList.add('available');
            } else {
                occupiedDates.push(dateString);
                element.classList.remove('available');
                element.classList.add('occupied');
            }
        } else {
            // Guest mode: select date range
            if (element.classList.contains('occupied')) return;
            
            if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
                // Start new selection
                selectedStartDate = date;
                selectedEndDate = null;
                updateSelection();
            } else if (date > selectedStartDate) {
                // Complete selection
                selectedEndDate = date;
                updateSelection();
            } else {
                // Reset if clicked before start date
                selectedStartDate = date;
                selectedEndDate = null;
                updateSelection();
            }
        }
    }
    
    function updateSelection() {
        renderCalendar();
        
        if (selectedStartDate && selectedEndDate) {
            const nights = Math.ceil((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24));
            document.getElementById('checkInDate').textContent = formatDateDisplay(selectedStartDate);
            document.getElementById('checkOutDate').textContent = formatDateDisplay(selectedEndDate);
            document.getElementById('nightsCount').textContent = nights;
            if (bookingInfoBox) {
                bookingInfoBox.style.display = 'block';
            }
        } else {
            if (bookingInfoBox) {
                bookingInfoBox.style.display = 'none';
            }
        }
    }
    
    function resetSelection() {
        selectedStartDate = null;
        selectedEndDate = null;
        updateSelection();
    }
    
    function toggleAdminMode() {
        isAdminMode = !isAdminMode;
        if (adminModeIndicator) {
            adminModeIndicator.textContent = isAdminMode ? '🔧 Modalità Admin' : '👤 Modalità Ospite';
        }
        if (toggleAdminBtn) {
            toggleAdminBtn.textContent = isAdminMode ? '✓ Modalità Admin Attiva' : 'Attiva Modalità Admin';
        }
        resetSelection();
    }
    
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
    
    function formatDateDisplay(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    
    function loadOccupiedDates() {
        const saved = localStorage.getItem('occupiedDates');
        return saved ? JSON.parse(saved) : [];
    }
    
    function saveOccupiedDates() {
        localStorage.setItem('occupiedDates', JSON.stringify(occupiedDates));
        alert('Date salvate con successo!');
    }
    
    function clearAllOccupied() {
        if (confirm('Sei sicuro di voler liberare tutte le date?')) {
            occupiedDates = [];
            localStorage.removeItem('occupiedDates');
            renderCalendar();
            alert('Tutte le date sono state liberate!');
        }
    }
    
    function exportCalendar() {
        const data = {
            occupiedDates: occupiedDates,
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'calendar-lacasadites.json';
        a.click();
    }
});
