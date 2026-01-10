// Calendar functionality for La Casa di Tes booking system
// Minimum 5 days advance notice required

(function() {
    'use strict';

    // Calendar state
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth();
    let selectedCheckIn = null;
    let selectedCheckOut = null;
    let isAdminMode = false;
    let occupiedDates = [];

    // Load occupied dates from localStorage
    function loadOccupiedDates() {
        const saved = localStorage.getItem('lacasadites_occupied_dates');
        if (saved) {
            try {
                occupiedDates = JSON.parse(saved);
            } catch (e) {
                occupiedDates = [];
            }
        }
    }

    // Save occupied dates to localStorage
    function saveOccupiedDates() {
        localStorage.setItem('lacasadites_occupied_dates', JSON.stringify(occupiedDates));
    }

    // Check if date is occupied
    function isDateOccupied(dateStr) {
        return occupiedDates.includes(dateStr);
    }

    // Toggle date occupation (admin only)
    function toggleDateOccupation(dateStr) {
        if (!isAdminMode) return;
        
        const index = occupiedDates.indexOf(dateStr);
        if (index > -1) {
            occupiedDates.splice(index, 1);
        } else {
            occupiedDates.push(dateStr);
        }
        saveOccupiedDates();
    }

    // Check if date is too soon (less than 5 days notice)
    function isTooSoon(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const minDate = new Date(today);
        minDate.setDate(minDate.getDate() + 5);
        
        return date < minDate;
    }

    // Format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date for display (DD/MM/YYYY)
    function formatDisplayDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Get month name
    function getMonthName(month) {
        const monthNames = [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
        ];
        return monthNames[month];
    }

    // Calculate nights between two dates
    function calculateNights(checkIn, checkOut) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.round((checkOut - checkIn) / oneDay);
    }

    // Render calendar
    function renderCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const calendarMonthYear = document.getElementById('calendarMonthYear');
        
        if (!calendarDays || !calendarMonthYear) return;

        // Update month/year display
        calendarMonthYear.textContent = `${getMonthName(currentMonth)} ${currentYear}`;

        // Clear calendar
        calendarDays.innerHTML = '';

        // Get first day of month (0 = Sunday, 1 = Monday, etc.)
        const firstDay = new Date(currentYear, currentMonth, 1);
        let startingDayOfWeek = firstDay.getDay();
        // Adjust so Monday is 0
        startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

        // Get number of days in month
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarDays.appendChild(emptyDay);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateStr = formatDate(date);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            dayElement.dataset.date = dateStr;

            // Check if date is in the past
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) {
                dayElement.classList.add('past');
            }
            // Check if date is too soon (less than 5 days)
            else if (isTooSoon(date) && !isAdminMode) {
                dayElement.classList.add('unavailable');
                dayElement.title = 'Preavviso minimo 5 giorni';
            }
            // Check if date is occupied
            else if (isDateOccupied(dateStr)) {
                dayElement.classList.add('occupied');
                if (!isAdminMode) {
                    dayElement.title = 'Data occupata';
                }
            }
            // Available date
            else {
                dayElement.classList.add('available');
            }

            // Check if date is selected
            if (selectedCheckIn && dateStr === formatDate(selectedCheckIn)) {
                dayElement.classList.add('selected-checkin');
            }
            if (selectedCheckOut && dateStr === formatDate(selectedCheckOut)) {
                dayElement.classList.add('selected-checkout');
            }

            // Highlight dates between check-in and check-out
            if (selectedCheckIn && selectedCheckOut) {
                if (date > selectedCheckIn && date < selectedCheckOut) {
                    dayElement.classList.add('in-range');
                }
            }

            // Add click handler
            dayElement.addEventListener('click', function() {
                handleDayClick(date, dateStr);
            });

            calendarDays.appendChild(dayElement);
        }
    }

    // Handle day click
    function handleDayClick(date, dateStr) {
        // Admin mode - toggle occupation
        if (isAdminMode) {
            toggleDateOccupation(dateStr);
            renderCalendar();
            return;
        }

        // Check if date is available for booking
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today || isTooSoon(date) || isDateOccupied(dateStr)) {
            return; // Date not available
        }

        // Guest mode - select check-in/check-out
        if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
            // Start new selection
            selectedCheckIn = date;
            selectedCheckOut = null;
        } else if (selectedCheckIn && !selectedCheckOut) {
            // Select check-out
            if (date > selectedCheckIn) {
                // Check if any dates in range are occupied
                let hasOccupied = false;
                const tempDate = new Date(selectedCheckIn);
                tempDate.setDate(tempDate.getDate() + 1);
                
                while (tempDate < date) {
                    if (isDateOccupied(formatDate(tempDate))) {
                        hasOccupied = true;
                        break;
                    }
                    tempDate.setDate(tempDate.getDate() + 1);
                }

                if (hasOccupied) {
                    alert('Una o più date nel periodo selezionato sono già occupate. Seleziona un altro periodo.');
                    selectedCheckIn = null;
                    selectedCheckOut = null;
                } else {
                    selectedCheckOut = date;
                    updateBookingInfo();
                }
            } else {
                // Date is before check-in, restart selection
                selectedCheckIn = date;
                selectedCheckOut = null;
            }
        }

        renderCalendar();
    }

    // Update booking info display
    function updateBookingInfo() {
        const bookingInfoBox = document.getElementById('bookingInfoBox');
        const checkInDate = document.getElementById('checkInDate');
        const checkOutDate = document.getElementById('checkOutDate');
        const nightsCount = document.getElementById('nightsCount');

        if (!bookingInfoBox) return;

        if (selectedCheckIn && selectedCheckOut) {
            bookingInfoBox.style.display = 'block';
            checkInDate.textContent = formatDisplayDate(selectedCheckIn);
            checkOutDate.textContent = formatDisplayDate(selectedCheckOut);
            nightsCount.textContent = calculateNights(selectedCheckIn, selectedCheckOut);

            // Update form dates if form exists
            const checkinInput = document.getElementById('checkin');
            const checkoutInput = document.getElementById('checkout');
            if (checkinInput) checkinInput.value = formatDate(selectedCheckIn);
            if (checkoutInput) checkoutInput.value = formatDate(selectedCheckOut);
        } else {
            bookingInfoBox.style.display = 'none';
        }
    }

    // Previous month
    function prevMonth() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    }

    // Next month
    function nextMonth() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    }

    // Toggle admin mode
    function toggleAdminMode() {
        isAdminMode = !isAdminMode;
        const adminModeIndicator = document.getElementById('adminModeIndicator');
        const toggleBtn = document.getElementById('toggleAdminMode');
        
        if (adminModeIndicator) {
            if (isAdminMode) {
                adminModeIndicator.textContent = '🔧 Modalità Admin';
                adminModeIndicator.style.color = '#e74c3c';
            } else {
                adminModeIndicator.textContent = '👤 Modalità Ospite';
                adminModeIndicator.style.color = '#27ae60';
            }
        }

        if (toggleBtn) {
            toggleBtn.innerHTML = isAdminMode 
                ? '<i class="fas fa-toggle-off"></i> Disattiva Modalità Admin'
                : '<i class="fas fa-toggle-on"></i> Attiva Modalità Admin';
        }

        // Clear selection when switching modes
        selectedCheckIn = null;
        selectedCheckOut = null;
        renderCalendar();
    }

    // Save availability (admin)
    function saveAvailability() {
        if (!isAdminMode) return;
        saveOccupiedDates();
        alert('Disponibilità salvata con successo!');
    }

    // Export calendar data
    function exportCalendar() {
        const dataStr = JSON.stringify(occupiedDates, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lacasadites-calendar-${formatDate(new Date())}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    // Clear all occupied dates
    function clearOccupied() {
        if (!isAdminMode) return;
        if (confirm('Sei sicuro di voler liberare tutte le date? Questa azione non può essere annullata.')) {
            occupiedDates = [];
            saveOccupiedDates();
            renderCalendar();
            alert('Tutte le date sono state liberate.');
        }
    }

    // Reset date selection
    function resetDates() {
        selectedCheckIn = null;
        selectedCheckOut = null;
        renderCalendar();
        updateBookingInfo();
    }

    // Book now - scroll to booking form
    function bookNow() {
        const bookingSection = document.getElementById('prenota');
        if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Check if admin access is enabled
    function checkAdminAccess() {
        const urlParams = new URLSearchParams(window.location.search);
        const adminPanel = document.querySelector('.admin-panel');
        
        // Hide admin panel by default
        if (adminPanel) {
            // Only show if URL has ?admin=true parameter
            if (urlParams.get('admin') === 'true') {
                adminPanel.style.display = 'block';
            } else {
                adminPanel.style.display = 'none';
            }
        }
    }

    // Initialize calendar
    function initCalendar() {
        loadOccupiedDates();
        renderCalendar();
        checkAdminAccess(); // Check if admin panel should be visible

        // Event listeners
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        const toggleAdminBtn = document.getElementById('toggleAdminMode');
        const saveAvailabilityBtn = document.getElementById('saveAvailability');
        const exportCalendarBtn = document.getElementById('exportCalendar');
        const clearOccupiedBtn = document.getElementById('clearOccupied');
        const resetDatesBtn = document.getElementById('resetDates');
        const bookNowBtn = document.getElementById('bookNow');

        if (prevMonthBtn) prevMonthBtn.addEventListener('click', prevMonth);
        if (nextMonthBtn) nextMonthBtn.addEventListener('click', nextMonth);
        if (toggleAdminBtn) toggleAdminBtn.addEventListener('click', toggleAdminMode);
        if (saveAvailabilityBtn) saveAvailabilityBtn.addEventListener('click', saveAvailability);
        if (exportCalendarBtn) exportCalendarBtn.addEventListener('click', exportCalendar);
        if (clearOccupiedBtn) clearOccupiedBtn.addEventListener('click', clearOccupied);
        if (resetDatesBtn) resetDatesBtn.addEventListener('click', resetDates);
        if (bookNowBtn) bookNowBtn.addEventListener('click', bookNow);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCalendar);
    } else {
        initCalendar();
    }

})();
