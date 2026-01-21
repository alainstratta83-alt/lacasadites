// 🔐 Admin Panel - La Casa di Tes
// Password di default: admin123 (CAMBIALA!)

const ADMIN_CONFIG = {
    // 🔒 CAMBIA QUESTA PASSWORD!
    password: 'alain-67401983',
    
    // API endpoint per le date (usa Table API di Netlify)
    apiEndpoint: '/tables/occupied_dates',
    sessionKey: 'lacasadites_admin_session'
};

class AdminCalendar {
    constructor() {
        this.currentDate = new Date();
        this.occupiedDates = [];
        this.init();
    }

    async init() {
        // Check if already logged in
        if (sessionStorage.getItem(ADMIN_CONFIG.sessionKey) === 'true') {
            await this.showAdminPanel();
        }

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Save button
        document.getElementById('saveBtn').addEventListener('click', async () => {
            await this.saveOccupiedDates();
        });

        // Clear all button
        document.getElementById('clearAllBtn').addEventListener('click', async () => {
            if (confirm('⚠️ Sei sicuro di voler cancellare TUTTE le date occupate?')) {
                await this.clearAllDates();
            }
        });
    }

    handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        if (password === ADMIN_CONFIG.password) {
            sessionStorage.setItem(ADMIN_CONFIG.sessionKey, 'true');
            this.showAdminPanel();
        } else {
            errorDiv.textContent = '❌ Password errata!';
            document.getElementById('password').value = '';
        }
    }

    handleLogout() {
        sessionStorage.removeItem(ADMIN_CONFIG.sessionKey);
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('password').value = '';
        document.getElementById('loginError').textContent = '';
    }

    async showAdminPanel() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        await this.loadOccupiedDates();
        this.renderCalendar();
        this.updateOccupiedList();
    }

    async loadOccupiedDates() {
        try {
            const response = await fetch(`${ADMIN_CONFIG.apiEndpoint}?limit=1000`);
            if (response.ok) {
                const data = await response.json();
                this.occupiedDates = data.data.map(record => record.date);
                console.log('📅 Date caricate:', this.occupiedDates.length);
            } else {
                console.error('❌ Errore caricamento date');
                this.occupiedDates = [];
            }
        } catch (error) {
            console.error('❌ Errore:', error);
            this.occupiedDates = [];
        }
    }

    async saveOccupiedDates() {
        try {
            this.showMessage('⏳ Salvataggio in corso...', 'info');
            
            // 1. Carica tutte le date esistenti
            const response = await fetch(`${ADMIN_CONFIG.apiEndpoint}?limit=1000`);
            const existingData = await response.json();
            
            // 2. Cancella tutte le date esistenti
            for (const record of existingData.data) {
                await fetch(`${ADMIN_CONFIG.apiEndpoint}/${record.id}`, {
                    method: 'DELETE'
                });
            }
            
            // 3. Aggiungi le nuove date
            for (const date of this.occupiedDates) {
                await fetch(ADMIN_CONFIG.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        date: date,
                        created_at: new Date().getTime()
                    })
                });
            }
            
            this.showMessage('✅ Date salvate con successo!', 'success');
            this.updateStats();
            this.updateOccupiedList();
            console.log('💾 Date salvate:', this.occupiedDates);
        } catch (error) {
            console.error('❌ Errore salvataggio:', error);
            this.showMessage('❌ Errore nel salvataggio!', 'error');
        }
    }

    async clearAllDates() {
        try {
            this.showMessage('⏳ Cancellazione in corso...', 'info');
            
            const response = await fetch(`${ADMIN_CONFIG.apiEndpoint}?limit=1000`);
            const data = await response.json();
            
            for (const record of data.data) {
                await fetch(`${ADMIN_CONFIG.apiEndpoint}/${record.id}`, {
                    method: 'DELETE'
                });
            }
            
            this.occupiedDates = [];
            this.renderCalendar();
            this.updateOccupiedList();
            this.showMessage('✅ Tutte le date cancellate!', 'success');
        } catch (error) {
            console.error('❌ Errore:', error);
            this.showMessage('❌ Errore nella cancellazione!', 'error');
        }
    }

    showMessage(text, type) {
        const messageDiv = document.getElementById('saveMessage');
        messageDiv.textContent = text;
        messageDiv.className = `save-message ${type}`;
        
        if (type !== 'info') {
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'save-message';
            }, 3000);
        }
    }

    updateStats() {
        document.getElementById('occupiedCount').textContent = this.occupiedDates.length;
    }

    updateOccupiedList() {
        const listDiv = document.getElementById('occupiedList');
        
        if (this.occupiedDates.length === 0) {
            listDiv.innerHTML = '<p class="empty-message">Nessuna data occupata</p>';
            return;
        }

        // Sort dates
        const sortedDates = [...this.occupiedDates].sort();
        
        listDiv.innerHTML = sortedDates.map(dateStr => {
            const date = new Date(dateStr);
            const formatted = this.formatDate(date);
            return `<span class="date-badge">📅 ${formatted}</span>`;
        }).join('');
    }

    formatDate(date) {
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update month title
        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                           'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
        document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const calendarDiv = document.getElementById('calendar');
        calendarDiv.innerHTML = '';

        // Day names
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
        dayNames.forEach(name => {
            const dayNameDiv = document.createElement('div');
            dayNameDiv.className = 'calendar-day day-name';
            dayNameDiv.textContent = name;
            calendarDiv.appendChild(dayNameDiv);
        });

        // Empty cells before first day
        for (let i = 0; i < startingDayOfWeek; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'calendar-day other-month';
            calendarDiv.appendChild(emptyDiv);
        }

        // Days
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;

            // Check if date is in the past
            if (date < today) {
                dayDiv.classList.add('past');
            } else if (this.occupiedDates.includes(dateStr)) {
                dayDiv.classList.add('occupied');
                dayDiv.addEventListener('click', () => this.toggleDate(dateStr));
            } else {
                dayDiv.classList.add('available');
                dayDiv.addEventListener('click', () => this.toggleDate(dateStr));
            }

            calendarDiv.appendChild(dayDiv);
        }

        this.updateStats();
    }

    toggleDate(dateStr) {
        const index = this.occupiedDates.indexOf(dateStr);
        
        if (index > -1) {
            // Remove date
            this.occupiedDates.splice(index, 1);
            console.log('🟢 Data liberata:', dateStr);
        } else {
            // Add date
            this.occupiedDates.push(dateStr);
            console.log('🔴 Data occupata:', dateStr);
        }

        this.renderCalendar();
        this.updateOccupiedList();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminCalendar = new AdminCalendar();
    console.log('🔐 Admin Panel inizializzato (API-based)');
    console.log('⚠️ Password di default: admin123 - CAMBIALA nel file admin.js!');
});
