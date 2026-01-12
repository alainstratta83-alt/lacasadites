// ===================================
// Navigation Toggle
// ===================================
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    
    const spans = navToggle.querySelectorAll('span');
    if (navMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// ===================================
// LIGHTBOX - ZOOM FOTO
// ===================================
function createLightbox() {
    const lightboxHTML = `
        <div id="lightbox" class="lightbox">
            <span class="lightbox-close">&times;</span>
            <span class="lightbox-prev">&#10094;</span>
            <span class="lightbox-next">&#10095;</span>
            <img class="lightbox-content" id="lightbox-img">
            <div class="lightbox-caption"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
}

createLightbox();

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxCaption = document.querySelector('.lightbox-caption');
const lightboxClose = document.querySelector('.lightbox-close');
const lightboxPrev = document.querySelector('.lightbox-prev');
const lightboxNext = document.querySelector('.lightbox-next');

let currentImageIndex = 0;
let galleryImages = [];

// Get all zoomable images
function initLightbox() {
    const zoomableImages = document.querySelectorAll('.gallery-item img, .donnas-image-grid img, .attraction-images img, .castello-image img');
    
    galleryImages = Array.from(zoomableImages);
    
    zoomableImages.forEach((img, index) => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            openLightbox(index);
        });
    });
}

function openLightbox(index) {
    currentImageIndex = index;
    const img = galleryImages[currentImageIndex];
    
    lightbox.style.display = 'flex';
    lightboxImg.src = img.src;
    
    const caption = img.alt || img.closest('.gallery-item')?.querySelector('.gallery-caption')?.textContent || '';
    lightboxCaption.textContent = caption;
    
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        lightbox.classList.add('active');
    }, 10);
}

function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        lightbox.style.display = 'none';
    }, 300);
}

function showNextImage() {
    currentImageIndex = (currentImageIndex + 1) % galleryImages.length;
    const img = galleryImages[currentImageIndex];
    lightboxImg.src = img.src;
    
    const caption = img.alt || img.closest('.gallery-item')?.querySelector('.gallery-caption')?.textContent || '';
    lightboxCaption.textContent = caption;
}

function showPrevImage() {
    currentImageIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    const img = galleryImages[currentImageIndex];
    lightboxImg.src = img.src;
    
    const caption = img.alt || img.closest('.gallery-item')?.querySelector('.gallery-caption')?.textContent || '';
    lightboxCaption.textContent = caption;
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxNext.addEventListener('click', showNextImage);
lightboxPrev.addEventListener('click', showPrevImage);

lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        closeLightbox();
    }
});

document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'flex') {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNextImage();
        if (e.key === 'ArrowLeft') showPrevImage();
    }
});

// ===================================
// Navbar Scroll Effect
// ===================================
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    }
    
    lastScroll = currentScroll;
});

// ===================================
// Smooth Scroll
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 120;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// Scroll Animations
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

const animateElements = document.querySelectorAll('.feature-card, .activity-card, .castello-card, .pricing-card, .donnas-subsection');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===================================
// Scroll to Top Button
// ===================================
const scrollTopBtn = document.querySelector('.scroll-top');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        scrollTopBtn.classList.add('visible');
    } else {
        scrollTopBtn.classList.remove('visible');
    }
});

scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ===================================
// Form Handling
// ===================================
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            nome: document.getElementById('nome').value,
            cognome: document.getElementById('cognome').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            checkin: document.getElementById('checkin').value,
            checkout: document.getElementById('checkout').value,
            ospiti: document.getElementById('ospiti').value,
            messaggio: document.getElementById('messaggio').value
        };
        
        const checkinDate = new Date(formData.checkin);
        const checkoutDate = new Date(formData.checkout);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const minAdvanceDays = 5;
        const minAdvanceDate = new Date(today);
        minAdvanceDate.setDate(today.getDate() + minAdvanceDays);
        
        if (checkinDate < minAdvanceDate) {
            showMessage(`La prenotazione deve essere effettuata con almeno ${minAdvanceDays} giorni di anticipo.`, 'error');
            return;
        }
        
        if (checkoutDate <= checkinDate) {
            showMessage('La data di check-out deve essere successiva alla data di check-in.', 'error');
            return;
        }
        
        const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
        const minNights = 5;
        
        if (nights < minNights) {
            showMessage(`Il soggiorno minimo è di ${minNights} notti. Hai selezionato ${nights} ${nights === 1 ? 'notte' : 'notti'}.`, 'error');
            return;
        }
        
        showMessage(
            `Grazie ${formData.nome}! La tua richiesta di prenotazione per ${nights} ${nights === 1 ? 'notte' : 'notti'} 
            (dal ${formatDate(formData.checkin)} al ${formatDate(formData.checkout)}) per ${formData.ospiti} 
            ${formData.ospiti === '1' ? 'ospite' : 'ospiti'} è stata inviata con successo. 
            Ti contatteremo presto all'indirizzo ${formData.email}.`,
            'success'
        );
        
        contactForm.reset();
        
        console.log('Prenotazione ricevuta:', formData);
        console.log(`Numero di notti: ${nights}`);
    });
}

function showMessage(message, type) {
    if (!formMessage) return;
    
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    if (type === 'success') {
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 8000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}

const checkinInput = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');

if (checkinInput && checkoutInput) {
    const today = new Date();
    const minAdvanceDate = new Date(today);
    minAdvanceDate.setDate(today.getDate() + 5);
    const minDateString = minAdvanceDate.toISOString().split('T')[0];
    
    checkinInput.setAttribute('min', minDateString);
    
    checkinInput.addEventListener('change', (e) => {
        const checkinDate = new Date(e.target.value);
        checkinDate.setDate(checkinDate.getDate() + 5);
        const minCheckout = checkinDate.toISOString().split('T')[0];
        checkoutInput.setAttribute('min', minCheckout);
    });
}

// ===================================
// Initialize Lightbox on Page Load
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏔️ La Casa di Tes - Website Loaded Successfully');
    console.log('📍 Donnas, Valle d\'Aosta');
    console.log('🔍 Lightbox attivo - Clicca sulle foto per zoomare!');
    
    initLightbox();
    
    setTimeout(() => {
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            heroContent.style.opacity = '1';
        }
    }, 100);
});

// ===================================
// Add active state to navigation
// ===================================
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');

function highlightNavigation() {
    const scrollPosition = window.pageYOffset + 150;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.style.color = '';
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.style.color = 'var(--primary-color)';
                }
            });
        }
    });
}

window.addEventListener('scroll', highlightNavigation);

// ===================================
// Handle window resize
// ===================================
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    }, 250);
});
