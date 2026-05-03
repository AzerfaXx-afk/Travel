import './style.css';

// 1. Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); });
}

// Global App State
let state = {
    trips: [],      // { id, name, dest, destImg, coords, pois, friends: [], itinerary: [] }
    expenses: [],   // { id, title, amount, payer }
    activeTripId: null
};

// Database of European destinations with coordinates and POIs for the map
const DESTINATIONS = [
    { 
        name: "Grèce (Athènes, Cyclades)", 
        img: "https://images.unsplash.com/photo-1516483638261-f40af5aa32c6?auto=format&fit=crop&w=400&q=80",
        coords: [39.0742, 21.8243],
        pois: [
            { name: "Acropole d'Athènes", coords: [37.9715, 23.7257], icon: "account_balance" },
            { name: "Oia, Santorin", coords: [36.4618, 25.3753], icon: "wb_sunny" },
            { name: "Météores", coords: [39.7126, 21.6267], icon: "terrain" },
            { name: "Palais de Cnossos (Crète)", coords: [35.2981, 25.1632], icon: "museum" },
            { name: "Plage de Navagio (Zakynthos)", coords: [37.8596, 20.6249], icon: "beach_access" }
        ]
    },
    { 
        name: "Italie", 
        img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&q=80",
        coords: [41.8719, 12.5674],
        pois: [
            { name: "Colisée, Rome", coords: [41.8902, 12.4922], icon: "account_balance" },
            { name: "Tour de Pise", coords: [43.7229, 10.3965], icon: "tour" },
            { name: "Cinque Terre", coords: [44.1278, 9.7098], icon: "landscape" },
            { name: "Côte Amalfitaine", coords: [40.6333, 14.6027], icon: "water" },
            { name: "Venise (Canal Grande)", coords: [45.4382, 12.3323], icon: "sailing" }
        ]
    },
    { 
        name: "France", 
        img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80",
        coords: [46.2276, 2.2137],
        pois: [
            { name: "Tour Eiffel, Paris", coords: [48.8584, 2.2945], icon: "tour" },
            { name: "Mont Saint-Michel", coords: [48.6360, -1.5115], icon: "church" },
            { name: "Gorges du Verdon", coords: [43.7408, 6.3197], icon: "terrain" },
            { name: "Château de Versailles", coords: [48.8048, 2.1203], icon: "account_balance" },
            { name: "Calanques de Marseille", coords: [43.2128, 5.4526], icon: "water" }
        ]
    },
    {
        name: "Espagne",
        img: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=400&q=80",
        coords: [40.4637, -3.7492],
        pois: [
            { name: "Sagrada Familia, Barcelone", coords: [41.4036, 2.1744], icon: "church" },
            { name: "Alhambra, Grenade", coords: [37.1760, -3.5881], icon: "account_balance" },
            { name: "Plaza Mayor, Madrid", coords: [40.4153, -3.7073], icon: "location_city" },
            { name: "Parc Güell", coords: [41.4145, 2.1527], icon: "park" },
            { name: "Plage de Majorque", coords: [39.6952, 3.0175], icon: "beach_access" }
        ]
    },
    {
        name: "Portugal",
        img: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=400&q=80",
        coords: [39.3998, -8.2244],
        pois: [
            { name: "Tour de Belém, Lisbonne", coords: [38.6915, -9.2159], icon: "tour" },
            { name: "Palais de Pena, Sintra", coords: [38.7876, -9.3906], icon: "account_balance" },
            { name: "Ribeira, Porto", coords: [41.1404, -8.6128], icon: "location_city" },
            { name: "Grottes de Benagil, Algarve", coords: [37.0873, -8.4239], icon: "water" }
        ]
    },
    {
        name: "Croatie",
        img: "https://images.unsplash.com/photo-1554907551-7890f6707310?auto=format&fit=crop&w=400&q=80",
        coords: [45.1, 15.2],
        pois: [
            { name: "Murailles de Dubrovnik", coords: [42.6416, 18.1104], icon: "account_balance" },
            { name: "Parc de Plitvice", coords: [44.8653, 15.5820], icon: "park" },
            { name: "Palais de Dioclétien, Split", coords: [43.5079, 16.4401], icon: "museum" },
            { name: "Hvar (Île)", coords: [43.1673, 16.4385], icon: "beach_access" }
        ]
    },
    {
        name: "Islande",
        img: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=400&q=80",
        coords: [64.9631, -19.0208],
        pois: [
            { name: "Blue Lagoon", coords: [63.8804, -22.4495], icon: "pool" },
            { name: "Cascade de Gullfoss", coords: [64.3271, -20.1199], icon: "water" },
            { name: "Plage de sable noir de Reynisfjara", coords: [63.4057, -19.0716], icon: "beach_access" },
            { name: "Geysir", coords: [64.3104, -20.3024], icon: "wb_iridescent" }
        ]
    },
    {
        name: "Suisse",
        img: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=400&q=80",
        coords: [46.8182, 8.2275],
        pois: [
            { name: "Le Cervin (Zermatt)", coords: [45.9763, 7.6586], icon: "terrain" },
            { name: "Lac Léman", coords: [46.4312, 6.5262], icon: "water" },
            { name: "Château de Chillon", coords: [46.4142, 6.9275], icon: "account_balance" }
        ]
    },
    {
        name: "Norvège",
        img: "https://images.unsplash.com/photo-1513569771920-c9e1d31714af?auto=format&fit=crop&w=400&q=80",
        coords: [60.4720, 8.4689],
        pois: [
            { name: "Fjord de Geiranger", coords: [62.1015, 7.0940], icon: "water" },
            { name: "Îles Lofoten", coords: [68.1666, 13.7500], icon: "landscape" },
            { name: "Preikestolen", coords: [58.9871, 6.1888], icon: "terrain" },
            { name: "Tromsø (Aurores Boréales)", coords: [69.6492, 18.9553], icon: "wb_twilight" }
        ]
    }
];

// Leaflet Map instance
let map = null;
let markers = [];

document.addEventListener('DOMContentLoaded', () => {
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
            if (targetId === 'view-map') initOrUpdateMap();
            if (targetId === 'view-home') renderApp();
        });
    });

    // Modal New Trip logic
    const modalNewTrip = document.getElementById('modal-new-trip');
    const btnOpenNewTrip = document.getElementById('btn-open-new-trip');
    
    const openNewTripModal = (e) => {
        if(e) e.preventDefault();
        modalNewTrip.classList.add('show');
        resetTripForm();
    };
    
    btnOpenNewTrip.addEventListener('click', openNewTripModal);

    document.body.addEventListener('click', (e) => {
        if(e.target && e.target.id === 'btn-create-first-trip') {
            openNewTripModal(e);
        }
    });

    document.querySelector('.close-modal').addEventListener('click', () => {
        modalNewTrip.classList.remove('show');
    });

    // Trip Creation Form State
    let pendingTrip = { name: "", dest: null, destImg: "", coords: null, pois: [], friends: [], itinerary: [] };

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
                pendingTrip.coords = item.coords;
                pendingTrip.pois = item.pois;
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
        pendingTrip.coords = null;
        pendingTrip.pois = [];
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
        pendingTrip = { name: "", dest: null, destImg: "", coords: null, pois: [], friends: [], itinerary: [] };
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

    // --- NEW STEP (ITINERARY) MODAL LOGIC ---
    const modalNewStep = document.getElementById('modal-new-step');
    
    document.body.addEventListener('click', (e) => {
        if(e.target && e.target.id === 'btn-open-step') {
            modalNewStep.classList.add('show');
            document.getElementById('step-title').value = '';
            document.getElementById('step-subtitle').value = '';
        }
    });

    document.querySelector('.close-modal-step').addEventListener('click', () => {
        modalNewStep.classList.remove('show');
    });

    document.getElementById('btn-save-step').addEventListener('click', () => {
        if (!state.activeTripId) return;
        const activeTrip = state.trips.find(t => t.id === state.activeTripId);
        
        const title = document.getElementById('step-title').value;
        const subtitle = document.getElementById('step-subtitle').value;
        const icon = document.getElementById('step-icon').value;
        const day = parseInt(document.getElementById('step-day').value) || 1;

        if (title) {
            activeTrip.itinerary.push({ title, subtitle, icon, day });
            // Sort itinerary by day
            activeTrip.itinerary.sort((a, b) => a.day - b.day);
            modalNewStep.classList.remove('show');
            renderTimeline();
        }
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
                    <button class="text-btn primary" id="btn-create-first-trip" style="margin-top: 8px;">Créer un voyage</button>
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

        const activeTrip = state.trips.find(t => t.id === state.activeTripId);
        
        let html = '';
        if (activeTrip.itinerary.length === 0) {
            html += `<p style="text-align:center; color: var(--text-muted); font-size:14px; margin-bottom: 16px;">Votre programme est vide. Ajoutez vos vols, hôtels et visites !</p>`;
        } else {
            // Group by Day (Simplified)
            let currentDay = -1;
            activeTrip.itinerary.forEach(step => {
                if (step.day !== currentDay) {
                    html += `<h4 style="margin: 16px 0 8px; color: var(--primary);">Jour ${step.day}</h4>`;
                    currentDay = step.day;
                }
                
                let dotColor = "var(--primary)";
                if (step.icon === 'flight') dotColor = "var(--secondary)";
                if (step.icon === 'hotel') dotColor = "var(--accent)";

                html += `
                    <div class="timeline-item">
                        <div class="timeline-dot" style="background: ${dotColor};"><span class="material-icons-round">${step.icon}</span></div>
                        <div class="timeline-content">
                            <h4>${step.title}</h4>
                            <p>${step.subtitle}</p>
                        </div>
                    </div>
                `;
            });
        }
        
        html += `<button class="text-btn primary" id="btn-open-step" style="width:100%; padding:12px; border: 1px dashed var(--primary); border-radius: var(--radius-sm); margin-top:12px;">+ Ajouter une étape</button>`;
        container.innerHTML = html;
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

        const btnOpenExpense = document.getElementById('btn-open-expense');
        if(btnOpenExpense) {
            btnOpenExpense.addEventListener('click', () => {
                const activeTrip = state.trips.find(t => t.id === state.activeTripId);
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

    // MAP LOGIC (LEAFLET)
    const initOrUpdateMap = () => {
        let centerCoords = [46.2276, 2.2137]; // Default to Europe center roughly
        let zoomLevel = 4;
        let activeTrip = state.trips.length > 0 ? state.trips.find(t => t.id === state.activeTripId) : null;

        if (activeTrip && activeTrip.coords) {
            centerCoords = activeTrip.coords;
            zoomLevel = 6;
        }

        if (!map) {
            map = L.map('map', { zoomControl: false }).setView(centerCoords, zoomLevel);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);
        } else {
            map.setView(centerCoords, zoomLevel);
        }

        markers.forEach(m => map.removeLayer(m));
        markers = [];

        if (activeTrip && activeTrip.pois) {
            activeTrip.pois.forEach(poi => {
                const iconHtml = `<div style="background:var(--primary); color:white; width:36px; height:36px; border-radius:50%; display:flex; justify-content:center; align-items:center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white;"><span class="material-icons-round" style="font-size:20px;">${poi.icon}</span></div>`;
                const customIcon = L.divIcon({
                    html: iconHtml,
                    className: 'custom-leaflet-marker',
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                    popupAnchor: [0, -36]
                });
                const marker = L.marker(poi.coords, { icon: customIcon })
                    .addTo(map)
                    .bindPopup(`<b>${poi.name}</b><br>Recommandation Odyssée`);
                markers.push(marker);
            });
            setTimeout(() => { map.invalidateSize(); }, 300);
        }
    };

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
