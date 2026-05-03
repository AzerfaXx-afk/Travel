import './style.css';

// 1. Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); });
}

// Global App State
let state = {
    trips: [],      // { id, name, dest, destImg, friends: [] }
    expenses: [],   // { id, title, amount, payer }
    activeTripId: null
};

// Database of suggestions
const DESTINATIONS = [
    { name: "Rome, Italie", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&q=80" },
    { name: "Bali, Indonésie", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80" },
    { name: "Tulum, Mexique", img: "https://images.unsplash.com/photo-1518638150340-f706d86654de?auto=format&fit=crop&w=400&q=80" },
    { name: "Tokyo, Japon", img: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80" },
    { name: "Santorin, Grèce", img: "https://images.unsplash.com/photo-1516483638261-f40af5aa32c6?auto=format&fit=crop&w=400&q=80" },
    { name: "Paris, France", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80" }
];

document.addEventListener('DOMContentLoaded', () => {
    // Hide Loader
    setTimeout(() => { document.getElementById('app-loader').classList.add('hidden'); }, 1000);

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';
    themeToggle.addEventListener('change', (e) => {
        const newTheme = e.target.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // View Switching
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            if (item.classList.contains('fab-wrapper')) return;
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) view.classList.add('active');
            });
            if (targetId === 'view-budget') renderBudget();
        });
    });

    // Modal New Trip logic
    const modalNewTrip = document.getElementById('modal-new-trip');
    const btnOpenNewTrip = document.getElementById('btn-open-new-trip');
    const btnCreateFirstTrip = document.getElementById('btn-create-first-trip');
    
    const openNewTripModal = (e) => {
        if(e) e.preventDefault();
        modalNewTrip.classList.add('show');
        resetTripForm();
    };
    
    btnOpenNewTrip.addEventListener('click', openNewTripModal);
    if(btnCreateFirstTrip) btnCreateFirstTrip.addEventListener('click', openNewTripModal);

    document.querySelector('.close-modal').addEventListener('click', () => {
        modalNewTrip.classList.remove('show');
    });

    // Trip Creation Form State
    let pendingTrip = { name: "", dest: null, destImg: "", friends: [] };

    const tripNameInput = document.getElementById('trip-name-input');
    const destInput = document.getElementById('destination-input');
    const suggestionsGrid = document.getElementById('destination-suggestions');
    const selectedDestDiv = document.getElementById('selected-destination');
    const selectedDestName = document.getElementById('selected-dest-name');
    const removeDestBtn = document.getElementById('remove-destination');
    
    const friendNameInput = document.getElementById('friend-name-input');
    const btnAddFriend = document.getElementById('btn-add-friend');
    const modalFriendsList = document.getElementById('modal-friends-list');
    const btnCreateTrip = document.getElementById('btn-create-trip');

    const validateForm = () => {
        const isValid = pendingTrip.name.length > 0 && pendingTrip.dest !== null;
        btnCreateTrip.disabled = !isValid;
        btnCreateTrip.style.opacity = isValid ? '1' : '0.5';
    };

    tripNameInput.addEventListener('input', (e) => {
        pendingTrip.name = e.target.value;
        validateForm();
    });

    const renderSuggestions = (query = "") => {
        const lowerQ = query.toLowerCase();
        const filtered = DESTINATIONS.filter(d => d.name.toLowerCase().includes(lowerQ));
        suggestionsGrid.innerHTML = filtered.map((p, index) => `
            <div class="suggest-card" data-index="${index}" style="background-image: url('${p.img}')">
                <span>${p.name}</span>
            </div>
        `).join('');

        document.querySelectorAll('.suggest-card').forEach(card => {
            card.addEventListener('click', () => {
                const item = filtered[card.getAttribute('data-index')];
                pendingTrip.dest = item.name;
                pendingTrip.destImg = item.img;
                selectedDestName.textContent = item.name;
                selectedDestDiv.style.display = 'flex';
                suggestionsGrid.style.display = 'none';
                destInput.style.display = 'none';
                validateForm();
            });
        });
    };

    destInput.addEventListener('input', (e) => { renderSuggestions(e.target.value); });
    removeDestBtn.addEventListener('click', () => {
        pendingTrip.dest = null;
        pendingTrip.destImg = "";
        selectedDestDiv.style.display = 'none';
        suggestionsGrid.style.display = 'grid';
        destInput.style.display = 'block';
        destInput.value = "";
        renderSuggestions();
        validateForm();
    });

    // Add friend
    const renderModalFriends = () => {
        modalFriendsList.innerHTML = pendingTrip.friends.map((f, i) => `
            <div class="friend-pill">
                <img src="https://ui-avatars.com/api/?name=${f}&background=random" /> ${f}
                <span class="material-icons-round remove-friend" data-index="${i}" style="font-size:14px; margin-left:4px; cursor:pointer;">close</span>
            </div>
        `).join('');
        
        document.querySelectorAll('.remove-friend').forEach(btn => {
            btn.addEventListener('click', (e) => {
                pendingTrip.friends.splice(e.target.getAttribute('data-index'), 1);
                renderModalFriends();
            });
        });
    };

    btnAddFriend.addEventListener('click', () => {
        const val = friendNameInput.value.trim();
        if(val) {
            pendingTrip.friends.push(val);
            friendNameInput.value = "";
            renderModalFriends();
        }
    });

    const resetTripForm = () => {
        pendingTrip = { name: "", dest: null, destImg: "", friends: [] };
        tripNameInput.value = "";
        destInput.value = "";
        selectedDestDiv.style.display = 'none';
        suggestionsGrid.style.display = 'grid';
        destInput.style.display = 'block';
        friendNameInput.value = "";
        renderSuggestions();
        renderModalFriends();
        validateForm();
    };

    // CREATE TRIP ACTION
    btnCreateTrip.addEventListener('click', () => {
        const newTrip = {
            id: Date.now(),
            ...pendingTrip
        };
        state.trips.push(newTrip);
        state.activeTripId = newTrip.id;
        
        modalNewTrip.classList.remove('show');
        renderApp();
    });

    // --- APP RENDERING ---
    const renderApp = () => {
        renderTrips();
        renderTimeline();
        renderBudget();
    };

    const renderTrips = () => {
        const container = document.getElementById('trips-container');
        if (state.trips.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; width: 100%;">
                    <span class="material-icons-round" style="font-size: 48px; color: var(--border-color);">luggage</span>
                    <p style="color: var(--text-muted); margin-top: 8px;">Aucun voyage prévu.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = state.trips.map(trip => `
            <div class="trip-card">
                <div class="trip-image" style="background-image: url('${trip.destImg}')">
                    <div class="trip-badge">Nouveau</div>
                </div>
                <div class="trip-info">
                    <h4>${trip.name}</h4>
                    <p>${trip.dest}</p>
                    <div class="trip-friends">
                        <img src="https://ui-avatars.com/api/?name=Adam&background=FF7B54&color=fff&rounded=true" class="friend-avatar" />
                        ${trip.friends.map(f => `<img src="https://ui-avatars.com/api/?name=${f}&background=random&color=fff&rounded=true" class="friend-avatar" />`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    };

    const renderTimeline = () => {
        const container = document.getElementById('timeline-container');
        if (state.trips.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 24px; background: var(--surface); border-radius: var(--radius-md);">
                    <span class="material-icons-round" style="font-size: 32px; color: var(--border-color);">calendar_today</span>
                    <p style="color: var(--text-muted); font-size: 14px; margin-top: 8px;">Créez un voyage pour voir le programme.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="timeline-item">
                <div class="timeline-time">Bientôt</div>
                <div class="timeline-dot flight"><span class="material-icons-round">flight</span></div>
                <div class="timeline-content">
                    <h4>Vol vers ${state.trips[0].dest}</h4>
                    <p>À programmer</p>
                </div>
            </div>
            <button class="text-btn primary" style="width:100%; padding:12px; border: 1px dashed var(--primary); border-radius: var(--radius-sm); margin-top:12px;">+ Ajouter une étape</button>
        `;
    };

    const renderBudget = () => {
        const container = document.getElementById('budget-container');
        if (state.trips.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 48px 24px; margin-top: 24px;">
                    <span class="material-icons-round" style="font-size: 64px; color: var(--border-color);">account_balance_wallet</span>
                    <h3 style="margin-top: 16px;">Aucune dépense</h3>
                    <p style="color: var(--text-muted); font-size: 14px; margin-top: 8px;">Créez un voyage pour commencer à gérer votre budget.</p>
                </div>
            `;
            return;
        }

        const total = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);

        let html = `
            <div class="budget-card" style="margin-top: 16px;">
                <div class="budget-header">
                    <div>
                        <span class="budget-title">Total Dépensé</span>
                        <h3 class="budget-amount">${total.toFixed(2)} €</h3>
                    </div>
                    <div class="budget-icon">
                        <span class="material-icons-round">account_balance_wallet</span>
                    </div>
                </div>
                <button class="budget-btn" id="btn-open-expense">Ajouter une dépense</button>
            </div>
            <h3 style="margin: 24px 0 16px;">Historique</h3>
            <div class="balance-list">
        `;

        if (state.expenses.length === 0) {
            html += `<p style="text-align:center; color: var(--text-muted); font-size:14px;">Pas encore de dépenses. Soyez le premier à payer !</p>`;
        } else {
            html += state.expenses.map(e => `
                <div class="balance-item">
                    <img src="https://ui-avatars.com/api/?name=${e.payer}&background=random" class="avatar-sm" />
                    <div class="balance-info">
                        <h4>${e.title}</h4>
                        <p>Payé par ${e.payer}</p>
                    </div>
                    <div class="balance-amount negative">${e.amount.toFixed(2)} €</div>
                </div>
            `).join('');
        }

        html += `</div>`;
        container.innerHTML = html;

        // Bind new expense button
        const btnOpenExpense = document.getElementById('btn-open-expense');
        if(btnOpenExpense) {
            btnOpenExpense.addEventListener('click', () => {
                const activeTrip = state.trips[0]; // simplify for MVP
                const selectPayer = document.getElementById('expense-payer');
                selectPayer.innerHTML = `<option value="Adam">Moi (Adam)</option>` + 
                    activeTrip.friends.map(f => `<option value="${f}">${f}</option>`).join('');
                document.getElementById('modal-new-expense').classList.add('show');
            });
        }
    };

    // Add Expense Modal Logic
    document.querySelector('.close-modal-expense').addEventListener('click', () => {
        document.getElementById('modal-new-expense').classList.remove('show');
    });

    document.getElementById('btn-save-expense').addEventListener('click', () => {
        const title = document.getElementById('expense-title').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const payer = document.getElementById('expense-payer').value;

        if(title && amount > 0) {
            state.expenses.push({ id: Date.now(), title, amount, payer });
            document.getElementById('expense-title').value = '';
            document.getElementById('expense-amount').value = '';
            document.getElementById('modal-new-expense').classList.remove('show');
            renderBudget();
        }
    });

    // Pull to Refresh
    const appContent = document.getElementById('app-content');
    const ptrIcon = document.querySelector('.ptr-icon');
    let startY = 0, currentY = 0, isPulling = false, isRefreshing = false;
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
            appContent.style.transform = `translateY(0)`;
            ptrIcon.style.opacity = '0';
        }
        startY = 0; currentY = 0;
    });

    // Initial render
    renderApp();
});
