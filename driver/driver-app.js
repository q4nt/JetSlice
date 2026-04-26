/**
 * JetSlice Driver App - Courier Interface Logic
 */
const driver = {
    isOnline: false,
    activeOrder: null,
    modalTimer: null,
    elapsedTimer: null,
    elapsedSeconds: 0,

    // ── Navigation ──
    navigateTab(e, screenId) {
        e.preventDefault();
        document.querySelectorAll('.screen:not(.sub-screen)').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        if (e.currentTarget) e.currentTarget.classList.add('active');
    },

    // ── Sub Screens ──
    showSubScreen(screenId) {
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
    },
    hideSubScreen(screenId) {
        const target = document.getElementById(screenId);
        if (target) target.classList.remove('active');
    },

    // ── Online Toggle ──
    toggleOnline() {
        this.isOnline = !this.isOnline;
        const toggle = document.getElementById('onlineToggle');
        const bar = document.getElementById('statusBar');
        if (this.isOnline) {
            toggle.classList.add('active');
            toggle.querySelector('.toggle-label').textContent = 'Online';
            bar.classList.add('online');
            bar.querySelector('span').textContent = 'Searching for deliveries...';
            // Simulate incoming order after 3-6 seconds
            setTimeout(() => this.simulateIncomingOrder(), 3000 + Math.random() * 3000);
        } else {
            toggle.classList.remove('active');
            toggle.querySelector('.toggle-label').textContent = 'Offline';
            bar.classList.remove('online');
            bar.querySelector('span').textContent = "";
        }
    },

    // ── Simulate Incoming Order ──
    simulateIncomingOrder() {
        if (!this.isOnline || this.activeOrder) return;
        const orders = [
            { restaurant: "Joe's Stone Crab", pickup: "Joe's Stone Crab - Miami Beach", airport: "MIA - Miami International", flight: "Spirit NK1712 - Departs 4:30 PM", cargo: "Heated Case", pay: 85, dist: "28 mi", eta: "~58 min", away: "12 min away" },
            { restaurant: "Peter Luger Steak", pickup: "Peter Luger - Brooklyn, NY", airport: "EWR - Newark Liberty", flight: "United UA1847 - Departs 6:15 PM", cargo: "Heated Case", pay: 127, dist: "34 mi", eta: "~1h 10m", away: "18 min away" },
            { restaurant: "Nobu Malibu", pickup: "Nobu - Malibu, CA", airport: "LAX - Los Angeles Intl", flight: "American AA492 - Departs 7:00 PM", cargo: "Refrigerated", pay: 142, dist: "22 mi", eta: "~45 min", away: "8 min away" },
            { restaurant: "Alinea Chicago", pickup: "Alinea - Lincoln Park, IL", airport: "ORD - O'Hare International", flight: "Delta DL2291 - Departs 5:45 PM", cargo: "Heated Case", pay: 98, dist: "19 mi", eta: "~40 min", away: "10 min away" },
        ];
        const order = orders[Math.floor(Math.random() * orders.length)];

        // Add to feed
        const feed = document.getElementById('orderFeed');
        const empty = document.getElementById('emptyFeed');
        if (empty) empty.style.display = 'none';

        const card = document.createElement('div');
        card.className = 'order-request-card';
        card.onclick = () => this.showOrderModal(order);
        card.innerHTML = `
            <div class="orc-top">
                <span class="orc-restaurant">${order.restaurant}</span>
                <span class="orc-payout">$${order.pay}</span>
            </div>
            <div class="orc-route-mini">
                <ion-icon name="restaurant-outline"></ion-icon> ${order.pickup.split(' - ')[1] || order.pickup}
                <ion-icon name="arrow-forward-outline"></ion-icon>
                <ion-icon name="airplane-outline"></ion-icon> ${order.airport.split(' - ')[0]}
            </div>
            <div class="orc-chips">
                <span class="orc-chip">${order.cargo}</span>
                <span class="orc-chip time">${order.eta}</span>
                <span class="orc-chip">${order.dist}</span>
            </div>
        `;
        feed.insertBefore(card, feed.firstChild);

        // Update count
        const countEl = document.getElementById('requestCount');
        countEl.textContent = parseInt(countEl.textContent) + 1;

        // Auto-show modal
        this.showOrderModal(order);

        // Schedule next order
        if (this.isOnline) {
            setTimeout(() => this.simulateIncomingOrder(), 15000 + Math.random() * 10000);
        }
    },

    // -- Order Modal --
    showOrderModal(order) {
        this._pendingOrder = order;
        const modal = document.getElementById('orderModal');
        document.getElementById('modalPickup').textContent = order.pickup;
        document.getElementById('modalPickupDetail').textContent = order.away;
        document.getElementById('modalAirport').textContent = order.airport || order.dropoff;
        document.getElementById('modalFlight').textContent = order.flight;
        document.getElementById('modalCargo').textContent = order.cargo;
        document.getElementById('modalFlyout').textContent = order.eta; // Now shows flyout time

        const returnMin = Math.max((order.oneWayMin || 60) - 30, 15);
        const retHrs = Math.floor(returnMin / 60);
        const retM = returnMin % 60;
        document.getElementById('modalReturn').textContent = retHrs > 0 ? `~${retHrs}h ${retM}m` : `~${retM} min`;
        
        document.getElementById('modalDist').textContent = order.dist;

        // Compute round trip time and $/hour from actual coordinate-based data
        const oneWayMin = order.oneWayMin || 60;
        // Round trip: full outbound + return flight only (no ground pickup on return) + 15 min buffer
        const returnFlightMin = Math.max(oneWayMin - 30, 15); // subtract ground legs from one-way
        const roundTripMin = oneWayMin + returnFlightMin + 15; // outbound + return flight + buffer
        const rtHrs = Math.floor(roundTripMin / 60);
        const rtMin = roundTripMin % 60;
        const roundTripLabel = rtHrs > 0 ? `~${rtHrs}h ${rtMin}m` : `~${rtMin} min`;
        document.getElementById('modalRoundTrip').textContent = roundTripLabel;

        // Base rate is $50/hr (not including tip or surge)
        const roundTripHours = roundTripMin / 60;
        const basePayout = Math.round(50 * roundTripHours);
        document.getElementById('modalPay').textContent = `$${basePayout.toLocaleString()}`;
        document.getElementById('modalPerHour').textContent = '$50/hr';

        modal.classList.remove('hidden');

        // Countdown
        let seconds = 120;
        const countdownEl = document.getElementById('modalCountdown');
        countdownEl.textContent = `${seconds}s`;
        if (this.modalTimer) clearInterval(this.modalTimer);
        this.modalTimer = setInterval(() => {
            seconds--;
            countdownEl.textContent = `${seconds}s`;
            if (seconds <= 0) { this.dismissOrder(); }
        }, 1000);
    },

    _cleanupMapAnimation() {
        if (this._missionAnimId) { cancelAnimationFrame(this._missionAnimId); this._missionAnimId = null; }
        if (this._missionFlyingMarker) { this._missionFlyingMarker.remove(); this._missionFlyingMarker = null; }
        if (this._originMarker) { this._originMarker.remove(); this._originMarker = null; }
        if (this._destMarker) { this._destMarker.remove(); this._destMarker = null; }
        if (this.map) {
            ['mission-route-dashed', 'mission-route-solid', 'mission-route-glow'].forEach(id => {
                try { if (this.map.getLayer(id)) this.map.removeLayer(id); } catch(e) {}
            });
            ['mission-route-source', 'mission-trail-source'].forEach(id => {
                try { if (this.map.getSource(id)) this.map.removeSource(id); } catch(e) {}
            });
        }
    },

    _restoreDashboard() {
        const content = document.getElementById('dashboard-content');
        if (content) { content.style.opacity = '1'; content.style.pointerEvents = ''; }
        const mapContainer = document.getElementById('driver-map');
        if (mapContainer) mapContainer.style.display = 'none';
        this._cleanupMapAnimation();
    },

    dismissOrder() {
        if (this.modalTimer) clearInterval(this.modalTimer);
        document.getElementById('orderModal').classList.add('hidden');
        this._pendingOrder = null;
        this._restoreDashboard();
    },

    acceptOrder() {
        if (this.modalTimer) clearInterval(this.modalTimer);
        const order = this._pendingOrder;
        if (!order) return;

        this.activeOrder = order;
        document.getElementById('orderModal').classList.add('hidden');

        // Fire gold confetti celebration
        this.fireGoldConfetti();

        this._restoreDashboard();

        // Show active delivery card
        const card = document.getElementById('activeDeliveryCard');
        if (card) {
            card.classList.remove('hidden');
            document.getElementById('activePickup').textContent = order.pickup;
            document.getElementById('activeDropoff').textContent = order.airport || order.dropoff;
            document.getElementById('activePay').textContent = `$${order.pay}`;
        }

        // Update status bar
        const bar = document.getElementById('statusBar');
        if (bar) bar.querySelector('span').textContent = 'En route to pickup';

        // Start elapsed timer
        this.elapsedSeconds = 0;
        clearInterval(this.elapsedTimer);
        this.elapsedTimer = setInterval(() => {
            this.elapsedSeconds++;
            const m = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
            const s = (this.elapsedSeconds % 60).toString().padStart(2, '0');
            document.getElementById('activeTimer').textContent = `${m}:${s}`;
        }, 1000);

        // Update earnings
        const earningsEl = document.getElementById('todayEarnings');
        const current = parseInt(earningsEl.textContent.replace('$', '')) || 0;
        earningsEl.textContent = `$${current + order.pay}`;

        const countEl = document.getElementById('deliveryCount');
        countEl.textContent = parseInt(countEl.textContent) + 1;
    },

    openNavigation() {
        if (!this.activeOrder) return;
        // In a real app this would open Google Maps / Apple Maps
        alert('Opening navigation to: ' + this.activeOrder.pickup);
    },

    requestPayout() {
        alert('Payout requested! Funds will arrive in 1-2 business days.');
    },

    fireGoldConfetti() {
        const colors = ['#d4af37', '#fcecba', '#aa8c2c', '#ffffff'];
        const targetEl = document.querySelector('.iphone-mockup') || document.querySelector('.app-container');
        if (!targetEl) return;

        for (let i = 0; i < 60; i++) {
            const piece = document.createElement('div');
            piece.style.cssText = `
                position: absolute; pointer-events: none; z-index: 99999;
                width: ${Math.random() * 8 + 4}px;
                height: ${Math.random() * 12 + 6}px;
                background-color: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}%;
                top: -20px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            `;
            targetEl.appendChild(piece);

            let vx = Math.random() * 2 - 1;
            let vy = Math.random() * 2 + 1;
            let x = 0, y = 0;
            let rot = Math.random() * 360;
            let rotV = Math.random() * 4 - 2;
            let opacity = 1;

            setTimeout(() => {
                const animate = () => {
                    vx += (Math.random() * 0.2 - 0.1);
                    if (vx > 2) vx = 2;
                    if (vx < -2) vx = -2;
                    x += vx;
                    y += vy;
                    rot += rotV;
                    if (y > 600) opacity -= 0.005;
                    piece.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
                    piece.style.opacity = opacity;
                    if (opacity <= 0 || y > 900) {
                        piece.remove();
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
            }, Math.random() * 1000);
        }
    },

    _haversineDistMiles(coord1, coord2) {
        const toRad = (deg) => deg * Math.PI / 180;
        const R = 3959; // Earth radius in miles
        const dLat = toRad(coord2[1] - coord1[1]);
        const dLon = toRad(coord2[0] - coord1[0]);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(coord1[1])) * Math.cos(toRad(coord2[1])) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
};

window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NEW_ORDER') {
        const order = event.data.order;
        
        // 1) Show the Mapbox globe first (behind everything)
        const mapContainer = document.getElementById('driver-map');
        if (mapContainer) mapContainer.style.display = 'block';
        
        // 2) Hide dashboard content so the globe is visible
        const content = document.getElementById('dashboard-content');
        if (content) content.style.opacity = '0';
        if (content) content.style.pointerEvents = 'none';
        
        // 3) Initialize or reuse Mapbox globe
        const oCoords = order.oCoords || [-74.006, 40.7128];
        const dCoords = order.dCoords || [-87.6298, 41.8781];
        const emoji = order.emoji || '📦';

        if (!driver.map && mapContainer) {
            // Use the token from the production app (sent via postMessage)
            const token = order.mapboxToken;
            if (!token) {
                console.warn('[Driver] No Mapbox token provided in order payload');
                return;
            }
            mapboxgl.accessToken = token;
            driver.map = new mapboxgl.Map({
                container: 'driver-map',
                style: 'mapbox://styles/mapbox/dark-v11',
                center: oCoords,
                zoom: 3.5,
                pitch: 45,
                projection: 'globe',
                interactive: false
            });
            
            driver.map.on('style.load', () => {
                driver.map.setFog({
                    'color': 'rgb(10, 10, 10)',
                    'high-color': 'rgb(20, 20, 20)',
                    'horizon-blend': 0.1,
                    'space-color': 'rgb(0, 0, 0)',
                    'star-intensity': 0.8
                });
                driver.animateMapboxRoute(oCoords, dCoords, emoji);
            });
        } else if (driver.map) {
            driver.animateMapboxRoute(oCoords, dCoords, emoji);
        }
        
        // 4) Compute distance and time from actual coordinates
        const distMiles = driver._haversineDistMiles(oCoords, dCoords);
        // Flight: avg 500 mph cruise. Ground legs: ~30 min total (pickup + delivery at destination)
        const flightTimeMin = Math.round((distMiles / 500) * 60);
        const groundTimeMin = 30; // pickup drive + airport drop + destination delivery
        const oneWayTotalMin = flightTimeMin + groundTimeMin;
        
        const etaLabel = oneWayTotalMin >= 60
            ? `~${Math.floor(oneWayTotalMin / 60)}h ${oneWayTotalMin % 60}m`
            : `~${oneWayTotalMin} min`;
        const distLabel = distMiles >= 100
            ? `${Math.round(distMiles)} mi`
            : `${Math.round(distMiles * 10) / 10} mi`;

        // Show the order modal panel (slides up from bottom over the globe)
        driver.showOrderModal({
            pay: (order.payout || '$0').replace('$', '').trim(),
            pickup: order.pickup || 'Pickup Location',
            airport: order.dropoff || 'Dropoff Location',
            flight: 'Premium Delivery',
            cargo: 'Secure Item',
            dist: distLabel,
            eta: etaLabel,
            away: 'Just requested',
            oneWayMin: oneWayTotalMin
        });
    }
});

driver.animateMapboxRoute = function(oCoords, dCoords, emoji) {
    // Clean up any previous animation
    this._cleanupMapAnimation();

    const midLng = (oCoords[0] + dCoords[0]) / 2;
    const midLat = (oCoords[1] + dCoords[1]) / 2;

    this.map.flyTo({
        center: [midLng, midLat],
        zoom: 3.2,
        pitch: 25,
        bearing: 0,
        padding: { top: 0, bottom: 420, left: 0, right: 0 },
        duration: 2000,
        essential: true
    });

    this.map.once('moveend', () => {
        // Compute great-circle arc
        const arcPoints = [];
        const steps = 120;
        const lon1 = oCoords[0] * Math.PI / 180;
        const lat1 = oCoords[1] * Math.PI / 180;
        const lon2 = dCoords[0] * Math.PI / 180;
        const lat2 = dCoords[1] * Math.PI / 180;

        const d = 2 * Math.asin(Math.sqrt(
            Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
        ));
        if (d < 0.0001) {
            arcPoints.push(oCoords, dCoords);
        } else {
            for (let i = 0; i <= steps; i++) {
                const f = i / steps;
                const A = Math.sin((1 - f) * d) / Math.sin(d);
                const B = Math.sin(f * d) / Math.sin(d);
                const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
                const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
                const z = A * Math.sin(lat1) + B * Math.sin(lat2);
                const lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
                const lon = Math.atan2(y, x);
                arcPoints.push([lon * 180 / Math.PI, lat * 180 / Math.PI]);
            }
        }

        // Full dashed gold route line
        this.map.addSource('mission-route-source', {
            'type': 'geojson',
            'data': { 'type': 'Feature', 'geometry': { 'type': 'LineString', 'coordinates': arcPoints } }
        });
        this.map.addLayer({
            'id': 'mission-route-dashed',
            'type': 'line',
            'source': 'mission-route-source',
            'layout': { 'line-join': 'round', 'line-cap': 'round' },
            'paint': {
                'line-color': '#d4af37',
                'line-width': 3,
                'line-dasharray': [2, 3],
                'line-opacity': 0.6,
                'line-emissive-strength': 1
            }
        });

        // Solid trail that fills in behind the emoji
        this.map.addSource('mission-trail-source', {
            'type': 'geojson',
            'data': { 'type': 'Feature', 'geometry': { 'type': 'LineString', 'coordinates': [arcPoints[0], arcPoints[0]] } }
        });
        // Glow behind the solid trail
        this.map.addLayer({
            'id': 'mission-route-glow',
            'type': 'line',
            'source': 'mission-trail-source',
            'layout': { 'line-join': 'round', 'line-cap': 'round' },
            'paint': {
                'line-color': '#d4af37',
                'line-width': 14,
                'line-opacity': 0.15,
                'line-blur': 6,
                'line-emissive-strength': 1
            }
        });
        this.map.addLayer({
            'id': 'mission-route-solid',
            'type': 'line',
            'source': 'mission-trail-source',
            'layout': { 'line-join': 'round', 'line-cap': 'round' },
            'paint': {
                'line-color': '#d4af37',
                'line-width': 4,
                'line-emissive-strength': 1
            }
        });

        // Origin pin (gold pulsing dot)
        const originEl = document.createElement('div');
        originEl.style.cssText = 'width:14px; height:14px; background:#d4af37; border-radius:50%; border:2px solid #000; box-shadow: 0 0 12px rgba(212,175,55,0.6); animation: pulse 1.5s infinite;';
        this._originMarker = new mapboxgl.Marker({ element: originEl }).setLngLat(oCoords).addTo(this.map);

        // Destination pin (red dot)
        const destEl = document.createElement('div');
        destEl.style.cssText = 'width:14px; height:14px; background:#ef4444; border-radius:50%; border:2px solid #000; box-shadow: 0 0 12px rgba(239,68,68,0.6);';
        this._destMarker = new mapboxgl.Marker({ element: destEl }).setLngLat(dCoords).addTo(this.map);

        // Flying food emoji marker
        const flyEl = document.createElement('div');
        flyEl.className = 'emoji-marker flying-emoji';
        flyEl.textContent = emoji;
        flyEl.style.cssText = 'font-size:36px; pointer-events:none; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.7)); transition: none;';
        this._missionFlyingMarker = new mapboxgl.Marker({ element: flyEl })
            .setLngLat(arcPoints[0])
            .addTo(this.map);

        // Animate the emoji along the arc
        let progress = 0;
        const animSpeed = 0.004;
        const map = this.map;
        const shimmerStart = performance.now();

        const animateEmoji = () => {
            progress += animSpeed;
            if (progress > 1) progress = 1;

            const idx = Math.min(Math.floor(progress * (arcPoints.length - 1)), arcPoints.length - 1);
            this._missionFlyingMarker.setLngLat(arcPoints[idx]);

            // Update the solid trail
            const trailSlice = arcPoints.slice(0, idx + 1);
            if (trailSlice.length >= 2) {
                map.getSource('mission-trail-source').setData({
                    'type': 'Feature',
                    'geometry': { 'type': 'LineString', 'coordinates': trailSlice }
                });
            }

            // Shimmer the trail width
            const elapsed = performance.now() - shimmerStart;
            const sw = 4 + Math.sin(elapsed * 0.006) * 1.2;
            const gw = 14 + Math.sin(elapsed * 0.004) * 4;
            try {
                map.setPaintProperty('mission-route-solid', 'line-width', sw);
                map.setPaintProperty('mission-route-glow', 'line-width', gw);
                map.setPaintProperty('mission-route-glow', 'line-opacity', 0.12 + Math.sin(elapsed * 0.005) * 0.06);
            } catch(e) {}

            if (progress < 1) {
                this._missionAnimId = requestAnimationFrame(animateEmoji);
            }
            // When finished, just leave the completed trail visible
        };

        // Small delay so the route appears before the emoji starts
        setTimeout(() => {
            this._missionAnimId = requestAnimationFrame(animateEmoji);
        }, 600);
    });
};
