// Cookie Banner - La Casa di Tes
// Banner semplice informativo (solo cookie tecnici)

class CookieBanner {
    constructor() {
        this.cookieName = 'lacasadites_cookie_consent';
        this.init();
    }

    init() {
        // Check if user has already accepted
        if (!this.hasConsent()) {
            this.showBanner();
        }
    }

    hasConsent() {
        return localStorage.getItem(this.cookieName) === 'accepted';
    }

    showBanner() {
        const banner = this.createBanner();
        document.body.appendChild(banner);
        
        // Fade in
        setTimeout(() => {
            banner.classList.add('show');
        }, 100);
    }

    createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.className = 'cookie-banner';
        
        // Get current language
        const lang = document.documentElement.lang || 'it';
        const texts = this.getTexts(lang);
        
        banner.innerHTML = `
            <div class="cookie-banner-content">
                <div class="cookie-banner-text">
                    <span class="cookie-icon">🍪</span>
                    <p>${texts.message} <a href="${texts.policyLink}" target="_blank">${texts.linkText}</a></p>
                </div>
                <button id="cookie-accept-btn" class="cookie-accept-btn">${texts.buttonText}</button>
            </div>
        `;
        
        // Add event listener
        banner.querySelector('#cookie-accept-btn').addEventListener('click', () => {
            this.acceptCookies();
        });
        
        return banner;
    }

    getTexts(lang) {
        const translations = {
            it: {
                message: 'Questo sito utilizza solo cookie tecnici necessari per il funzionamento. Continuando la navigazione, accetti il loro utilizzo.',
                linkText: 'Cookie Policy',
                policyLink: '/cookie-policy.html',
                buttonText: 'Ho capito'
            },
            en: {
                message: 'This site uses only technical cookies necessary for operation. By continuing to browse, you accept their use.',
                linkText: 'Cookie Policy',
                policyLink: '/cookie-policy-en.html',
                buttonText: 'I understand'
            },
            fr: {
                message: 'Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement. En continuant à naviguer, vous acceptez leur utilisation.',
                linkText: 'Politique de Cookies',
                policyLink: '/cookie-policy-fr.html',
                buttonText: 'J\'ai compris'
            }
        };
        
        return translations[lang] || translations.it;
    }

    acceptCookies() {
        localStorage.setItem(this.cookieName, 'accepted');
        this.hideBanner();
    }

    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 300);
        }
    }
}

// CSS Styles for Cookie Banner
const style = document.createElement('style');
style.textContent = `
    .cookie-banner {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(10px);
        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
        padding: 20px;
        z-index: 10000;
        transform: translateY(100%);
        transition: transform 0.3s ease-out;
        border-top: 3px solid #667eea;
    }
    
    .cookie-banner.show {
        transform: translateY(0);
    }
    
    .cookie-banner-content {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
    }
    
    .cookie-banner-text {
        display: flex;
        align-items: center;
        gap: 15px;
        flex: 1;
        min-width: 300px;
    }
    
    .cookie-icon {
        font-size: 2rem;
        flex-shrink: 0;
    }
    
    .cookie-banner-text p {
        margin: 0;
        color: #333;
        font-size: 0.95rem;
        line-height: 1.5;
    }
    
    .cookie-banner-text a {
        color: #667eea;
        text-decoration: underline;
        font-weight: 600;
    }
    
    .cookie-banner-text a:hover {
        color: #5568d3;
    }
    
    .cookie-accept-btn {
        padding: 12px 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        white-space: nowrap;
    }
    
    .cookie-accept-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    
    @media (max-width: 768px) {
        .cookie-banner {
            padding: 15px;
        }
        
        .cookie-banner-content {
            flex-direction: column;
            align-items: stretch;
        }
        
        .cookie-banner-text {
            min-width: 100%;
        }
        
        .cookie-accept-btn {
            width: 100%;
        }
    }
`;
document.head.appendChild(style);

// Initialize cookie banner when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CookieBanner();
    });
} else {
    new CookieBanner();
}
