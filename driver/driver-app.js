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
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const target = document.getElementById(screenId);
        if (target) target.classList.add('active');
        if (e.currentTarget) e.currentTarget.classList.add('active');
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
            bar.querySelector('span').textContent = "You're offline";
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

    // ── Order Modal ──
    showOrderModal(order) {
        this._pendingOrder = order;
        const modal = document.getElementById('orderModal');
        document.getElementById('modalPay').textContent = `$${order.pay}`;
        document.getElementById('modalPickup').textContent = order.pickup;
        document.getElementById('modalPickupDetail').textContent = order.away;
        document.getElementById('modalAirport').textContent = order.airport;
        document.getElementById('modalFlight').textContent = order.flight;
        document.getElementById('modalCargo').textContent = order.cargo;
        document.getElementById('modalETA').textContent = order.eta;
        document.getElementById('modalDist').textContent = order.dist;
        modal.classList.remove('hidden');

        // Countdown
        let seconds = 30;
        const countdownEl = document.getElementById('modalCountdown');
        clearInterval(this.modalTimer);
        this.modalTimer = setInterval(() => {
            seconds--;
            countdownEl.textContent = `${seconds}s`;
            if (seconds <= 0) { this.dismissOrder(); }
        }, 1000);
    },

    dismissOrder() {
        clearInterval(this.modalTimer);
        document.getElementById('orderModal').classList.add('hidden');
        this._pendingOrder = null;
    },

    acceptOrder() {
        clearInterval(this.modalTimer);
        const order = this._pendingOrder;
        if (!order) return;

        this.activeOrder = order;
        document.getElementById('orderModal').classList.add('hidden');

        // Show active delivery card
        const card = document.getElementById('activeDeliveryCard');
        card.classList.remove('hidden');
        document.getElementById('activePickup').textContent = order.pickup;
        document.getElementById('activeDropoff').textContent = order.airport;
        document.getElementById('activePay').textContent = `$${order.pay}`;

        // Update status bar
        const bar = document.getElementById('statusBar');
        bar.querySelector('span').textContent = 'En route to pickup';

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
    }
};
