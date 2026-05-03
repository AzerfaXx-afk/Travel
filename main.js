import './style.css';

// 1. Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

document.addEventListener('DOMContentLoaded', () => {
    // 2. Loading Screen
    const loader = document.getElementById('app-loader');
    setTimeout(() => { loader.classList.add('hidden'); }, 1500);

    // 3. Theme Toggle (Dark / Light)
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // 4. View Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Ignore FAB click for view switching
            if (item.classList.contains('fab-wrapper')) return;
            
            // Update Active State
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Switch View
            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.add('active');
                }
            });
        });
    });

    // 5. New Trip Modal Logic
    const modalNewTrip = document.getElementById('modal-new-trip');
    const btnOpenNewTrip = document.getElementById('btn-open-new-trip');
    const btnCloseModal = document.querySelector('.close-modal');
    const btnCreateTrip = document.getElementById('btn-create-trip');
    const destInput = document.getElementById('destination-input');
    const suggestionsGrid = document.getElementById('destination-suggestions');

    // Fake suggestions based on input
    const places = [
        { name: "Rome, Italie", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&q=80" },
        { name: "Bali, Indonésie", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80" },
        { name: "Tulum, Mexique", img: "https://images.unsplash.com/photo-1518638150340-f706d86654de?auto=format&fit=crop&w=400&q=80" },
        { name: "Tokyo, Japon", img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80" }
    ];

    const renderSuggestions = () => {
        suggestionsGrid.innerHTML = places.map(p => `
            <div class="suggest-card" style="background-image: url('${p.img}')">
                <span>${p.name}</span>
            </div>
        `).join('');
    };

    btnOpenNewTrip.addEventListener('click', (e) => {
        e.preventDefault();
        modalNewTrip.classList.add('show');
        renderSuggestions();
    });

    btnCloseModal.addEventListener('click', () => {
        modalNewTrip.classList.remove('show');
    });

    btnCreateTrip.addEventListener('click', () => {
        alert("Trip group created! Time to plan your Odyssée.");
        modalNewTrip.classList.remove('show');
    });

    destInput.addEventListener('input', () => {
        renderSuggestions(); // In a real app, filter based on input
    });

    // 6. Pull to Refresh (Snapchat Style)
    const appContent = document.getElementById('app-content');
    const ptrIcon = document.querySelector('.ptr-icon');
    
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let isRefreshing = false;
    const triggerThreshold = 100;

    appContent.addEventListener('touchstart', (e) => {
        if (appContent.scrollTop === 0 && !isRefreshing) {
            startY = e.touches[0].clientY;
            isPulling = true;
            appContent.style.transition = 'none';
        }
    }, { passive: true });

    appContent.addEventListener('touchmove', (e) => {
        if (!isPulling || isRefreshing) return;
        currentY = e.touches[0].clientY;
        const pullDistance = currentY - startY;
        if (pullDistance > 0 && appContent.scrollTop === 0) {
            const transformY = Math.min(pullDistance * 0.4, triggerThreshold + 20);
            appContent.style.transform = `translateY(${transformY}px)`;
            ptrIcon.style.opacity = Math.min(transformY / triggerThreshold, 1);
            if (e.cancelable) e.preventDefault();
        }
    }, { passive: false });

    appContent.addEventListener('touchend', () => {
        if (!isPulling || isRefreshing) return;
        isPulling = false;
        const pullDistance = currentY - startY;
        const transformY = Math.min(pullDistance * 0.4, triggerThreshold + 20);
        
        if (transformY >= triggerThreshold) {
            isRefreshing = true;
            appContent.style.transition = 'transform 0.3s ease-out';
            appContent.style.transform = `translateY(60px)`;
            ptrIcon.classList.add('refreshing');
            
            setTimeout(() => {
                appContent.style.transform = `translateY(0)`;
                setTimeout(() => {
                    ptrIcon.classList.remove('refreshing');
                    ptrIcon.style.opacity = '0';
                    isRefreshing = false;
                }, 300);
            }, 1200);
        } else {
            appContent.style.transition = 'transform 0.3s ease-out';
            appContent.style.transform = `translateY(0)`;
            ptrIcon.style.opacity = '0';
        }
        startY = 0;
        currentY = 0;
    });
});
