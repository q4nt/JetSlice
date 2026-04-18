const app = {
    map: null,

    initMap() {
        mapboxgl.accessToken = window.__MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';
        
        // Render identical static mapbox globe on the mock screen
        if (document.getElementById('map-mock')) {
            this.mapMock = new mapboxgl.Map({
                container: 'map-mock',
                style: 'mapbox://styles/mapbox/standard',
                projection: 'globe',
                zoom: 3.5,
                center: [-98.5795, 39.8283],
                pitch: 45,
                attributionControl: false
            });
            this.mapMock.on('style.load', () => {
                this.mapMock.setConfigProperty('basemap', 'theme', 'monochrome');
                this.mapMock.setConfigProperty('basemap', 'lightPreset', 'night');
                this.mapMock.setConfigProperty('basemap', 'show3dObjects', true);
            });
        }

        // Main interactive map instance
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/standard',
            projection: 'globe',
            zoom: 3.5,
            center: [-98.5795, 39.8283], // Center US
            pitch: 45,
            attributionControl: false
        });

        this.map.on('style.load', () => {
            this.map.setConfigProperty('basemap', 'theme', 'monochrome');
            this.map.setConfigProperty('basemap', 'lightPreset', 'night');
            this.map.setConfigProperty('basemap', 'show3dObjects', true);
            
            // Add trending orders layer
            this._addTrendingOrders();
        });

        // Interface fading on map interaction
        this.map.on('mousedown', () => {
            const hero = document.getElementById('active-iphone-simulator').querySelector('.hero-section');
            if (hero && !hero.classList.contains('faded')) {
                hero.classList.add('faded');
            }
        });
    },

    /**
     * Adds interactive trending food emojis to the globe
     */
    _addTrendingOrders() {
        this.trendingFeatures = [
            {
                type: 'Feature',
                properties: { emoji: '🍕', restaurant: "L'Industrie Pizzeria", origin: "104 Christopher St, New York, NY", dest: "Beverly Hills, CA", cargo: "heated", foodItem: "Signature Artisan Pizza", ratings: { yelp: '4.8', uberEats: '4.9', reddit: '10/10' }, reviewText: "\"The crust was still perfectly crisp upon arrival! Literal magic.\" - Reddit User" },
                geometry: { type: 'Point', coordinates: [-74.0041, 40.7335] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🍣', restaurant: "Sushi Roku", origin: "Los Angeles, CA", dest: "Manhattan, NY", cargo: "refrigerated", foodItem: "Premium Omakase Box", ratings: { yelp: '4.6', uberEats: '4.8', reddit: '9.5/10' }, reviewText: "\"Arrived ice cold. Tasted like I was eating it right at the sushi bar in LA!\" - Uber Eats User" },
                geometry: { type: 'Point', coordinates: [-118.2437, 34.0522] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🌯', restaurant: "La Taqueria", origin: "San Francisco, CA", dest: "Chicago, IL", cargo: "heated", foodItem: "Carne Asada Super Burrito", ratings: { yelp: '4.5', uberEats: '4.7', reddit: '9/10' }, reviewText: "\"Still piping hot and fully intact across the country. Highly recommend.\" - Yelp Reviewer" },
                geometry: { type: 'Point', coordinates: [-122.4194, 37.7749] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🍔', restaurant: "Au Cheval", origin: "Chicago, IL", dest: "Miami, FL", cargo: "heated", foodItem: "Double Cheeseburger", ratings: { yelp: '4.7', uberEats: '4.9', reddit: '10/10' }, reviewText: "\"Hands down the greatest burger to ever cross state lines.\" - Reddit User" },
                geometry: { type: 'Point', coordinates: [-87.6298, 41.8781] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🍗', restaurant: "Gus's Fried Chicken", origin: " Memphis, TN", dest: "New York, NY", cargo: "heated", foodItem: "Spicy Fried Chicken Plate", ratings: { yelp: '4.6', uberEats: '4.8', reddit: '9.5/10' }, reviewText: "\"Still perfectly crunchy. This delivery service is unbelievable.\" - Yelp Reviewer" },
                geometry: { type: 'Point', coordinates: [-90.0490, 35.1495] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🦀', restaurant: "Joe's Stone Crab", origin: "Miami, FL", dest: "Denver, CO", cargo: "refrigerated", foodItem: "Large Stone Crab Claws", ratings: { yelp: '4.4', uberEats: '4.5', reddit: '8.5/10' }, reviewText: "\"Fresh from the coast! The mustard sauce was pristine.\" - Reddit User" },
                geometry: { type: 'Point', coordinates: [-80.1918, 25.7617] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🌮', restaurant: "Torchy's Tacos", origin: "Austin, TX", dest: "Seattle, WA", cargo: "heated", foodItem: "Trailer Park Taco Set", ratings: { yelp: '4.2', uberEats: '4.5', reddit: '8/10' }, reviewText: "\"Stayed completely warm, the queso didn't congeal at all!\" - Uber Eats User" },
                geometry: { type: 'Point', coordinates: [-97.7431, 30.2672] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🍖', restaurant: "Pecan Lodge", origin: "Dallas, TX", dest: "San Francisco, CA", cargo: "heated", foodItem: "Smoked Brisket Pound", ratings: { yelp: '4.8', uberEats: '4.9', reddit: '10/10' }, reviewText: "\"Smokey, tender, melt in your mouth brisket delivered right to my door in SF.\" - Yelp Reviewer" },
                geometry: { type: 'Point', coordinates: [-96.7970, 32.7767] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🦪', restaurant: "Neptune Oyster", origin: "Boston, MA", dest: "Phoenix, AZ", cargo: "refrigerated", foodItem: "Wellfleet Oysters (Dozen, Iced)", ratings: { yelp: '4.7', uberEats: '4.8', reddit: '9.5/10' }, reviewText: "\"Tastes like they were just shucked from the Atlantic. Astounding logistics.\" - Reddit User" },
                geometry: { type: 'Point', coordinates: [-71.0589, 42.3601] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🦞', restaurant: "Luke's Lobster", origin: "Portland, ME", dest: "Las Vegas, NV", cargo: "refrigerated", foodItem: "Maine Lobster Roll (Cold)", ratings: { yelp: '4.8', uberEats: '4.7', reddit: '9/10' }, reviewText: "\"The chilled lobster meat was absolutely flawless upon arrival in the desert.\" - Uber Eats User" },
                geometry: { type: 'Point', coordinates: [-70.2568, 43.6591] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🥐', restaurant: "Cafe Du Monde", origin: "New Orleans, LA", dest: "Seattle, WA", cargo: "secure", foodItem: "Fresh Beignets & Chicory Coffee", ratings: { yelp: '4.5', uberEats: '4.8', reddit: '9/10' }, reviewText: "\"They loaded extra powdered sugar, completely flawless transport.\" - Uber Eats User" },
                geometry: { type: 'Point', coordinates: [-90.0715, 29.9511] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🍩', restaurant: "Voodoo Doughnut", origin: "Portland, OR", dest: "Miami, FL", cargo: "secure", foodItem: "Magic Dozen Box", ratings: { yelp: '4.3', uberEats: '4.6', reddit: '8.5/10' }, reviewText: "\"Not a single smudge on the frosting after flying across the entire US!\" - Yelp Reviewer " },
                geometry: { type: 'Point', coordinates: [-122.6784, 45.5152] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🌭', restaurant: "The Varsity", origin: "Atlanta, GA", dest: "Boston, MA", cargo: "heated", foodItem: "Chili Cheese Dog Combo", ratings: { yelp: '4.1', uberEats: '4.4', reddit: '8/10' }, reviewText: "\"Still steaming when I opened the box. Perfection!\" - Reddit User" },
                geometry: { type: 'Point', coordinates: [-84.3880, 33.7490] }
            },
            {
                type: 'Feature',
                properties: { emoji: '🧁', restaurant: "Cupcake Royale", origin: "Seattle, WA", dest: "Dallas, TX", cargo: "refrigerated", foodItem: "Assorted Hand-piped Cupcakes", ratings: { yelp: '4.5', uberEats: '4.8', reddit: '9/10' }, reviewText: "\"The buttercream was perfectly intact, chilled to perfection.\" - Yelp Reviewer" },
                geometry: { type: 'Point', coordinates: [-122.3321, 47.6062] }
            }
        ];

        // Store all inner markers for animation hooks
        this._emojiMarkers = [];

        // Use native DOM markers instead of text symbols for emojis to guarantee rendering
        // First load static markers, then fetch background AI recommendations!

        const renderMarkers = (featuresArray) => {
            featuresArray.forEach((feature) => {
                const outer = document.createElement('div');
                outer.className = 'emoji-marker-outer';

                const el = document.createElement('div');
                el.className = 'emoji-marker';
                el.textContent = feature.properties.emoji;
                
                outer.appendChild(el);
                this._emojiMarkers.push(el);
                
                const props = feature.properties;

                // Direct click handler - more reliable than popup.open which breaks after popup.remove()
                outer.addEventListener('click', (e) => {
                    e.stopPropagation();

                    // Hide ALL emoji markers on the map
                    document.getElementById('active-iphone-simulator').querySelectorAll('.emoji-marker-outer').forEach(m => m.style.display = 'none');
                    if (this._emojiAnimInterval) { clearInterval(this._emojiAnimInterval); this._emojiAnimInterval = null; }

                    this._activeEmoji = props.emoji;

                    const hero = document.getElementById('active-iphone-simulator').querySelector('.hero-section');
                    if (hero && !hero.classList.contains('faded')) hero.classList.add('faded');
                    const aiPanel = document.getElementById('active-iphone-simulator').querySelector('.ai-command-panel');
                    if (aiPanel) aiPanel.style.display = 'none';

                    document.getElementById('origin').value = props.origin;
                    document.getElementById('destination').value = "350 N Canal, Chicago, IL 60606";
                    const cargoSelect = document.querySelector('.item-select select');
                    for(let i = 0; i < cargoSelect.options.length; i++) {
                        if(cargoSelect.options[i].text.toLowerCase().includes(props.cargo)) {
                            cargoSelect.selectedIndex = i;
                            break;
                        }
                    }
                    const card = document.getElementById('booking-card');
                    if (card && !card.classList.contains('collapsed')) card.classList.add('collapsed');
                    this.updateSummary();
                    this.calculateLogistics(props);
                });

                new mapboxgl.Marker({ element: outer })
                    .setLngLat(feature.geometry.coordinates)
                    .addTo(this.map);

                // Add to static mock screen for aesthetic parity
                if (this.mapMock) {
                    const outerClone = document.createElement('div');
                    outerClone.className = 'emoji-marker-outer';
                    const elClone = document.createElement('div');
                    elClone.className = 'emoji-marker';
                    elClone.textContent = feature.properties.emoji;
                    outerClone.appendChild(elClone);
                    
                    new mapboxgl.Marker({ element: outerClone })
                        .setLngLat(feature.geometry.coordinates)
                        .addTo(this.mapMock);
                }
            });
        };

        // Render Hardcoded set
        renderMarkers(this.trendingFeatures);

        // Fetch Sentiment Demographics
        fetch('/api/sentiment-recommendations')
            .then(res => res.json())
            .then(data => {
                if (data && data.recommendations) {
                    const aiFeatures = data.recommendations.map(r => ({
                        type: 'Feature',
                        properties: r,
                        geometry: { type: 'Point', coordinates: r.coordinates }
                    }));
                    renderMarkers(aiFeatures);
                }
            })
            .catch(err => console.error("[JetSlice] Sentiment API fetch failed", err));

        // Initialize the app when DOM is ready
        setTimeout(() => {
            this._initIcons();
            this._initSocialHeatmap();
            this._initTelemetry(); // Start IoT simulation
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => loader.style.display = 'none', 600);
            }
        }, 1200);

        // Start random ambient animations for markers
        this._startAmbientAnimations();

        // Click on map background resets to home when an overlay is active
        this.map.on('click', (e) => {
            // Don't reset if they clicked on a marker (those have their own handlers)
            const clickedMarker = e.originalEvent.target.closest('.emoji-marker-outer, .flying-emoji');
            if (clickedMarker) return;

            const routeActive = (this._routeAnimId || this._flyingMarker);
            const bookingCard = document.getElementById('booking-card');
            const pickupSheet = document.getElementById('pickup-sheet');
            
            const isBookingOpen = bookingCard && bookingCard.style.display !== 'none' && !bookingCard.classList.contains('collapsed');
            const isPickupOpen = pickupSheet && !pickupSheet.classList.contains('hidden');
            const bossModeActive = this.map.getLayer('boss-mode-lines-layer');

            if (!routeActive && !isBookingOpen && !isPickupOpen && !bossModeActive) {
                return; // Nothing to cancel
            }

            this.goBack('home-screen');
        });
    },

    /**
     * Starts or restarts the ambient emoji marker animations
     */
    _startAmbientAnimations() {
        if (this._emojiAnimInterval) clearInterval(this._emojiAnimInterval);
        this._emojiAnimInterval = setInterval(() => {
            if (!this._emojiMarkers || this._emojiMarkers.length === 0) return;
            
            // Clear any existing anim classes on all markers
            this._emojiMarkers.forEach(el => {
                el.classList.remove('anim-bounce', 'anim-flame', 'anim-hearts', 'anim-steam', 'anim-tongue', 'anim-eat', 'anim-drizzle');
            });

            // Pick randomly between 1 and 3 markers to animate
            const numToAnimate = Math.floor(Math.random() * 3) + 1;
            const animations = ['anim-bounce', 'anim-flame', 'anim-hearts', 'anim-steam', 'anim-tongue', 'anim-eat'];
            
            for (let i = 0; i < numToAnimate; i++) {
                const randomMarker = this._emojiMarkers[Math.floor(Math.random() * this._emojiMarkers.length)];
                let randomAnim = animations[Math.floor(Math.random() * animations.length)];
                
                // Specifically inject hotdog sauce drizzle animation 
                if (randomMarker.textContent.includes('\ud83c\udf2d')) {
                    randomAnim = 'anim-drizzle';
                }
                
                // Add the animation class
                randomMarker.classList.add(randomAnim);
                
                // Auto-remove the class so it "comes and goes" smoothly
                setTimeout(() => {
                    randomMarker.classList.remove(randomAnim);
                }, 3000); // Wait 3 seconds before clearing
            }
        }, 4000);
    },

    /**
     * Initializes Mapbox custom icon images (if any)
     */
    _initIcons() {
        // Reserved for future custom marker definitions (e.g. 3D models or PNGs)
    },

    /**
     * Initializes social heatmap data and user icon markers
     */
    _initSocialHeatmap() {
        // Generate 25 random locations roughly within the US bounds
        const heatmapPoints = [];
        const cities = ['A', 'X', 'M', 'T', 'S', 'L', 'J', 'R', 'B', 'K'];
        for(let i=0; i<25; i++) {
            // US rough bounds: Lng -125 to -70, Lat 25 to 48
            const lng = -125 + Math.random() * 55;
            const lat = 25 + Math.random() * 23;
            const user = cities[Math.floor(Math.random() * cities.length)];
            heatmapPoints.push({ coords: [lng, lat], user: user });
        }

        heatmapPoints.forEach(pt => {
            const outer = document.createElement('div');
            outer.className = 'social-marker';
            outer.style.display = 'none'; // Hidden by default

            // Create a glowing heatmap blob underneath (red/orange/yellow)
            const glow = document.createElement('div');
            glow.style.cssText = `
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 80px; height: 80px;
                background: radial-gradient(circle, rgba(255,59,48,0.85) 0%, rgba(255,149,0,0.6) 30%, rgba(255,204,0,0.3) 60%, rgba(255,204,0,0) 80%);
                border-radius: 50%;
                pointer-events: none;
                mix-blend-mode: screen;
            `;

            // Create the user avatar
            const avatar = document.createElement('div');
            avatar.style.cssText = `
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 24px; height: 24px;
                border-radius: 50%;
                border: 2px solid #fff;
                background-color: #ff3b30;
                background-image: url('https://ui-avatars.com/api/?name=${pt.user}&background=121212&color=fff');
                background-size: cover;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                z-index: 2;
            `;

            outer.appendChild(glow);
            outer.appendChild(avatar);

            new mapboxgl.Marker({ element: outer })
                .setLngLat(pt.coords)
                .addTo(this.map);
        });
    },

    _initMockDriverAnimation() {
        if(!this.map || !this._activeOriginCoords) return;
        
        // Starting offset a few blocks away
        const startLng = this._activeOriginCoords[0] + 0.005;
        const startLat = this._activeOriginCoords[1] - 0.003;
        const endLng = this._activeOriginCoords[0];
        const endLat = this._activeOriginCoords[1];

        // Create sleek custom marker
        const el = document.createElement('div');
        el.className = 'uber-driver-marker';
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.background = '#121212';
        el.style.border = '2px solid var(--accent-color)';
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.boxShadow = '0 0 15px rgba(212,175,55,0.6)';
        el.innerHTML = '<ion-icon name="car-sport" style="color:var(--accent-color); font-size:18px;"></ion-icon>';

        if(this._activeDriverMarker) this._activeDriverMarker.remove();
        if(this._activeDriverAnimId) cancelAnimationFrame(this._activeDriverAnimId);

        this._activeDriverMarker = new mapboxgl.Marker({ element: el })
            .setLngLat([startLng, startLat])
            .addTo(this.map);

        let progress = 0;
        const animateDriver = () => {
            progress += 0.0003; // SLOW CREEP
            if(progress > 1) progress = 1; 
            
            const currentLng = startLng + (endLng - startLng) * progress;
            const currentLat = startLat + (endLat - startLat) * progress;
            
            if(this._activeDriverMarker) {
                this._activeDriverMarker.setLngLat([currentLng, currentLat]);
            }
            if(progress < 1) {
                this._activeDriverAnimId = requestAnimationFrame(animateDriver);
            }
        };
        this._activeDriverAnimId = requestAnimationFrame(animateDriver);
    },

    /**
     * Navigates to a specific screen ID by toggling the 'active' class
     */
    navigateTo(screenId) {
        document.getElementById('active-iphone-simulator').querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        // Trigger map zoom and driver animation for tracking screen
        if (screenId === 'tracking-screen' && this._activeOriginCoords && this.map) {
             this.map.flyTo({
                 center: this._activeOriginCoords,
                 zoom: 15,
                 pitch: 60,
                 duration: 2500,
                 essential: true
             });
             this._initMockDriverAnimation();
        }
    },

    /**
     * Handles bottom tab navigation and highlight state
     */
    navigateTab(event, screenId) {
        event.preventDefault();
        document.getElementById('active-iphone-simulator').querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        if (event.currentTarget) event.currentTarget.classList.add('active');
        
        // Handle share screen specific UI resets
        if (screenId === 'share-screen') {
            document.getElementById('active-iphone-simulator').querySelectorAll('.emoji-marker-outer').forEach(m => m.style.display = 'none');
            document.getElementById('active-iphone-simulator').querySelectorAll('.social-marker').forEach(m => m.style.display = 'none'); // Hidden default
            
            // Reset share overlays
            const hub = document.getElementById('share-hub-menu');
            const rec = document.getElementById('recording-ui');
            const bk = document.getElementById('community-back-btn');
            if (hub) hub.classList.remove('hidden');
            if (rec) rec.classList.add('hidden');
            if (bk) bk.classList.add('hidden');
        } else if (screenId !== 'home-screen') {
            document.getElementById('active-iphone-simulator').querySelectorAll('.social-marker').forEach(m => m.style.display = 'none');
            document.getElementById('active-iphone-simulator').querySelectorAll('.emoji-marker-outer').forEach(m => m.style.display = '');
        }
        
        // Leverage existing goBack logic which restores panels natively when hitting home
        this.goBack(screenId);
    },

    /**
     * Share Screen Sub-Modes 
     */
    startRecordingMode() {
        document.getElementById('share-hub-menu').classList.add('hidden');
        document.getElementById('recording-ui').classList.remove('hidden');
        // If they want to record the view, restore the original emojis and flight path
        document.getElementById('active-iphone-simulator').querySelectorAll('.emoji-marker-outer').forEach(m => m.style.display = '');
    },

    startRecordingCapture() {
        if (!this.map) return;
        
        if (this._activeOriginCoords && this._activeDestCoords) {
            
            // 1. Setup MediaRecorder on the Mapbox Canvas mapboxgl-canvas
            const canvasEl = this.map.getCanvas();
            const stream = canvasEl.captureStream(30); // 30 FPS
            this._mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            this._recordedChunks = [];
            
            this._mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this._recordedChunks.push(e.data);
                }
            };
            
            this._mediaRecorder.onstop = async () => {
                const blob = new Blob(this._recordedChunks, { type: 'video/webm' });
                const formData = new FormData();
                formData.append('video', blob, 'delivery-flight.webm');
                
                // Alert visually
                const recBtn = document.querySelector('#recording-ui > div:nth-child(3) > div:nth-child(2)');
                if (recBtn) recBtn.innerHTML = '<span class="btn-loader" style="width:16px;height:16px;border-width:2px;border-color:black;border-top-color:transparent;"></span>';
                
                console.log('[JetSlice] Uploading recording to backend social APIs...');
                try {
                    await fetch('/api/share', { method: 'POST', body: formData });
                    console.log('[JetSlice] Video Upload successful!');
                } catch(e) {
                    console.error('[JetSlice] Failed to upload video slice', e);
                } finally {
                    this.closeShareViews();
                    if (recBtn) recBtn.innerHTML = '<div style="width: 24px; height: 24px; background: #ff3b30; border-radius: 4px;"></div>';
                }
            };
            
            // 2. Start recording
            this._mediaRecorder.start();

            // Hide the red button square to make it look "recording"
            const recBtnSquare = document.querySelector('#recording-ui > div:nth-child(3) > div:nth-child(2) > div');
            if(recBtnSquare) recBtnSquare.style.borderRadius = '50%';

            // First zoom tightly into the pickup location
            this.map.flyTo({
                center: this._activeOriginCoords,
                zoom: 13,
                pitch: 65,
                duration: 2500,
                essential: true
            });
            
            // Once arrived, wait briefly and zoom out to reveal the whole route
            this.map.once('moveend', () => {
                setTimeout(() => {
                    this.map.flyTo({
                        center: [
                            (this._activeOriginCoords[0] + this._activeDestCoords[0]) / 2,
                            (this._activeOriginCoords[1] + this._activeDestCoords[1]) / 2
                        ],
                        zoom: 3.5,
                        pitch: 45,
                        duration: 4000,
                        essential: true
                    });
                    
                    // After the 4 second zoom out completes, stop recording!
                    setTimeout(() => {
                        this._mediaRecorder.stop();
                    }, 4200);
                }, 800);
            });
        }
    },

    showCommunityHeatmap() {
        document.getElementById('share-hub-menu').classList.add('hidden');
        document.getElementById('community-back-btn').classList.remove('hidden');
        // Show heat map layer markers
        document.getElementById('active-iphone-simulator').querySelectorAll('.social-marker').forEach(m => m.style.display = 'block');
    },

    closeShareViews() {
        // Return back to the share hub
        document.getElementById('recording-ui').classList.add('hidden');
        document.getElementById('community-back-btn').classList.add('hidden');
        document.getElementById('share-hub-menu').classList.remove('hidden');
        
        // Hide all markers to show clean globe again
        document.getElementById('active-iphone-simulator').querySelectorAll('.emoji-marker-outer').forEach(m => m.style.display = 'none');
        document.getElementById('active-iphone-simulator').querySelectorAll('.social-marker').forEach(m => m.style.display = 'none');
    },

    /**
     * Spotify Frontend Integration
     */
    openSpotify() {
        // Deep link to open Spotify app/web player
        window.open('https://open.spotify.com/', '_blank');
    },

    async toggleSpotifyPlay() {
        const icon = document.getElementById('spotify-play-icon');
        const isPlaying = icon.getAttribute('name') === 'pause';
        
        // Instant optimistic UI update
        icon.setAttribute('name', isPlaying ? 'play' : 'pause');
        
        try {
            const action = isPlaying ? 'pause' : 'play';
            // Hit the server endpoint to control playback via actual OAuth SDK
            await fetch(`/api/spotify/${action}`, { method: 'POST' });
        } catch(e) {
            console.error('[JetSlice] Spotify API Error:', e);
            // Revert UI on failure
            icon.setAttribute('name', isPlaying ? 'pause' : 'play');
        }
    },
    
    async handleSearch(event) {
        if (event.key === 'Enter') {
            const query = document.getElementById('cmdField').value;
            if (!query) return;
            
            try {
                // Mapbox Geocoding lookup
                const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&limit=1`);
                const data = await res.json();
                
                if (data.features && data.features.length > 0) {
                    const coords = data.features[0].center;
                    
                    // Fly to the location
                    this.map.flyTo({
                        center: coords,
                        zoom: 13,
                        pitch: 45,
                        duration: 3000,
                        essential: true
                    });
                    
                    // Drop a quick pulse marker
                    const el = document.createElement('div');
                    el.className = 'pulse-marker';
                    el.style.width = '20px';
                    el.style.height = '20px';
                    el.style.background = 'var(--accent-color)';
                    el.style.borderRadius = '50%';
                    el.style.boxShadow = '0 0 20px var(--accent-color)';
                    new mapboxgl.Marker(el).setLngLat(coords).addTo(this.map);
                    
                } else {
                    console.log("[JetSlice] Location not found.");
                }
            } catch(e) {
                console.error("[JetSlice] Geocoding failure", e);
            }
            
            // Unfocus input
            document.getElementById('cmdField').blur();
        }
    },
    
    _autocompleteTimeout: null,
    
    async handleCommandInput(event) {
        const query = event.target.value;
        const wrapper = event.target.closest('.ai-command-wrapper');
        if (!wrapper) return;
        
        const popup = wrapper.querySelector('.autocomplete-popup-container');
        if (!popup) return;
        
        if (!query || query.length < 3) {
            popup.classList.add('hidden');
            return;
        }

        if (this._autocompleteTimeout) {
            clearTimeout(this._autocompleteTimeout);
        }

        this._autocompleteTimeout = setTimeout(async () => {
            try {
                // Backend Proxy Geocoding - search actual Google Local restaurants
                const res = await fetch(`/api/autocomplete_restaurants?query=${encodeURIComponent(query)}`);
                const data = await res.json();
                
                if (data.features && data.features.length > 0) {
                    popup.innerHTML = '';
                    
                    data.features.forEach(feature => {
                        const placeName = feature.text;
                        const address = feature.place_name || 'Global Destination';
                        const isPOI = feature.place_type && feature.place_type.includes('poi');
                        
                        const item = document.createElement('div');
                        item.style.padding = '12px 16px';
                        item.style.borderBottom = '1px solid var(--border-color)';
                        item.style.cursor = 'pointer';
                        item.style.display = 'flex';
                        item.style.alignItems = 'center';
                        item.style.gap = '12px';
                        item.style.transition = 'background 0.2s';
                        
                        const iconName = isPOI ? 'restaurant-outline' : 'location-outline';
                        item.innerHTML = `
                            <ion-icon name="${iconName}" style="color: var(--accent-color); font-size: 16px; flex-shrink: 0;"></ion-icon>
                            <div style="min-width: 0; flex: 1;">
                                <div style="color: var(--text-primary); font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${placeName}</div>
                                <div style="color: var(--text-secondary); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${address}</div>
                            </div>
                        `;
                        
                        item.onclick = () => {
                            event.target.value = `${placeName}, ${address}`;
                            popup.classList.add('hidden');
                            app.handleSearch({key: 'Enter'}); // Auto-trigger search sequence
                        };
                        
                        item.onmouseenter = () => item.style.background = 'rgba(212,175,55,0.1)';
                        item.onmouseleave = () => item.style.background = 'transparent';
                        
                        popup.appendChild(item);
                    });
                    
                    // Add AI suggestive footer
                    const footer = document.createElement('div');
                    footer.style.padding = '8px 16px';
                    footer.style.fontSize = '10px';
                    footer.style.color = 'var(--text-secondary)';
                    footer.style.textAlign = 'right';
                    footer.style.textTransform = 'uppercase';
                    footer.innerHTML = '<ion-icon name="planet" style="margin-right:4px;"></ion-icon> Global Navigation System';
                    popup.appendChild(footer);

                    popup.classList.remove('hidden');
                } else {
                    popup.innerHTML = `
                        <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="document.getElementById('cmdField').value='${query}'; this.parentElement.classList.add('hidden'); app.handleSearch({key: 'Enter'});">
                            <ion-icon name="search" style="color: var(--accent-color); font-size: 16px; flex-shrink: 0;"></ion-icon>
                            <div style="color: var(--text-primary); font-size: 14px; font-weight: 500;">Search for "${query}"</div>
                        </div>
                    `;
                    
                    const footer = document.createElement('div');
                    footer.style.padding = '8px 16px';
                    footer.style.fontSize = '10px';
                    footer.style.color = 'var(--text-secondary)';
                    footer.style.textAlign = 'right';
                    footer.style.textTransform = 'uppercase';
                    footer.innerHTML = '<ion-icon name="planet" style="margin-right:4px;"></ion-icon> Global Navigation System';
                    popup.appendChild(footer);
                    
                    popup.classList.remove('hidden');
                }
            } catch (e) {
                console.error("[Autocomplete Error]", e);
            }
        }, 800); // 800ms debounce to conserve external API quotas
    },

    openDispatchModal() {
        const modal = document.getElementById('dispatch-modal');
        const sheet = modal.querySelector('.dispatch-sheet');
        if(!modal || !sheet) return;
        
        modal.classList.remove('hidden');
        // trigger animation after display block registers
        setTimeout(() => {
            modal.style.background = 'rgba(10,10,10,0.7)';
            sheet.style.transform = 'translateY(0)';
        }, 10);
    },

    closeDispatchModal() {
        const modal = document.getElementById('dispatch-modal');
        const sheet = modal.querySelector('.dispatch-sheet');
        if(!modal || !sheet) return;

        modal.style.background = 'transparent';
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 400); // match css transition speed
    },

    async simulateAIDispatch() {
        const statusIcon = document.getElementById('ai-dispatch-status');
        if(!statusIcon) return;
        
        // Block closing during transaction
        const closeBtn = document.querySelector('#dispatch-modal .dispatch-sheet ion-icon[name="close-circle"]');
        if(closeBtn) closeBtn.style.pointerEvents = 'none';
        
        statusIcon.innerHTML = `<span class="btn-loader" style="width:20px;height:20px;border-width:2px;border-color:var(--accent-color);border-top-color:transparent;"></span>`;
        
        const textP = document.querySelector('#dispatch-modal p');
        if(textP) textP.textContent = "Negotiating voice bridge...";

        try {
            // Hit the Bland AI backend bridge
            const req = await fetch('/api/dispatch-voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: '+15550198273',
                    instructions: 'Call the restaurant and secure the luxury payload.'
                })
            });
            const res = await req.json();
            console.log("[JetSlice] AI Proxy API Response:", res);

            // Trigger the internal Transcript box instead of full screen overlay
            const transcriptBox = document.getElementById('ai-transcript-box');
            const transcriptFeed = document.getElementById('ai-transcript-feed');
            
            if (transcriptBox && transcriptFeed) {
                transcriptBox.classList.remove('hidden');
                setTimeout(() => {
                    transcriptBox.style.opacity = '1';
                    transcriptBox.style.transform = 'translateY(0)';
                }, 50);
                transcriptFeed.innerHTML = ""; // reset feed
            }

            // Simulate the verbal steps visually now that backend verified
            let step = 0;
            const conversation = [
                { type: 'ai', text: 'Initiating secure outbound line to target restaurant...' },
                { type: 'human', text: 'Hello, how can I help you?' },
                { type: 'ai', text: 'I am a JetSlice digital concierge placing a VIP order for John Doe.' },
                { type: 'human', text: 'Okay, the order is confirmed and will be ready in 15 minutes.' },
                { type: 'ai', text: 'Payment injected via virtual proxy. Logistics confirmed.' }
            ];
            
            const iv = setInterval(() => {
                if(step >= conversation.length) {
                    clearInterval(iv);
                    
                    if (transcriptBox) {
                        transcriptBox.style.opacity = '0';
                        transcriptBox.style.transform = 'translateY(20px)';
                        setTimeout(() => transcriptBox.classList.add('hidden'), 400);
                    }
                    
                    app.closeDispatchModal();
                    
                    // Navigate to home then to tracking
                    app.goBack('home-screen');
                    setTimeout(() => { app.navigateTo('tracking-screen'); }, 500);
                    return;
                }
                
                const msg = conversation[step];
                if (transcriptFeed) {
                    const speakerColor = msg.type === 'ai' ? 'var(--accent-color)' : '#34c759';
                    const speakerName = msg.type === 'ai' ? 'AI (JetSlice)' : 'Correspondent';
                    const newHtml = `
                        <div style="margin-bottom:6px; animation: fadeIn 0.3s ease;">
                            <span style="color:${speakerColor}; font-weight:700; font-size:12px;">${speakerName}:</span> 
                            <span style="color:white;">${msg.text}</span>
                        </div>
                    `;
                    transcriptFeed.insertAdjacentHTML('beforeend', newHtml);
                    transcriptFeed.scrollTop = transcriptFeed.scrollHeight;
                }
                
                step++;
            }, 2500);

        } catch (e) {
            console.error("AI Dispatch Error", e);
            if(textP) textP.textContent = "AI Proxy bridge failed. Retrying...";
            statusIcon.innerHTML = `<ion-icon name="warning" style="color:red; font-size: 24px;"></ion-icon>`;
            if(closeBtn) closeBtn.style.pointerEvents = 'auto';
        }
    },

    _initTelemetry() {
        setInterval(() => {
            const tempEl = document.getElementById('telemetry-temp');
            const hmdEl = document.getElementById('telemetry-humidity');
            const trackingScreen = document.getElementById('tracking-screen');
            if(tempEl && hmdEl && trackingScreen && getComputedStyle(trackingScreen).display !== 'none') {
                const baseT = 34.1;
                const fluctuateT = baseT + (Math.random() * 0.3); // 34.1 to 34.4
                tempEl.textContent = fluctuateT.toFixed(1) + '°F';
                
                const baseH = 63;
                const fluctuateH = Math.floor(baseH + Math.random() * 3);
                hmdEl.textContent = fluctuateH + '%';
            }
        }, 2000);
    },

    triggerHitchhikeModal() {
        if(document.getElementById('jetshare-overlay')) return; // already exists

        const overlay = document.createElement('div');
        overlay.id = 'jetshare-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(10,10,10,0.6)';
        overlay.style.backdropFilter = 'blur(10px)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        
        overlay.innerHTML = `
            <div style="background: rgba(18,18,18,0.95); border: 1px solid rgba(212,175,55,0.4); padding: 30px; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.8); width: 85%; max-width: 400px; text-align: center;">
                <ion-icon name="airplane" style="font-size: 48px; color: var(--accent-color); margin-bottom: 16px;"></ion-icon>
                <h2 style="margin: 0 0 12px; font-size: 22px;">JetShare Match Found</h2>
                <p style="margin: 0 0 24px; font-size: 14px; color: var(--text-secondary); line-height: 1.5;">A private charter carrying caviar is leaving your origin city in 14 minutes. Piggyback your order onto this flight to drastically reduce transit fees.</p>
                <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 16px; border-radius: 12px; margin-bottom: 24px;">
                    <div style="text-align: left;">
                        <span style="font-size: 11px; color: var(--text-secondary); text-transform: uppercase;">Standard Freight</span>
                        <h4 style="margin: 4px 0 0; font-size: 16px; color: white; text-decoration: line-through;">$3,450</h4>
                    </div>
                    <ion-icon name="arrow-forward" style="color: var(--accent-color);"></ion-icon>
                    <div style="text-align: right;">
                        <span style="font-size: 11px; color: var(--accent-color); text-transform: uppercase;">JetShare Fee</span>
                        <h4 style="margin: 4px 0 0; font-size: 20px; color: #34c759;">$450</h4>
                    </div>
                </div>
                <button onclick="document.getElementById('jetshare-overlay').remove()" style="background: var(--accent-color); color: black; border: none; padding: 14px 100%; width: 100%; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 15px;">Accept Flight Splice</button>
            </div>
        `;
        document.getElementById('app-container').appendChild(overlay);
    },

    triggerVoiceConcierge() {
        const overlay = document.getElementById('voice-overlay');
        const textElem = document.getElementById('voice-text');
        if (!overlay || !textElem) return;

        overlay.classList.remove('hidden');
        textElem.innerHTML = "Listening...";
        
        const processStr = " I'm hosting a dinner party. Get me A5 Wagyu from Japan.";
        
        setTimeout(() => {
            let i = 0;
            textElem.innerHTML = "Listening...<br>";
            const iv = setInterval(() => {
                textElem.innerHTML += processStr.charAt(i);
                i++;
                if(i >= processStr.length) {
                    clearInterval(iv);
                    setTimeout(() => {
                        textElem.innerHTML = `<span style="color: var(--accent-color);font-weight:600;">Processing logistics...</span>`;
                        setTimeout(() => {
                            overlay.classList.add('hidden');
                            document.getElementById('cmdField').value = "A5 Wagyu Japan";
                            app.navigateTab({ preventDefault: ()=>{} }, 'search-screen');
                        }, 1200);
                    }, 500);
                }
            }, 50);
        }, 1000);
    },

    authenticateVault() {
        const btn = document.querySelector('#biometric-vault-ui button');
        const icon = document.querySelector('#biometric-vault-ui ion-icon[name="finger-print"]');
        if(!btn || !icon) return;
        
        btn.innerHTML = `<span class="btn-loader" style="width:16px;height:16px;border-width:2px;border-color:black;border-top-color:transparent;"></span> Authenticating...`;
        
        setTimeout(() => {
            const vaultUI = document.getElementById('biometric-vault-ui');
            vaultUI.style.border = "1px solid #34c759";
            vaultUI.style.background = "rgba(52, 199, 89, 0.1)";
            
            vaultUI.innerHTML = `
                <ion-icon name="lock-open" style="font-size: 48px; color: #34c759; margin-bottom: 16px;"></ion-icon>
                <h3 style="margin: 0 0 8px; font-size: 16px; color: #34c759;">Vault Unlocked</h3>
                <p style="margin: 0 0 20px; font-size: 13px; color: var(--text-secondary); text-align: center;">Thermal payload successfully disengaged.</p>
                <button onclick="alert('Mock AR Plating Guide initialized...')" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); padding: 12px 30px; border-radius: 20px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <ion-icon name="cube-outline"></ion-icon> View AR Plating Guide
                </button>
            `;
        }, 1500);
    },

    messageCourier() {
        alert('Mock Secure Comms: "Agent Smith: Ready for handoff at the private hangar."');
    },

    tipCourier() {
        const btn = document.getElementById('tip-btn');
        if (!btn) return;
        btn.innerHTML = `<span class="btn-loader" style="width:14px;height:14px;border-width:2px;border-color:var(--accent-color);border-top-color:transparent;"></span> Processing...`;
        setTimeout(() => {
            btn.innerHTML = `<ion-icon name="checkmark-circle"></ion-icon> $50 Tip Sent`;
            btn.style.background = 'rgba(52, 199, 89, 0.1)';
            btn.style.color = '#34c759';
            btn.style.borderColor = 'rgba(52, 199, 89, 0.4)';
            btn.style.pointerEvents = 'none';
        }, 1000);
    },

    /**
     * Updates the summary bar (stub to prevent TypeErrors)
     */
    updateSummary() {
         // Safe stub
    },

    /**
     * Handles back button presses
     */
    goBack(screenId) {
        this.navigateTo(screenId);
        if (screenId === 'home-screen') {
            // Restore hidden panels
            const bookingCard = document.getElementById('active-iphone-simulator').querySelector('.booking-card');
            const heroSection = document.getElementById('active-iphone-simulator').querySelector('.hero-section');
            const appHeader = document.querySelector('#home-screen .app-header');
            const aiWrapper = document.getElementById('active-iphone-simulator').querySelector('.ai-command-wrapper');
            const aiPanel = document.getElementById('active-iphone-simulator').querySelector('.ai-command-panel');
            if (bookingCard) bookingCard.style.display = 'none'; // headless DOM proxy
            if (heroSection) heroSection.style.display = '';
            if (appHeader) appHeader.style.display = '';
            if (aiWrapper) aiWrapper.style.display = '';
            if (aiPanel) aiPanel.style.display = 'flex'; // Fix: Preserve inline flex layout

            // Hide pickup sheet
            const pickupSheet = document.getElementById('pickup-sheet');
            if (pickupSheet) pickupSheet.classList.add('hidden');

            if (this.map) {
                // Restore normal map markers if returning from share
                document.getElementById('active-iphone-simulator').querySelectorAll('.social-marker').forEach(m => m.style.display = 'none');
                document.getElementById('active-iphone-simulator').querySelectorAll('.emoji-marker-outer').forEach(m => m.style.display = '');

                // Remove route layers & cancel animation
                if (this._routeAnimId) { cancelAnimationFrame(this._routeAnimId); this._routeAnimId = null; }
                if (this._flyingMarker) { this._flyingMarker.remove(); this._flyingMarker = null; }
                if (this._activeDriverMarker) { this._activeDriverMarker.remove(); this._activeDriverMarker = null; }
                if (this._activeDriverAnimId) { cancelAnimationFrame(this._activeDriverAnimId); this._activeDriverAnimId = null; }
                ['route-dashed', 'route-solid', 'route-solid-glow', 'route-plane'].forEach(id => {
                    if (this.map.getLayer(id)) this.map.removeLayer(id);
                });
                ['route-source', 'route-trail-source', 'route-plane-source'].forEach(id => {
                    if (this.map.getSource(id)) this.map.removeSource(id);
                });

                // Restore all emoji markers
                document.getElementById('active-iphone-simulator').querySelectorAll('.emoji-marker-outer').forEach(m => m.style.display = '');
                this._activeEmoji = null;

                // Hide ratings header
                const ratingsHeader = document.getElementById('ratings-header');
                if (ratingsHeader) ratingsHeader.classList.add('hidden');

                // Reset delivery plan panel
                this._resetDeliveryPanel();

                // Reset rate marketplace panel
                this._resetRateMarketplace();

                // Restart ambient marker animations
                this._startAmbientAnimations();

                this.map.flyTo({
                    center: [-98.5795, 39.8283],
                    zoom: 3.5,
                    pitch: 45,
                    bearing: 0,
                    duration: 3000,
                    essential: true
                });
            }
        }
    },

    /**
     * Handles OpenAI connectivity for the cmdField AI Search panel
     */
    async handleOpenAICommand(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const cmdField = document.getElementById('cmdField');
            const query = cmdField.value.trim();
            if(!query) return;

            // Visual Loading Status
            cmdField.value = "Consulting OpenAI...";
            cmdField.disabled = true;

            try {
                // Attempt to route through the local server's LLM pipeline if it exists (Q4NT proxy model)
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: query })
                }).catch(() => null);

                let aiResponse = "";
                if (res && res.ok) {
                    const data = await res.json();
                    aiResponse = data.response || data.text;
                } else {
                    // Fallback visual mock if Q4NT backend LLM route isn't strictly running
                    await new Promise(r => setTimeout(r, 1500));
                    aiResponse = `Extracted Intent: "${query}"<br><br>I've identified 2 Elite-tier endpoints specializing in this criteria. I've plotted their vectors. Would you like me to dispatch a courier?`;
                }

                // Render Response dynamically
                let chatRes = document.getElementById('ai-response-block');
                if(!chatRes) {
                    chatRes = document.createElement('div');
                    chatRes.id = 'ai-response-block';
                    chatRes.style.cssText = "margin-bottom: 24px; padding: 16px; border-radius: 12px; background: rgba(168, 85, 247, 0.15); border-left: 3px solid var(--accent-color); font-size: 14px; line-height: 1.5; color: white; backdrop-filter: blur(8px); animation: fadeIn 0.4s ease;";
                    cmdField.parentElement.insertAdjacentElement('afterend', chatRes);
                }
                chatRes.innerHTML = `<strong><ion-icon name="sparkles" style="margin-right: 6px;"></ion-icon> JetSlice Intelligence:</strong><br/><div style="margin-top: 8px; color: rgba(255,255,255,0.9);">${aiResponse}</div>`;
                
            } catch (err) {
                 console.error("OpenAI Error:", err);
            } finally {
                 cmdField.value = "";
                 cmdField.disabled = false;
                 cmdField.focus();
            }
        }
    },

    /**
     * Calculates combined logistics cost for all premium items and displays the aggregated pickup sheet.
     */
    activateBossMode() {
        if (!this.map) return;
        if (!this.trendingFeatures || this.trendingFeatures.length === 0) return;

        // Destination: Chicago
        const destCoords = [-87.6298, 41.8781];

        // Ensure source exists
        if (!this.map.getSource('boss-mode-lines')) {
            this.map.addSource('boss-mode-lines', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: []
                }
            });

            // Glowing layer
            this.map.addLayer({
                id: 'boss-mode-lines-glow',
                type: 'line',
                source: 'boss-mode-lines',
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': '#d4af37',
                    'line-width': 12,
                    'line-blur': 12,
                    'line-opacity': 0.4,
                    'line-emissive-strength': 1
                }
            });

            // Solid inner line
            this.map.addLayer({
                id: 'boss-mode-lines-layer',
                type: 'line',
                source: 'boss-mode-lines',
                layout: { 'line-cap': 'round', 'line-join': 'round' },
                paint: {
                    'line-color': '#ffdf73',
                    'line-width': 2,
                    'line-opacity': 1.0,
                    'line-emissive-strength': 1
                }
            });
        }

        // Create LineStrings from each feature to Chicago
        const lineFeatures = this.trendingFeatures.map(feature => {
            return {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: [feature.geometry.coordinates, destCoords]
                }
            };
        });

        this.map.getSource('boss-mode-lines').setData({
            type: 'FeatureCollection',
            features: lineFeatures
        });

        this.map.flyTo({
            center: destCoords,
            zoom: 3.5,
            pitch: 45,
            bearing: -10,
            duration: 3000,
            essential: true
        });

        // Display the standard calculation sheet
        this.calculateCollectionLogistics();
    },

    async calculateCollectionLogistics() {
        if (!this.trendingFeatures || this.trendingFeatures.length === 0) return;

        // Hide main UI elements
        const hero = document.getElementById('active-iphone-simulator').querySelector('.hero-section');
        if (hero && !hero.classList.contains('faded')) hero.classList.add('faded');
        
        let card = document.getElementById('booking-card');
        if (card && !card.classList.contains('collapsed')) card.classList.add('collapsed');

        // Hide AI search component to prevent overlap with the pickup sheet
        const aiWrapper = document.getElementById('active-iphone-simulator').querySelector('.ai-command-wrapper');
        if (aiWrapper) aiWrapper.style.display = 'none';

        // Configure the Pickup Sheet for aggregation
        document.getElementById('pickup-restaurant').textContent = "BOSS MODE";
        document.getElementById('pickup-food-item').textContent = "10 Trending VIP Items";
        
        const emojiCirc = document.getElementById('pickup-sheet-emoji');
        if (emojiCirc) {
            // Stack the food emojis like a card deck
            const topEmojis = this.trendingFeatures.slice(0, 4);
            let stackHtml = topEmojis.map((f, i) => {
                const rotation = (i - 1.5) * 12; // -18, -6, 6, 18
                const yOffset = Math.abs(i - 1.5) * 2;
                return `<span style="position: absolute; left: ${i * 12}px; top: ${yOffset}px; transform: rotate(${rotation}deg); font-size: 24px; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5)); z-index: ${4 - i}">${f.properties.emoji}</span>`;
            }).join('');
            emojiCirc.innerHTML = `<div style="position:relative; width: 70px; height: 35px; top: -5px; left: -10px;">${stackHtml}</div>`;
            emojiCirc.style.display = 'flex';
            emojiCirc.style.background = 'transparent';
        }

        // Set pending UI states
        const orderBtnSpan = document.querySelector('.order-now-btn span');
        if (orderBtnSpan) orderBtnSpan.innerHTML = 'Calculating Batch<span class="loading-dots">...</span>';
        
        document.getElementById('pickup-cost').textContent = '...';
        document.getElementById('pickup-eta').innerHTML = `<ion-icon name="time-outline" style="vertical-align: middle;"></ion-icon> Batching...`;

        const pickupSheet = document.getElementById('pickup-sheet');
        pickupSheet.classList.remove('hidden');

        // Sequentially await all API routes to avoid spamming the local Python Flask queue
        let totalCostCalc = 0;
        let dest = "350 N Canal, Chicago, IL 60606"; 

        for (const feature of this.trendingFeatures) {
            try {
                let res = await fetch(`/api/route?origin=${encodeURIComponent(feature.properties.origin)}&destination=${encodeURIComponent(dest)}&cargo=secure`);
                let data = await res.json();
                
                if (data.cost) {
                    let num = parseFloat(data.cost.replace(/[^0-9.]/g, ''));
                    if (!isNaN(num)) totalCostCalc += num;
                }
            } catch (err) {
                console.error("Batch error: ", err);
            }
        }

        // Output Final Calculation
        let formattedStr = '$' + totalCostCalc.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        
        if (orderBtnSpan) orderBtnSpan.textContent = `Order Now`;
        document.getElementById('pickup-cost').textContent = formattedStr;
        document.getElementById('pickup-eta').innerHTML = `<ion-icon name="time-outline" style="vertical-align: middle;"></ion-icon> 4h 30m`;
    },

    /**
     * Fetches real logistics data from /api/route and populates the breakdown screen
     */
    async calculateLogistics(customProps = null) {
        const origin = document.getElementById('origin').value.trim();
        const dest = document.getElementById('destination').value.trim();
        const warnTag = document.getElementById('dist-warn');
        const cargoSelect = document.getElementById('cargo-select') || document.querySelector('.item-select select');
        const dateInput = document.getElementById('delivery-date');
        const btn = document.getElementById('active-iphone-simulator').querySelector('.booking-card .primary-btn');

        let restaurantName = origin;
        let foodItem = "Premium Package";
        let ratings = null;
        let emoji = "";

        if (customProps && typeof customProps === 'object') {
            restaurantName = customProps.restaurant || origin;
            foodItem = customProps.foodItem || "Premium Package";
            ratings = customProps.ratings || null;
            emoji = customProps.emoji || "";
        } else if (typeof customProps === 'string') {
            restaurantName = customProps; // Fallback
        }

        if (!origin || !dest) return;

        // Map cargo dropdown text to API param
        const cargoMap = {
            'artisan pizza (heated)': 'heated',
            'caviar (refrigerated)': 'refrigerated',
            'secure goods': 'secure'
        };
        const cargoType = cargoMap[cargoSelect.value.toLowerCase()] || 'heated';

        // Loading state
        btn.innerHTML = '<span class="btn-loader"></span> Calculating...';
        btn.disabled = true;
        warnTag.style.display = 'none';

        const dateVal = dateInput && dateInput.value ? dateInput.value : '';
        const dateParam = dateVal ? `&date=${encodeURIComponent(dateVal)}` : '';

        // Try to get restaurant coordinates from customProps or geocode if missing
        let restLon = null, restLat = null;
        if (customProps && customProps.coordinates) {
            restLon = customProps.coordinates[0];
            restLat = customProps.coordinates[1];
        }

        try {
            let url = `/api/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&cargo=${cargoType}${dateParam}`;
            if (restLon && restLat) {
                url += `&rest_lon=${restLon}&rest_lat=${restLat}&rest_name=${encodeURIComponent(restaurantName)}`;
            }
            const resp = await fetch(url);
            const data = await resp.json();

            if (!resp.ok) {
                warnTag.querySelector('span').textContent = data.message || data.error || 'Route not available.';
                warnTag.style.display = 'flex';
                return;
            }

            // Instead of showing the logistics breakdown, draw a dashed line on the globe
            // Geocode origin and destination to get exact coordinates
            if (this.map) {
                const mapboxToken = mapboxgl.accessToken;
                const oRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origin)}.json?access_token=${mapboxToken}`);
                const oData = await oRes.json();
                const dRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(dest)}.json?access_token=${mapboxToken}`);
                const dData = await dRes.json();
                
                if (oData.features?.length > 0 && dData.features?.length > 0) {
                    const oCoords = oData.features[0].center;
                    const dCoords = dData.features[0].center;
                    
                    // Save coordinates for recording mode zooming
                    this._activeOriginCoords = oCoords;
                    this._activeDestCoords = dCoords;
                    
                    // Chain great-circle arc points for multi-leg journey (Restaurant -> Origin Airport -> Dest Airport -> Destination)
                    // We start the visual journey at the restaurant
                    let restCoords = [restLon, restLat];
                    if (!restLon) restCoords = oCoords;

                    const origAirCoords = data.route?.origin?.lon ? [data.route.origin.lon, data.route.origin.lat] : oCoords;
                    const destAirCoords = data.route?.destination?.lon ? [data.route.destination.lon, data.route.destination.lat] : dCoords;

                    const arc1 = this._greatCircleArc(restCoords, origAirCoords, 20);
                    const arc2 = this._greatCircleArc(origAirCoords, destAirCoords, 80);
                    const arc3 = this._greatCircleArc(destAirCoords, dCoords, 20);
                    const arcPoints = [...arc1, ...arc2, ...arc3];

                    const fullRouteGeoJSON = {
                        'type': 'Feature',
                        'geometry': { 'type': 'LineString', 'coordinates': arcPoints }
                    };

                    // Clean up previous layers
                    if (this._routeAnimId) { cancelAnimationFrame(this._routeAnimId); this._routeAnimId = null; }
                    if (this._flyingMarker) { this._flyingMarker.remove(); this._flyingMarker = null; }
                    ['route-dashed', 'route-solid', 'route-solid-glow', 'route-plane'].forEach(id => {
                        if (this.map.getLayer(id)) this.map.removeLayer(id);
                    });
                    ['route-source', 'route-trail-source', 'route-plane-source'].forEach(id => {
                        if (this.map.getSource(id)) this.map.removeSource(id);
                    });

                    // Full route (dashed = remaining path)
                    this.map.addSource('route-source', { 'type': 'geojson', 'data': fullRouteGeoJSON });
                    this.map.addLayer({
                        'id': 'route-dashed',
                        'type': 'line',
                        'source': 'route-source',
                        'layout': { 'line-join': 'round', 'line-cap': 'round' },
                        'paint': {
                            'line-color': 'rgba(212, 175, 55, 0.35)',
                            'line-width': 3,
                            'line-dasharray': [2, 4],
                            'line-emissive-strength': 1
                        }
                    });

                    // Solid trail (filled behind the plane)
                    this.map.addSource('route-trail-source', {
                        'type': 'geojson',
                        'data': { 'type': 'Feature', 'geometry': { 'type': 'LineString', 'coordinates': [arcPoints[0], arcPoints[0]] } }
                    });
                    // Glow layer behind the solid trail
                    this.map.addLayer({
                        'id': 'route-solid-glow',
                        'type': 'line',
                        'source': 'route-trail-source',
                        'layout': { 'line-join': 'round', 'line-cap': 'round' },
                        'paint': {
                            'line-color': '#d4af37',
                            'line-width': 12,
                            'line-opacity': 0.15,
                            'line-blur': 6,
                            'line-emissive-strength': 1
                        }
                    });
                    this.map.addLayer({
                        'id': 'route-solid',
                        'type': 'line',
                        'source': 'route-trail-source',
                        'layout': { 'line-join': 'round', 'line-cap': 'round' },
                        'paint': {
                            'line-color': '#d4af37',
                            'line-width': 4,
                            'line-emissive-strength': 1
                        }
                    });

                    // Create a DOM-based flying emoji marker
                    const flyingEmoji = this._activeEmoji || '\u2708';
                    const flyEl = document.createElement('div');
                    flyEl.className = 'emoji-marker flying-emoji';
                    flyEl.textContent = flyingEmoji;
                    flyEl.style.fontSize = '32px';
                    flyEl.style.transition = 'none';
                    flyEl.style.pointerEvents = 'none';
                    this._flyingMarker = new mapboxgl.Marker({ element: flyEl })
                        .setLngLat(arcPoints[0])
                        .addTo(this.map);

                    // Animate the plane along the arc
                    let progress = 0;
                    const speed = 0.003; // fraction per frame
                    const map = this.map;
                    const shimmerStart = performance.now();

                    const animateRoute = () => {
                        progress += speed;
                        if (progress > 1) progress = 1;

                        const idx = Math.min(Math.floor(progress * (arcPoints.length - 1)), arcPoints.length - 1);
                        const planeCoord = arcPoints[idx];

                        // Move the DOM emoji marker along the arc
                        if (this._flyingMarker) {
                            this._flyingMarker.setLngLat(planeCoord);
                        }

                        // Update solid trail to current position
                        map.getSource('route-trail-source').setData({
                            'type': 'Feature',
                            'geometry': { 'type': 'LineString', 'coordinates': arcPoints.slice(0, idx + 1) }
                        });

                        // Shimmer: pulse the solid line width subtly
                        const elapsed = performance.now() - shimmerStart;
                        const shimmer = 4 + Math.sin(elapsed * 0.006) * 1.2;
                        const glowShimmer = 12 + Math.sin(elapsed * 0.004) * 4;
                        map.setPaintProperty('route-solid', 'line-width', shimmer);
                        map.setPaintProperty('route-solid-glow', 'line-width', glowShimmer);
                        map.setPaintProperty('route-solid-glow', 'line-opacity', 0.12 + Math.sin(elapsed * 0.005) * 0.06);

                        if (progress < 1) {
                            this._routeAnimId = requestAnimationFrame(animateRoute);
                        } else {
                            // Emoji arrived! Burst celebration emojis at destination
                            this._burstCelebration(arcPoints[arcPoints.length - 1]);

                            // Continue shimmer only
                            const shimmerLoop = () => {
                                const e2 = performance.now() - shimmerStart;
                                const sw = 4 + Math.sin(e2 * 0.006) * 1.2;
                                const gw = 12 + Math.sin(e2 * 0.004) * 4;
                                try {
                                    map.setPaintProperty('route-solid', 'line-width', sw);
                                    map.setPaintProperty('route-solid-glow', 'line-width', gw);
                                    map.setPaintProperty('route-solid-glow', 'line-opacity', 0.12 + Math.sin(e2 * 0.005) * 0.06);
                                } catch(e) { return; }
                                this._routeAnimId = requestAnimationFrame(shimmerLoop);
                            };
                            this._routeAnimId = requestAnimationFrame(shimmerLoop);
                        }
                    };
                    // Start animation after a short delay so the flyTo settles
                    setTimeout(() => { this._routeAnimId = requestAnimationFrame(animateRoute); }, 1500);
                    
                    // Hide the booking card and hero so the globe route is fully visible
                    const bookingCard = document.getElementById('active-iphone-simulator').querySelector('.booking-card');
                    const heroSection = document.getElementById('active-iphone-simulator').querySelector('.hero-section');
                    const appHeader = document.querySelector('#home-screen .app-header');
                    const aiPanel = document.getElementById('active-iphone-simulator').querySelector('.ai-command-panel');
                    if (bookingCard) bookingCard.style.display = 'none';
                    if (heroSection) heroSection.style.display = 'none';
                    if (appHeader) appHeader.style.display = 'none';
                    if (aiPanel) aiPanel.style.display = 'none';

                    // Populate the compact pickup bar
                    this._pickupOrigin = origin;
                    document.getElementById('pickup-restaurant').textContent = restaurantName;
                    document.getElementById('pickup-food-item').textContent = foodItem.trim();
                    
                    if (emoji) {
                        document.getElementById('pickup-sheet-emoji').textContent = emoji;
                        document.getElementById('pickup-sheet-emoji').style.display = 'inline';
                    } else {
                        document.getElementById('pickup-sheet-emoji').style.display = 'none';
                    }

                    let dist = data && data.distance_miles ? data.distance_miles : 1000;
                    let etaDisplay = "--:-- --";
                    
                    if (data && data.legs && data.legs.length >= 3) {
                        try {
                            const flightLeg = data.legs.find(l => l.type === 'flight' || (l.flight && l.flight.arrival_time));
                            if (flightLeg && flightLeg.flight && flightLeg.flight.arrival_time) {
                                const arrivalTime = new Date(flightLeg.flight.arrival_time);
                                const dropoffLeg = data.legs.find(l => l.step === 5) || data.legs.find(l => l.step === 3) || { duration_minutes: 30 };
                                const finalEta = new Date(arrivalTime.getTime() + (dropoffLeg.duration_minutes + 30) * 60000);
                                etaDisplay = finalEta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            } else {
                                let totalMinutes = 0;
                                for (let i = 1; i <= 5; i++) {
                                    const leg = data.legs.find(l => l.step === i);
                                    if (leg && leg.duration_minutes) {
                                        totalMinutes += leg.duration_minutes;
                                    }
                                }
                                const finalEta = new Date(new Date().getTime() + totalMinutes * 60000);
                                etaDisplay = finalEta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                            }
                        } catch (e) {}
                    }
                    
                    if (etaDisplay === "--:-- --") {
                        let totalHours = (dist / 500) + 1.5;
                        let hrs = Math.floor(totalHours);
                        let mins = Math.round((totalHours - hrs) * 60);
                        etaDisplay = `${hrs}h ${mins}m`;
                    }
                    
                    document.getElementById('pickup-eta').innerHTML = `<ion-icon name="time-outline" style="vertical-align: middle;"></ion-icon> <span style="color: var(--accent-color); font-weight: 600;">${etaDisplay}</span>`;
                    
                    if (data && data.total_cost) {
                        document.getElementById('pickup-cost').textContent = "$" + Math.floor(data.total_cost).toLocaleString();
                    } else {
                        let rate = cargoType === 'secure' ? 4.00 : 2.50;
                        const finalPrice = dist * rate;
                        document.getElementById('pickup-cost').textContent = "$" + Math.floor(finalPrice).toLocaleString();
                    }
                    
                    const pickupBar = document.getElementById('pickup-sheet');
                    if (pickupBar) pickupBar.classList.remove('hidden');

                    // Show ratings header panel
                    if (ratings) {
                        document.getElementById('rh-yelp').innerHTML = `<img src="Yelp_Logo.svg.png" style="height: 24px; vertical-align: middle; margin-right: 6px; border-radius: 4px; background: rgba(255,255,255,0.95); padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"> ` + ratings.yelp;
                        document.getElementById('rh-uber').innerHTML = `<img src="uber eats.jpeg" style="height: 24px; vertical-align: middle; margin-right: 6px; border-radius: 4px; background: rgba(255,255,255,0.95); padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"> ` + ratings.uberEats;
                        document.getElementById('rh-reddit').innerHTML = `<img src="reddit.png" style="height: 24px; vertical-align: middle; margin-right: 6px; border-radius: 4px; background: rgba(255,255,255,0.95); padding: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"> ` + ratings.reddit;
                        const ratingsHeader = document.getElementById('ratings-header');
                        if (ratingsHeader) ratingsHeader.classList.remove('hidden');
                    }

                    // Show fractional jet hitchhiking modal randomly
                    setTimeout(() => {
                        if (Math.random() > 0.4) {
                            app.triggerHitchhikeModal();
                        }
                    }, 4500);

                    // Populate the delivery plan panel
                    this._populateDeliveryPanel({
                        origin: origin,
                        destination: dest,
                        restaurant: restaurantName,
                        foodItem: foodItem,
                        emoji: emoji,
                        cargoType: cargoType,
                        distance: data && data.distance_miles ? data.distance_miles : dist,
                        totalCost: data && data.total_cost ? data.total_cost : (dist * (cargoType === 'secure' ? 4.00 : 2.50)),
                        legs: data && data.legs ? data.legs : null,
                        flightData: data && data.flight ? data.flight : null,
                        oCoords: oCoords,
                        dCoords: dCoords
                    });

                    // Populate the rate marketplace panel
                    this._populateRateMarketplace({
                        origin: origin,
                        destination: dest,
                        distance: data && data.distance_miles ? data.distance_miles : dist,
                        legs: data && data.legs ? data.legs : null,
                        flightData: data && data.flights ? data.flights : null,
                        cargoType: cargoType
                    });
                    
                    this.map.flyTo({
                        center: [
                            (oCoords[0] + dCoords[0]) / 2,
                            (oCoords[1] + dCoords[1]) / 2
                        ],
                        zoom: 3.5,
                        pitch: 45,
                        duration: 3500,
                        essential: true
                    });
                }
            }
        } catch (err) {
            console.error('[JetSlice] Route API error:', err);
            warnTag.querySelector('span').textContent = 'Server unavailable. Please try again.';
            warnTag.style.display = 'flex';
        } finally {
            btn.innerHTML = 'Calculate Logistics <ion-icon name="arrow-forward-outline"></ion-icon>';
            btn.disabled = false;
        }
    },

    /**
     * Dynamically fills the logistics screen with API data
     */
    _populateLogistics(data) {
        const timeline = document.querySelector('.logistics-timeline');
        const totalCard = document.querySelector('.total-cost-card');

        // Build timeline items from legs
        let html = '';
        const iconClasses = { 
            'car-sport': 'uber', 
            'airplane': 'air', 
            'car': 'lyft', 
            'briefcase': 'service', 
            'restaurant': 'food',
            'refresh-circle': 'return'
        };

        data.legs.forEach(leg => {
            const iconClass = iconClasses[leg.icon] || 'service';
            let detail = '';
            let badges = '';

            if (leg.type === 'flight' && leg.flight) {
                detail = `${leg.flight.origin} to ${leg.flight.destination}`;
                const src = leg.flight.source === 'amadeus_live' ? 'Live API' : 'Estimated';
                badges = `<div class="flight-stats">
                    <span class="badge">United: ${src}</span>
                    ${leg.southwest_alternative ? `<span class="badge alt">Southwest: $${leg.southwest_alternative.toFixed(0)}</span>` : ''}
                </div>`;
            } else if (leg.type === 'rideshare') {
                detail = leg.label;
            } else if (leg.type === 'concierge') {
                detail = leg.includes ? leg.includes.join(' | ') : '';
            }

            html += `
                <div class="timeline-item">
                    <div class="timeline-icon ${iconClass}"><ion-icon name="${leg.icon}"></ion-icon></div>
                    <div class="timeline-content">
                        <h4>${leg.label}</h4>
                        <p>${detail}</p>
                        ${badges}
                        <span class="cost-item">$${leg.cost.toFixed(2)}</span>
                    </div>
                </div>`;
        });

        timeline.innerHTML = html;

        // Update total
        const totalRow = totalCard.querySelector('.total-row');
        totalRow.innerHTML = `
            <span>Total Upfront Cost</span>
            <h2>$${data.total_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>`;

        // Store route data for tracking screen
        this._currentRoute = data;
    },

    /**
     * Starts the tracking simulation screen
     */
    startMission() {
        this.navigateTo('tracking-screen');
        if (this.map) {
            this.map.flyTo({
                center: [-118.2437, 34.0522], // Fly to LA/Beverly Hills
                zoom: 11,
                pitch: 60,
                bearing: -20,
                duration: 5000,
                essential: true
            });
        }
    },

    /**
     * Opens Uber Eats with the restaurant search pre-filled
     */
    openUberEats() {
        const query = this._pickupOrigin || document.getElementById('origin').value.trim();
        const url = `https://www.ubereats.com/search?q=${encodeURIComponent(query)}`;
        window.open(url, '_blank');
    },

    /**
     * Opens DoorDash with the restaurant search pre-filled
     */
    openDoorDash() {
        const query = this._pickupOrigin || document.getElementById('origin').value.trim();
        const url = `https://www.doordash.com/search/store/${encodeURIComponent(query)}/`;
        window.open(url, '_blank');
    },

    /**
     * Simulates an AI agent calling the restaurant to place a pickup order
     */
    aiCallPickup() {
        const btn = document.querySelector('.pickup-btn.ai-call');
        const textEl = btn.querySelector('.pickup-btn-text span');
        const strongEl = btn.querySelector('.pickup-btn-text strong');
        const origStrong = strongEl.textContent;
        const origText = textEl.textContent;

        // Disable button during call
        btn.style.pointerEvents = 'none';
        btn.style.borderColor = 'rgba(168, 85, 247, 0.5)';
        btn.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.25)';
        strongEl.textContent = 'Calling...';
        textEl.textContent = 'Dialing restaurant';

        const steps = [
            { text: 'Ringing...', sub: 'Waiting for answer', delay: 2000 },
            { text: 'Connected', sub: 'Speaking with staff', delay: 2500 },
            { text: 'Placing Order', sub: '"1 large pizza for pickup"', delay: 3000 },
            { text: 'Order Confirmed', sub: 'Ready in ~20 minutes', delay: 2000 },
        ];

        let i = 0;
        const runStep = () => {
            if (i >= steps.length) {
                // Done
                strongEl.textContent = 'Pickup Confirmed';
                textEl.textContent = 'Ready in ~20 min';
                btn.style.borderColor = 'rgba(34, 197, 94, 0.6)';
                btn.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.2)';
                btn.querySelector('.pickup-btn-icon').style.background = 'linear-gradient(135deg, #16a34a, #22c55e)';

                // Reset after 5 seconds
                setTimeout(() => {
                    strongEl.textContent = origStrong;
                    textEl.textContent = origText;
                    btn.style.pointerEvents = '';
                    btn.style.borderColor = '';
                    btn.style.boxShadow = '';
                    btn.querySelector('.pickup-btn-icon').style.background = '';
                }, 5000);
                return;
            }
            strongEl.textContent = steps[i].text;
            textEl.textContent = steps[i].sub;
            const delay = steps[i].delay;
            i++;
            setTimeout(runStep, delay);
        };
        setTimeout(runStep, 1500);
    },

    /**
     * Calculates a great-circle arc between two coordinates for the globe projection path
     */
    _greatCircleArc(coord1, coord2, steps) {
        const arc = [];
        const lon1 = coord1[0] * Math.PI / 180;
        const lat1 = coord1[1] * Math.PI / 180;
        const lon2 = coord2[0] * Math.PI / 180;
        const lat2 = coord2[1] * Math.PI / 180;

        // If distance is very small, just return a straight line to avoid NaN
        const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)));
        if (d < 0.0001) return [coord1, coord2];

        for (let i = 0; i <= steps; i++) {
            const f = i / steps;
            const A = Math.sin((1 - f) * d) / Math.sin(d);
            const B = Math.sin(f * d) / Math.sin(d);
            const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
            const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
            const z = A * Math.sin(lat1) + B * Math.sin(lat2);
            const lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
            const lon = Math.atan2(y, x);
            arc.push([lon * 180 / Math.PI, lat * 180 / Math.PI]);
        }
        return arc;
    },

    /**
     * Calculates heading/bearing from one coordinate to another for plane icon rotation
     */
    _bearing(start, end) {
        const lon1 = start[0] * Math.PI / 180;
        const lat1 = start[1] * Math.PI / 180;
        const lon2 = end[0] * Math.PI / 180;
        const lat2 = end[1] * Math.PI / 180;
        const x = Math.cos(lat2) * Math.sin(lon2 - lon1);
        const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
        return Math.atan2(x, y) * 180 / Math.PI;
    },

    /**
     * Bursts celebration emojis at a map coordinate when delivery arrives
     */
    _burstCelebration(lngLat) {
        const celebrationEmojis = ['❤️', '😍', '🤤', '🔥', '✨'];
        const markers = [];

        celebrationEmojis.forEach((emo, i) => {
            const el = document.createElement('div');
            el.textContent = emo;
            el.style.cssText = `
                font-size: ${10 + Math.random() * 3}px;
                pointer-events: none;
                opacity: 1;
                transition: transform 2.2s cubic-bezier(0.15, 0.8, 0.3, 1), opacity 2.2s ease-out;
                will-change: transform, opacity;
            `;

            // Start slightly above the destination
            const startLng = lngLat[0];
            const startLat = lngLat[1] + 0.5;

            // Spread outward in a wide arc above the destination
            const angle = (i / celebrationEmojis.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
            const dist = 1.5 + Math.random() * 2.5; // much wider spread
            const offsetLng = startLng + Math.cos(angle) * dist;
            const offsetLat = startLat + Math.sin(angle) * dist * 0.6 + 0.5; // biased upward

            const marker = new mapboxgl.Marker({ element: el })
                .setLngLat([startLng, startLat])
                .addTo(this.map);
            markers.push(marker);

            // Animate outward after a tiny stagger
            setTimeout(() => {
                marker.setLngLat([offsetLng, offsetLat]);
                el.style.transform = `scale(${0.8 + Math.random() * 0.4})`;
                el.style.opacity = '0';
            }, 30 + i * 50);
        });

        // Clean up after animation
        setTimeout(() => {
            markers.forEach(m => m.remove());
        }, 3200);
    },

    /**
     * Initializes the luxury typography cycler loop
     */
    initHeroCycler() {
        const luxuryPhrases = [
            "Deliver<br><span>Anywhere.</span>",
            "Stratosphere<br><span>Delivery.</span>",
            "Private Jet<br><span>To Table.</span>",
            "Your Caviar,<br><span>Now Boarding.</span>",
            "Michelin Chef<br><span>In The Trunk.</span>",
            "Sommelier<br><span>Parachuting.</span>",
            "Guarded<br><span>Gourmet.</span>",
            "Sushi<br><span>Flying First Class.</span>",
            "Discreet<br><span>Drop-offs.</span>",
            "Truffle Dogs<br><span>On Standby.</span>",
            "Supersonic<br><span>Suppers.</span>"
        ];
        let currentPhraseIdx = 0;
        const heroTitle = document.getElementById('hero-title');
        
        if (!heroTitle) return;

        setInterval(() => {
            currentPhraseIdx = (currentPhraseIdx + 1) % luxuryPhrases.length;
            
            // Fade out
            heroTitle.style.opacity = '0';
            
            setTimeout(() => {
                // Swap payload
                heroTitle.innerHTML = luxuryPhrases[currentPhraseIdx];
                // Fade back in
                heroTitle.style.opacity = '1';
            }, 400); // Wait for CSS transition
            
        }, 4500); // 4.5 seconds interval
    },

    // ==========================================
    // THEME & LAYER RESTORATION SUBSYSTEM
    // ==========================================
    _themeMode: 'dark',
    _autoTheme: false,

    toggleThemeMode() {
        if (this._autoTheme) {
            this.toggleAutoTheme(); // Disable auto if manually toggled
        }
        this._themeMode = this._themeMode === 'dark' ? 'light' : 'dark';
        this._applyTheme();
    },

    toggleAutoTheme() {
        this._autoTheme = !this._autoTheme;
        const knob = document.getElementById('auto-theme-toggle-knob');
        if (this._autoTheme) {
            knob.style.transform = 'translateX(20px)';
            knob.style.backgroundColor = 'black';
            knob.parentElement.style.backgroundColor = 'var(--accent-color)';
            knob.parentElement.style.border = 'none';
            this._fetchGeolocationTheme();
        } else {
            knob.style.transform = 'translateX(0px)';
            knob.style.backgroundColor = 'var(--text-secondary)';
            knob.parentElement.style.backgroundColor = 'transparent';
            knob.parentElement.style.border = '1px solid var(--text-secondary)';
        }
    },

    _applyTheme() {
        const knob = document.getElementById('theme-toggle-knob');
        if (this._themeMode === 'light') {
            document.body.classList.add('light-theme');
            if (knob) {
                knob.style.transform = 'translateX(0px)'; 
                knob.style.backgroundColor = 'var(--text-secondary)';
                knob.parentElement.style.backgroundColor = 'transparent';
                knob.parentElement.style.border = '1px solid var(--text-secondary)';
            }
            this._setMapboxStyle('mapbox://styles/mapbox/light-v11');
        } else {
            document.body.classList.remove('light-theme');
            if (knob) {
                knob.style.transform = 'translateX(20px)';
                knob.style.backgroundColor = 'black';
                knob.parentElement.style.backgroundColor = 'var(--accent-color)';
                knob.parentElement.style.border = 'none';
            }
            this._setMapboxStyle('mapbox://styles/mapbox/dark-v11');
        }
    },

    _setMapboxStyle(styleUrl) {
        if (!this.map) return;
        
        // 1. Snapshot existing custom routing & boss mode layers
        this._layerSnapshot = { sources: {}, layers: [] };
        
        const customSourceIds = ['boss-mode-lines', 'route-source', 'route-trail-source', 'pulse-source', 'tracking-source'];
        const customLayerIds = ['boss-mode-lines-glow', 'boss-mode-lines-layer', 'route-dashed', 'route-solid-glow', 'route-solid', 'dest-pulse', 'tracking-marker'];

        const style = this.map.getStyle();
        if (style && style.sources) {
            customSourceIds.forEach(id => {
                if (style.sources[id]) this._layerSnapshot.sources[id] = style.sources[id];
            });
            style.layers.forEach(layer => {
                if (customLayerIds.includes(layer.id)) this._layerSnapshot.layers.push(layer);
            });
        }
        
        // 2. Setup exactly-once listener for when the new core style finishes loading
        this.map.once('style.load', () => {
            // Restore custom sources
            for (let [id, source] of Object.entries(this._layerSnapshot.sources)) {
                if (!this.map.getSource(id)) this.map.addSource(id, source);
            }
            // Restore custom layers
            this._layerSnapshot.layers.forEach(layer => {
                if (!this.map.getLayer(layer.id)) this.map.addLayer(layer);
            });
        });

        // 3. Trigger mapbox style shift
        this.map.setStyle(styleUrl);
    },

    _fetchGeolocationTheme() {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
                const res = await fetch(`https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&formatted=0`);
                const data = await res.json();
                if (data && data.results) {
                    const sunrise = new Date(data.results.sunrise);
                    const sunset = new Date(data.results.sunset);
                    const now = new Date();
                    
                    if (now > sunrise && now < sunset) {
                        if (this._themeMode !== 'light') {
                            this._themeMode = 'light';
                            this._applyTheme();
                        }
                    } else {
                        if (this._themeMode !== 'dark') {
                            this._themeMode = 'dark';
                            this._applyTheme();
                        }
                    }
                }
            } catch (err) {
                console.error("Sunset API failed:", err);
            }
        });
    },

    // Deep-link into 3rd party partner apps with JetSlice order referral
    openPartnerApp(partner) {
        const orderId = 'JS-' + Date.now().toString(36).toUpperCase();
        const referral = encodeURIComponent('jetslice://callback?order=' + orderId);

        const partners = {
            uber: {
                name: 'Uber',
                deepLink: `uber://?action=setPickup&client_id=jetslice&partner_referral=${referral}`,
                webFallback: 'https://m.uber.com/ul/?action=setPickup&client_id=jetslice',
                color: '#000000'
            },
            united: {
                name: 'United Airlines',
                deepLink: `united://booking?ref=jetslice&order=${orderId}`,
                webFallback: 'https://www.united.com/en/us',
                color: '#002244'
            },
            lyft: {
                name: 'Lyft',
                deepLink: `lyft://ridetype?id=lux&partner=jetslice&callback=${referral}`,
                webFallback: 'https://www.lyft.com/rider',
                color: '#FF00BF'
            }
        };

        const p = partners[partner];
        if (!p) return;

        // Show linking toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
            background: rgba(20,20,20,0.95); border: 1px solid var(--accent-color);
            color: white; padding: 14px 24px; border-radius: 14px; z-index: 9999;
            font-size: 13px; font-weight: 500; backdrop-filter: blur(12px);
            display: flex; align-items: center; gap: 10px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
            animation: slideUp 0.3s ease;
        `;
        toast.innerHTML = `
            <ion-icon name="link-outline" style="color: var(--accent-color); font-size: 18px;"></ion-icon>
            <div>
                <div>Linking to <strong>${p.name}</strong></div>
                <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">Order ${orderId} connected to JetSlice</div>
            </div>
        `;
        document.body.appendChild(toast);

        // Attempt deep link first (works on mobile), fall back to web
        setTimeout(() => {
            const start = Date.now();
            window.location.href = p.deepLink;

            // If deep link didn't open an app within 1.5s, open web fallback
            setTimeout(() => {
                if (Date.now() - start < 2000) {
                    window.open(p.webFallback, '_blank');
                }
            }, 1500);
        }, 600);

        // Remove toast after 4s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    /**
     * Populates the Delivery Plan Panel with full logistics data
     */
    _populateDeliveryPanel(planData) {
        const panel = document.getElementById('delivery-plan-panel');
        const awaiting = document.getElementById('dpp-awaiting');
        const active = document.getElementById('dpp-active-plan');
        const badge = document.getElementById('dpp-status-badge');
        const routeLabel = document.getElementById('dpp-route-label');
        const timeline = document.getElementById('dpp-timeline');
        const costSummary = document.getElementById('dpp-cost-summary');
        const dispatchBtn = document.getElementById('dpp-dispatch-btn');

        if (!panel) return;

        // Transition panel to active state
        panel.classList.remove('awaiting');
        panel.classList.add('active');
        awaiting.style.display = 'none';
        active.style.display = 'block';
        dispatchBtn.disabled = false;

        // Parse city names from full addresses
        const originCity = (planData.origin || '').split(',').slice(-2).join(',').trim() || planData.origin;
        const destCity = (planData.destination || '').split(',').slice(-2).join(',').trim() || planData.destination;

        // Header
        badge.innerHTML = '<span class="pulse-dot"></span> Plan Ready';
        routeLabel.innerHTML = `<span>${originCity}</span> <span class="arrow">&#8594;</span> <span>${destCity}</span>`;

        // Stats
        const now = new Date();
        const dist = Math.round(planData.distance || 0);
        const totalHours = (dist / 500) + 1.5;
        const hrs = Math.floor(totalHours);
        const mins = Math.round((totalHours - hrs) * 60);

        let etaStr = "--";
        let isTomorrow = false;

        // Helper: compare two Date objects by their LOCAL calendar date.
        // Using toLocaleDateString avoids the bug where UTC midnight rollover
        // causes getDate() to differ even though both times are on the same local day.
        const _isNextLocalDay = (eta, ref) => {
            return eta.toLocaleDateString('en-US') !== ref.toLocaleDateString('en-US');
        };

        // Use the flight leg (step 4) arrival_time as the definitive anchor.
        // The backend returns legs[] with the flight embedded in step 4; planData.flightData does NOT exist.
        const flightLegEta = planData.legs ? planData.legs.find(l => l.step === 4 && l.flight && l.flight.arrival_time) : null;

        if (flightLegEta) {
            const arrivalTime = new Date(flightLegEta.flight.arrival_time);
            const dropoffLeg = planData.legs.find(l => l.step === 5) || { duration_minutes: 30 };
            // ETA = plane lands + 30 min deboarding/cargo retrieval + final mile drive
            const finalEta = new Date(arrivalTime.getTime() + (dropoffLeg.duration_minutes + 30) * 60000);
            etaStr = finalEta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            isTomorrow = _isNextLocalDay(finalEta, now);
        } else if (planData.legs && planData.legs.length >= 3) {
            // No flight arrival time — sum all leg durations from now
            let totalMinutes = 0;
            for (let i = 1; i <= 5; i++) {
                const leg = planData.legs.find(l => l.step === i);
                if (leg && leg.duration_minutes) totalMinutes += leg.duration_minutes;
            }
            const finalEta = new Date(now.getTime() + totalMinutes * 60000);
            etaStr = finalEta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            isTomorrow = _isNextLocalDay(finalEta, now);
        } else {
            // Last-resort: distance-based estimate
            const finalEta = new Date(now.getTime() + (hrs * 60 + mins) * 60000);
            etaStr = finalEta.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            isTomorrow = _isNextLocalDay(finalEta, now);
        }

        document.getElementById('dpp-stat-eta').textContent = etaStr;
        const dayLabel = document.getElementById('dpp-stat-eta-day');
        if (dayLabel) {
            dayLabel.style.display = isTomorrow ? 'block' : 'none';
            // Show the actual day name when it IS tomorrow (or later)
            if (isTomorrow && flightLegEta) {
                const arrivalTime = new Date(flightLegEta.flight.arrival_time);
                const dropoffLeg = planData.legs.find(l => l.step === 5) || { duration_minutes: 30 };
                const finalEta = new Date(arrivalTime.getTime() + (dropoffLeg.duration_minutes + 30) * 60000);
                dayLabel.textContent = finalEta.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
            } else if (isTomorrow) {
                dayLabel.textContent = 'TOMORROW';
            }
        }

        // Build timeline steps
        let timelineHTML = '';
        let legCount = 0;

        // Cost tracking
        let pickupCost = 0;
        let flightCost = 0;
        let lastMileCost = 0;
        let conciergeCost = 0;

        // Trace timestamps globally
        let bestFlightTakeoff = null;
        let bestFlightLand = null;
        const flightLeg = planData.legs ? planData.legs.find(l => l.type === 'flight') : null;
        if (flightLeg && flightLeg.flight) {
            bestFlightTakeoff = new Date(flightLeg.flight.departure_time);
            bestFlightLand = new Date(flightLeg.flight.arrival_time);
        }

        if (planData.legs && planData.legs.length > 0) {
            const leg1 = planData.legs.find(l => l.step === 1) || { cost: 0, label: 'Courier Dispatch', duration_minutes: 20 };
            const leg2 = planData.legs.find(l => l.step === 2) || { cost: 0, label: 'Procurement', duration_minutes: 30 };
            const leg3 = planData.legs.find(l => l.step === 3) || { cost: 0, label: 'Transit to Airport', duration_minutes: 30 };
            const leg4 = planData.legs.find(l => l.step === 4) || { cost: 0, label: 'Flight', duration_minutes: 120 };
            const leg5 = planData.legs.find(l => l.step === 5) || { cost: 0, label: 'Delivery to Customer', duration_minutes: 30 };
            const leg6 = planData.legs.find(l => l.step === 6) || { cost: 0, label: 'Return Journey' };
            const leg7 = planData.legs.find(l => l.step === 7) || { cost: 0, label: 'Concierge Fee', includes: [] };
            const leg8 = planData.legs.find(l => l.step === 8) || { cost: 0, label: 'Courier Labor', duration_minutes: 0 };
            const leg9 = planData.legs.find(l => l.step === 9) || { cost: 0, label: 'JetSlice Platform Fee' };

            // 1. Food Procurement
            let prepEndStr = "ASAP";
            let prepStartStr = "ASAP";
            if (bestFlightTakeoff) {
                const endT = new Date(bestFlightTakeoff.getTime() - 60 * 60000);
                const startT = new Date(endT.getTime() - (leg3.duration_minutes || 30) * 60000);
                const prepStartT = new Date(startT.getTime() - (leg2.duration_minutes || 30) * 60000 - (leg1.duration_minutes || 20) * 60000);
                prepEndStr = startT.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' });
                prepStartStr = prepStartT.toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' });
            }

            const procCost = leg1.cost + leg2.cost;
            const procTime = (leg1.duration_minutes || 0) + (leg2.duration_minutes || 0);

            timelineHTML += `
                <div class="dpp-step" onclick="this.classList.toggle('expanded')" style="cursor: pointer;">
                    <div class="dpp-step-icon pickup"><ion-icon name="restaurant-outline"></ion-icon></div>
                    <div class="dpp-step-body">
                        <h4>Food Procurement <ion-icon name="chevron-down-outline" style="font-size: 10px; opacity: 0.5;"></ion-icon></h4>
                        <p>${planData.restaurant || 'Restaurant'} - ${planData.foodItem || 'Package'}</p>
                        <div class="dpp-step-meta">
                            <span class="dpp-meta-chip cost">$${procCost.toFixed(0)}</span>
                            <span class="dpp-meta-chip">${planData.cargoType === 'heated' ? 'Heated Case' : planData.cargoType === 'refrigerated' ? 'Cryo Case' : 'Secure Vault'}</span>
                            <span class="dpp-meta-chip time">~${procTime}min</span>
                        </div>
                        <div class="dpp-step-expanded">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #fff;">
                                <span>1. Dispatch: ${leg1.label}</span>
                                <span>$${leg1.cost.toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: #fff;">
                                <span>2. Prep: ${leg2.label}</span>
                                <span>~${leg2.duration_minutes || 30}m</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                                <span style="color: white; font-weight: 500;">Order: ${prepStartStr}</span>
                                <span>Ready: ${prepEndStr}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            legCount += 2; // For spacing

            // 2. Logistics & Transit
            const transitCost = leg3.cost + leg4.cost + leg5.cost;
            const transitTime = (leg3.duration_minutes || 0) + (Math.round(dist/500*60)) + (leg5.duration_minutes || 0);
            
            let transitStart = "ASAP";
            let transitEnd = "TBD";

            // Compute detailed sub-step timestamps
            let rideStartStr = "--", rideEndStr = "--";
            let tsaStartStr = "--", tsaEndStr = "--";
            let flightDepStr = "--", flightArrStr = "--";
            let deboardEndStr = "--";
            let finalMileStartStr = "--", finalMileEndStr = "--";

            if (bestFlightTakeoff && bestFlightLand) {
                // Transit Start = depart time - 1hr TSA - ride time
                const depT = new Date(bestFlightTakeoff.getTime() - 120 * 60000 - (leg3.duration_minutes || 30) * 60000);
                transitStart = depT.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                // Ride: restaurant -> airport
                rideStartStr = depT.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const rideEnd = new Date(depT.getTime() + (leg3.duration_minutes || 30) * 60000);
                rideEndStr = rideEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                // TSA / Check-in
                tsaStartStr = rideEndStr;
                tsaEndStr = bestFlightTakeoff.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                // Flight
                flightDepStr = bestFlightTakeoff.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                flightArrStr = bestFlightLand.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                // Deboarding (30 min)
                const deboardEnd = new Date(bestFlightLand.getTime() + 30 * 60000);
                deboardEndStr = deboardEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                // Final mile
                finalMileStartStr = deboardEndStr;
                const finalMileEnd = new Date(deboardEnd.getTime() + (leg5.duration_minutes || 30) * 60000);
                finalMileEndStr = finalMileEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                transitEnd = finalMileEndStr;
            }

            timelineHTML += `
                <div class="dpp-step" onclick="this.classList.toggle('expanded')" style="cursor: pointer;">
                    <div class="dpp-step-icon flight"><ion-icon name="airplane"></ion-icon></div>
                    <div class="dpp-step-body">
                        <h4>Logistics & Transit <ion-icon name="chevron-down-outline" style="font-size: 10px; opacity: 0.5;"></ion-icon></h4>
                        <p>Origin City to Customer Doorstep</p>
                        <div class="dpp-step-meta">
                            <span class="dpp-meta-chip cost">$${transitCost.toFixed(0)}</span>
                            <span class="dpp-meta-chip time">${Math.floor(transitTime/60)}h ${transitTime%60}m</span>
                        </div>
                        <div class="dpp-step-expanded">
                            <div onclick="event.stopPropagation(); this.classList.toggle('sub-expanded')" style="margin-bottom: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03);">
                                <div style="display: flex; justify-content: space-between; color: #fff;">
                                    <span>&#8226; Origin Ride: ${leg3.label} <ion-icon name="chevron-down-outline" style="font-size: 9px; opacity: 0.4; vertical-align: middle;"></ion-icon></span>
                                    <span>$${leg3.cost.toFixed(0)}</span>
                                </div>
                                <div class="sub-detail" style="display: none; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: var(--text-secondary);">
                                    <div style="display: flex; justify-content: space-between;"><span>Depart restaurant</span><span>${rideStartStr}</span></div>
                                    <div style="display: flex; justify-content: space-between;"><span>Arrive at airport</span><span>${rideEndStr}</span></div>
                                    <div style="display: flex; justify-content: space-between;"><span>Drive time</span><span>~${leg3.duration_minutes || 30}min</span></div>
                                </div>
                            </div>
                            <div onclick="event.stopPropagation(); this.classList.toggle('sub-expanded')" style="margin-bottom: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03);">
                                <div style="display: flex; justify-content: space-between; color: #fff;">
                                    <span>&#8226; Air Cargo: ${leg4.label} <ion-icon name="chevron-down-outline" style="font-size: 9px; opacity: 0.4; vertical-align: middle;"></ion-icon></span>
                                    <span>$${leg4.cost.toFixed(0)}</span>
                                </div>
                                <div class="sub-detail" style="display: none; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: var(--text-secondary);">
                                    <div style="display: flex; justify-content: space-between;"><span>TSA / Cargo Check-in</span><span>${tsaStartStr} - ${tsaEndStr}</span></div>
                                    <div style="display: flex; justify-content: space-between;"><span>Flight Departs</span><span style="color: var(--accent-color); font-weight: 600;">${flightDepStr}</span></div>
                                    <div style="display: flex; justify-content: space-between;"><span>Flight Lands</span><span style="color: var(--accent-color); font-weight: 600;">${flightArrStr}</span></div>
                                    <div style="display: flex; justify-content: space-between;"><span>Deboarding + Cargo Retrieval</span><span>+30min -> ${deboardEndStr}</span></div>
                                </div>
                            </div>
                            <div onclick="event.stopPropagation(); this.classList.toggle('sub-expanded')" style="margin-bottom: 8px; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 10px; background: rgba(255,255,255,0.03);">
                                <div style="display: flex; justify-content: space-between; color: #fff;">
                                    <span>&#8226; Final Mile: ${leg5.label} <ion-icon name="chevron-down-outline" style="font-size: 9px; opacity: 0.4; vertical-align: middle;"></ion-icon></span>
                                    <span>$${leg5.cost.toFixed(0)}</span>
                                </div>
                                <div class="sub-detail" style="display: none; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: var(--text-secondary);">
                                    <div style="display: flex; justify-content: space-between;"><span>Uber pickup at airport</span><span>${finalMileStartStr}</span></div>
                                    <div style="display: flex; justify-content: space-between;"><span>Arrive at customer</span><span style="color: #34c759; font-weight: 600;">${finalMileEndStr}</span></div>
                                    <div style="display: flex; justify-content: space-between;"><span>Drive time</span><span>~${leg5.duration_minutes || 30}min</span></div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                                <span style="color: white; font-weight: 500;">Depart: ${transitStart}</span>
                                <span>Arrive: ${transitEnd}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            legCount += 3; // For spacing

            // 3. Return Ops & Concierge
            const opCost = leg6.cost + leg7.cost + leg8.cost + leg9.cost;
            timelineHTML += `
                <div class="dpp-step" onclick="this.classList.toggle('expanded')" style="cursor: pointer;">
                    <div class="dpp-step-icon concierge"><ion-icon name="briefcase"></ion-icon></div>
                    <div class="dpp-step-body">
                        <h4>Overhead & Return Ops <ion-icon name="chevron-down-outline" style="font-size: 10px; opacity: 0.5;"></ion-icon></h4>
                        <p>Courier Return, Labor & Platinum Fees</p>
                        <div class="dpp-step-meta">
                            <span class="dpp-meta-chip cost">$${opCost.toFixed(0)}</span>
                        </div>
                        <div class="dpp-step-expanded">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #fff;">
                                <span>• Return Transport ($${leg6.cost.toFixed(0)})</span>
                            </div>
                            <div style="margin-bottom: 6px; padding-left: 10px; border-left: 2px solid rgba(255,255,255,0.2);">
                                ${leg6.includes ? leg6.includes.map(inc => `<div style="margin-bottom: 2px;">- ${inc}</div>`).join('') : ''}
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 6px; color: #fff;">
                                <span>• Concierge Fee: ${leg7.label}</span>
                                <span>$${leg7.cost.toFixed(0)}</span>
                            </div>
                            <div style="margin-top: 2px; padding-left: 10px; border-left: 2px solid rgba(255,255,255,0.2);">
                                ${leg7.includes ? leg7.includes.map(inc => `<div style="margin-bottom: 2px;">- ${inc}</div>`).join('') : ''}
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff;">
                                <span>• Courier Labor (~${Math.round(leg8.duration_minutes/60)}h)</span>
                                <span>$${leg8.cost.toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 6px; color: #fff;">
                                <span>• 20% Platform Fee</span>
                                <span style="color: var(--accent-color); font-weight: bold;">$${leg9.cost.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            legCount += 2; // For spacing

        } else {
            // Fallback: generic consolidated 3-step plan
            pickupCost = 85 + Math.round(Math.random() * 60);
            flightCost = 380 + Math.round(dist * 0.15);
            lastMileCost = 55 + Math.round(Math.random() * 40);
            conciergeCost = 250 + Math.round(dist * 0.1);
            const flightMinutes = Math.round(dist / 500 * 60);

            // 1. Procurement
            timelineHTML += `
                <div class="dpp-step" onclick="this.classList.toggle('expanded')" style="cursor: pointer;">
                    <div class="dpp-step-icon pickup"><ion-icon name="restaurant-outline"></ion-icon></div>
                    <div class="dpp-step-body">
                        <h4>Food Procurement <ion-icon name="chevron-down-outline" style="font-size: 10px; opacity: 0.5;"></ion-icon></h4>
                        <p>${planData.restaurant || 'Restaurant'} - ${planData.foodItem || 'Package'}</p>
                        <div class="dpp-step-meta">
                            <span class="dpp-meta-chip cost">$${(pickupCost / 2).toFixed(0)}</span>
                            <span class="dpp-meta-chip">${planData.cargoType === 'heated' ? 'Heated Case' : planData.cargoType === 'refrigerated' ? 'Cryo Case' : 'Secure Vault'}</span>
                            <span class="dpp-meta-chip time">~45min</span>
                        </div>
                        <div class="dpp-step-expanded">
                            <div style="display: flex; justify-content: space-between; color: white;">
                                <span>1. Courier Dispatch</span>
                                <span>$${(pickupCost / 2).toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 4px; color: white;">
                                <span>2. Prep Wait Time</span>
                                <span>~30m</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            legCount++;

            // 2. Logistics & Transit
            const comboTransit = (pickupCost / 2) + flightCost + lastMileCost;
            timelineHTML += `
                <div class="dpp-step" onclick="this.classList.toggle('expanded')" style="cursor: pointer;">
                    <div class="dpp-step-icon flight"><ion-icon name="airplane"></ion-icon></div>
                    <div class="dpp-step-body">
                        <h4>Logistics & Transit <ion-icon name="chevron-down-outline" style="font-size: 10px; opacity: 0.5;"></ion-icon></h4>
                        <p>Origin City to Customer Doorstep</p>
                        <div class="dpp-step-meta">
                            <span class="dpp-meta-chip cost">$${comboTransit.toFixed(0)}</span>
                            <span class="dpp-meta-chip time">ETA: ${Math.floor(flightMinutes / 60)}h ${flightMinutes % 60}m</span>
                        </div>
                        <div class="dpp-step-expanded">
                            <div style="display: flex; justify-content: space-between; color: white; margin-bottom: 4px;">
                                <span>• Origin Ride</span>
                                <span>$${(pickupCost / 2).toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: white; margin-bottom: 4px;">
                                <span>• Air Cargo</span>
                                <span>$${flightCost.toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: white;">
                                <span>• Final Mile Dropoff</span>
                                <span>$${lastMileCost.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            legCount++;

            // 3. Ops & Return
            const laborCostF = comboTransit * 0.15;
            const opCostF = flightCost * 0.8 + 80 + conciergeCost + laborCostF;
            const platFeeF = (comboTransit + opCostF) * 0.2;

            timelineHTML += `
                <div class="dpp-step" onclick="this.classList.toggle('expanded')" style="cursor: pointer;">
                    <div class="dpp-step-icon concierge"><ion-icon name="briefcase"></ion-icon></div>
                    <div class="dpp-step-body">
                        <h4>Overhead & Return Ops <ion-icon name="chevron-down-outline" style="font-size: 10px; opacity: 0.5;"></ion-icon></h4>
                        <p>Courier Return, Labor & Platinum Fees</p>
                        <div class="dpp-step-meta">
                            <span class="dpp-meta-chip cost">$${(opCostF + platFeeF).toFixed(0)}</span>
                        </div>
                        <div class="dpp-step-expanded">
                            <div style="display: flex; justify-content: space-between; color: white; margin-bottom: 4px;">
                                <span>• Return Journey</span>
                                <span>~ $${(opCostF - conciergeCost - laborCostF).toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; color: white;">
                                <span>• Concierge Fee</span>
                                <span>$${conciergeCost.toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); color: #fff;">
                                <span>• Courier Labor (~${Math.round(flightMinutes/60 + 2)}h)</span>
                                <span>$${laborCostF.toFixed(0)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 6px; color: #fff;">
                                <span>• 20% Platform Fee</span>
                                <span style="color: var(--accent-color); font-weight: bold;">$${platFeeF.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            legCount++;
        }

        timeline.innerHTML = timelineHTML;

        // Cost breakdown synchronized exactly with the primary execution panel (backend source of truth)
        let groundTotal = 0, airTotal = 0, dynamicConcierge = 0, estTaxes = 0, courierLabor = 0;
        
        if (planData.legs && planData.legs.length > 0) {
            groundTotal = (planData.legs.find(l => l.step === 1)?.cost || 0) + 
                          (planData.legs.find(l => l.step === 3)?.cost || 0) + 
                          (planData.legs.find(l => l.step === 5)?.cost || 0) + 
                          (planData.legs.find(l => l.step === 6)?.cost || 0); // Ground return ride
            airTotal = (planData.legs.find(l => l.step === 4)?.cost || 0);
            dynamicConcierge = (planData.legs.find(l => l.step === 7)?.cost || 0);
            courierLabor = (planData.legs.find(l => l.step === 8)?.cost || 0);
            estTaxes = (planData.legs.find(l => l.step === 9)?.cost || 0);
        } else {
            groundTotal = (pickupCost || 85) + (lastMileCost || 55);
            airTotal = (flightCost || 380);
            dynamicConcierge = conciergeCost || 250;
            courierLabor = 150;
            estTaxes = ((groundTotal + airTotal + dynamicConcierge + courierLabor) * 0.2);
        }

        const grandTotal = Math.round(planData.total_cost || (groundTotal + airTotal + dynamicConcierge + courierLabor + estTaxes));

        costSummary.innerHTML = `
            <div style="font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600;">Fee Breakdown</div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">
                <span>Ground Transport (Orig & Dest)</span>
                <span>$${groundTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">
                <span>Premium Flight Cargo</span>
                <span>$${airTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">
                <span>Concierge & Handling</span>
                <span>$${dynamicConcierge.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">
                <span>Courier Labor Rate ($50/hr)</span>
                <span>$${courierLabor.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 4px; padding-top: 4px; border-top: 1px solid rgba(255,255,255,0.05);">
                <span>JetSlice Service Fee (20%)</span>
                <span>$${estTaxes.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>`;

        document.getElementById('dpp-total-cost').textContent = '$' + grandTotal.toLocaleString();

        // Scroll content to top
        document.getElementById('dpp-content').scrollTop = 0;

        console.log('[JetSlice] Delivery Plan Panel populated:', planData.origin, '->', planData.destination);
    },

    /**
     * Resets the Delivery Plan Panel to its awaiting state
     */
    _resetDeliveryPanel() {
        const panel = document.getElementById('delivery-plan-panel');
        const awaiting = document.getElementById('dpp-awaiting');
        const active = document.getElementById('dpp-active-plan');
        const badge = document.getElementById('dpp-status-badge');
        const routeLabel = document.getElementById('dpp-route-label');
        const dispatchBtn = document.getElementById('dpp-dispatch-btn');

        if (!panel) return;

        panel.classList.add('awaiting');
        panel.classList.remove('active');
        if (awaiting) awaiting.style.display = '';
        if (active) active.style.display = 'none';
        if (badge) badge.innerHTML = '<span class="pulse-dot"></span> Awaiting Route';
        if (routeLabel) routeLabel.innerHTML = '<span>Select a route to generate plan</span>';
        if (dispatchBtn) dispatchBtn.disabled = true;
    },



    /**
     * Populates the Rate Marketplace panel with flight and ride options
     */
    _populateRateMarketplace(routeData) {
        const panel = document.getElementById('rate-marketplace-panel');
        const awaiting = document.getElementById('rmp-awaiting');
        const active = document.getElementById('rmp-active');
        const badge = document.getElementById('rmp-status-badge');
        const routeLabel = document.getElementById('rmp-route-label');
        const flightList = document.getElementById('rmp-flight-list');
        const pickupRides = document.getElementById('rmp-pickup-rides');
        const deliveryRides = document.getElementById('rmp-delivery-rides');
        const bookBtn = document.getElementById('rmp-book-btn');
        const savingsText = document.getElementById('rmp-savings-text');

        if (!panel) return;

        panel.classList.remove('awaiting');
        panel.classList.add('active');
        awaiting.style.display = 'none';
        active.style.display = 'block';
        bookBtn.disabled = false;

        // Parse airport codes from origin/dest
        const airportMap = {
            'new york': 'JFK', 'manhattan': 'JFK', 'brooklyn': 'JFK',
            'los angeles': 'LAX', 'hollywood': 'LAX', 'beverly hills': 'LAX',
            'chicago': 'ORD', 'san francisco': 'SFO', 'miami': 'MIA',
            'dallas': 'DFW', 'austin': 'AUS', 'houston': 'IAH',
            'seattle': 'SEA', 'portland': 'PDX', 'boston': 'BOS',
            'atlanta': 'ATL', 'denver': 'DEN', 'phoenix': 'PHX',
            'new orleans': 'MSY', 'memphis': 'MEM', 'nashville': 'BNA',
            'philadelphia': 'PHL', 'detroit': 'DTW', 'minneapolis': 'MSP'
        };
        const getAirport = (loc) => {
            const lc = (loc || '').toLowerCase();
            for (const [city, code] of Object.entries(airportMap)) {
                if (lc.includes(city)) return code;
            }
            return lc.substring(0, 3).toUpperCase();
        };
        const originCode = getAirport(routeData.origin);
        const destCode = getAirport(routeData.destination);
        const dist = Math.round(routeData.distance || 1000);
        const flightMins = Math.round(dist / 500 * 60);
        const flightHrs = Math.floor(flightMins / 60);
        const flightRemMins = flightMins % 60;

        // Header
        badge.innerHTML = '<span class="pulse-dot"></span> ' + 8 + ' Providers';
        routeLabel.innerHTML = `<span>${originCode}</span> <span class="arrow">&#8594;</span> <span>${destCode}</span> <span style="margin-left:auto;font-size:11px;color:var(--text-secondary)">${dist.toLocaleString()} mi</span>`;

        // Generate flight options
        let flights = [];
        
        if (routeData.flightData && routeData.flightData.length > 0) {
            // Live SerpApi data or formatted Mock data from backend
            flights = routeData.flightData;
        } else {
            // Unconnected Math Fallback
            const basePrice = 280 + Math.round(dist * 0.12);
            const timeOffset = Math.floor(Math.random() * 4);
            flights = [
                { airline: 'Google Flights', code: 'GF', color: '#4285F4', price: Math.round(basePrice * 0.88), stops: 0, dept: `${6 + timeOffset}:15 AM`, cabin: 'Economy', source: 'Google', flightNum: 'Aggregated' },
                { airline: 'United Airlines', code: 'UA', color: '#005DAA', price: Math.round(basePrice * 1.05), stops: 0, dept: `${7 + timeOffset}:30 AM`, cabin: 'First Class Cargo', source: 'Amadeus API', flightNum: 'UA ' + (1200 + Math.floor(Math.random() * 800)) },
                { airline: 'Southwest Airlines', code: 'WN', color: '#E24726', price: Math.round(basePrice * 0.78), stops: 1, dept: `${6 + timeOffset}:45 AM`, cabin: 'Wanna Get Away', source: 'SerpAPI', flightNum: 'WN ' + (3000 + Math.floor(Math.random() * 500)) },
                { airline: 'JetBlue Airways', code: 'B6', color: '#0033A0', price: Math.round(basePrice * 0.85), stops: 0, dept: `${8 + timeOffset}:00 AM`, cabin: 'Blue Extra', source: 'SerpAPI', flightNum: 'B6 ' + (600 + Math.floor(Math.random() * 300)) },
                { airline: 'Delta Air Lines', code: 'DL', color: '#003A70', price: Math.round(basePrice * 1.12), stops: 0, dept: `${9 + timeOffset}:10 AM`, cabin: 'Delta One Cargo', source: 'SerpAPI', flightNum: 'DL ' + (400 + Math.floor(Math.random() * 600)) },
                { airline: 'American Airlines', code: 'AA', color: '#B61F23', price: Math.round(basePrice * 1.02), stops: 1, dept: `${7 + timeOffset}:55 AM`, cabin: 'Business Cargo', source: 'SerpAPI', flightNum: 'AA ' + (700 + Math.floor(Math.random() * 500)) },
                { airline: 'Spirit Airlines', code: 'NK', color: '#FFD200', price: Math.round(basePrice * 0.55), stops: 2, dept: `${5 + timeOffset}:30 AM`, cabin: 'Bare Fare + Cargo', source: 'Scraped', flightNum: 'NK ' + (100 + Math.floor(Math.random() * 400)) },
                { airline: 'Frontier Airlines', code: 'F9', color: '#004225', price: Math.round(basePrice * 0.60), stops: 1, dept: `${6 + timeOffset}:00 AM`, cabin: 'Economy + Add-on', source: 'Scraped', flightNum: 'F9 ' + (500 + Math.floor(Math.random() * 300)) }
            ];
        }

        // Build Flight & Ride unified packages
        let unifiedPackages = [];
        const now = new Date();

        // Build Ride Options
        const buildRideCard = (name, vehicle, bgColor, icon, baseMin, baseMax, etaMin, etaMax, surge) => {
            const price = baseMin + Math.round(Math.random() * (baseMax - baseMin));
            const eta = etaMin + Math.round(Math.random() * (etaMax - etaMin));
            const isBest = !surge && price === baseMin;
            return { name, vehicle, bgColor, icon, price, eta, surge, isBest };
        };
        const deliveryOptions = [
            buildRideCard('Uber Black', 'Premium Sedan', '#000', 'car-sport', 70, 130, 3, 8, Math.random() > 0.7),
            buildRideCard('UberX', 'Standard Vehicle', '#222', 'car', 28, 55, 2, 6, false),
            buildRideCard('Uber XL', 'SUV / Minivan', '#333', 'bus', 45, 85, 4, 10, false),
            buildRideCard('Lyft Lux', 'Premium Vehicle', '#FF00BF', 'car-sport', 65, 125, 3, 9, false),
            buildRideCard('Yellow Cab', 'Metered Taxi', '#F7C948', 'car', 38, 80, 1, 5, false)
        ];

        flights.forEach(f => {
            const topRides = deliveryOptions.filter(r => r.name.includes('Black') || r.name.includes('Lux'));
            const ride = topRides[Math.floor(Math.random() * topRides.length)];

            // Parse flight departure time (e.g. "6:15 AM", "12:30 PM")
            const timeParts = f.dept.match(/(\d+):(\d+)\s+(AM|PM)/i);
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const ampm = timeParts[3].toUpperCase();
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;

            const deptDate = new Date(now);
            deptDate.setHours(hours, minutes, 0, 0);

            // Calculation
            const flightDurMins = flightMins + (f.stops * 45);
            const standardRideDurMins = ride.eta + 25; 
            const totalDurMins = flightDurMins + standardRideDurMins;

            const arrivalDate = new Date(deptDate.getTime() + totalDurMins * 60000);
            const arrStr = arrivalDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            const totalCost = f.price + ride.price;

            unifiedPackages.push({
                flight: f,
                ride: ride,
                totalCost: totalCost,
                deptDate: deptDate,
                arrivalDate: arrivalDate,
                arrStr: arrStr,
                totalDurMins: totalDurMins
            });
        });

        // Sort chronologically by Arrival Time
        unifiedPackages.sort((a, b) => a.arrivalDate - b.arrivalDate);

        // Calculate cheapest and most expensive purely on Total Cost
        const cheapest = unifiedPackages.reduce((a, b) => a.totalCost < b.totalCost ? a : b);
        const mostExpensive = unifiedPackages.reduce((a, b) => a.totalCost > b.totalCost ? a : b);

        let scheduleHTML = '';
        unifiedPackages.forEach((pkg, index) => {
            const isBest = pkg === cheapest;
            const dh = Math.floor(pkg.totalDurMins / 60);
            const dm = pkg.totalDurMins % 60;
            const stopsText = pkg.flight.stops === 0 ? 'Nonstop' : (pkg.flight.stops === 1 ? '1 Stop' : pkg.flight.stops + ' Stops');
            const stopsClass = pkg.flight.stops === 0 ? 'nonstop' : '';

            scheduleHTML += `
                <div class="rmp-flight-card${isBest ? ' best-deal selected' : ''}" style="display:flex; flex-direction:column; gap:8px;">
                    <div class="rmp-fc-top" style="align-items: flex-start; justify-content: space-between;">
                        <div class="rmp-fc-time" style="display: flex; flex-direction: column;">
                            <h4 style="margin: 0; font-size: 22px; font-weight: 700; color: white; letter-spacing: -0.5px;">${pkg.arrStr}</h4>
                            <span style="font-size: 12px; color: var(--accent-color); margin-top: 2px; text-transform: uppercase; letter-spacing: 1px;">Est. Delivery</span>
                        </div>
                        <div class="rmp-fc-price${isBest ? ' best' : ''}" style="text-align: right;">
                            <span class="amount">$${pkg.totalCost}</span>
                            <span class="per">Total</span>
                        </div>
                    </div>
                    
                    <div class="rmp-fc-route" style="margin: 8px 0 12px 0;">
                        <span class="rmp-fc-code">${originCode}</span>
                        <div class="rmp-fc-route-line">
                            <span class="duration">${dh}h ${dm}m total</span>
                            <div class="line"></div>
                            <span class="stops ${stopsClass}"><ion-icon name="airplane"></ion-icon> &nbsp;+&nbsp; <ion-icon name="car-sport"></ion-icon></span>
                        </div>
                        <span class="rmp-fc-code dest">HOME</span>
                    </div>

                    <!-- Nested Leg 1: Flight -->
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="background: ${pkg.flight.color}; width: 26px; height: 26px; border-radius: 6px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                                <ion-icon name="airplane" style="color:white; font-size:14px;"></ion-icon>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-start;">
                                <div style="font-size:13px; color:white; font-weight:600;">${pkg.flight.airline}</div>
                                <div style="font-size:11px; color:var(--text-secondary);"><span style="color:#fff;">${pkg.flight.dept}</span> Departure • ${stopsText}</div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:13px; color:white; font-weight:600;">$${pkg.flight.price}</div>
                            <div style="font-size:11px; color:var(--text-secondary);">${pkg.flight.cabin}</div>
                        </div>
                    </div>

                    <!-- Nested Leg 2: Driver -->
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 8px 10px; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="background: ${pkg.ride.bgColor}; width: 26px; height: 26px; border-radius: 6px; display:flex; align-items:center; justify-content:center; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
                                <ion-icon name="car-sport" style="color:white; font-size:14px;"></ion-icon>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-start;">
                                <div style="font-size:13px; color:white; font-weight:600;">Courier: ${pkg.ride.name}</div>
                                <div style="font-size:11px; color:var(--text-secondary);">Final Mile Connect</div>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:13px; color:white; font-weight:600;">$${pkg.ride.price}</div>
                            <div style="font-size:11px; color:var(--text-secondary);">${pkg.ride.vehicle}</div>
                        </div>
                    </div>
                </div>`;
        });
        
        const scheduleList = document.getElementById('rmp-schedule-list');
        if (scheduleList) scheduleList.innerHTML = scheduleHTML;

        // Savings calculation
        const savings = mostExpensive.totalCost - cheapest.totalCost;
        savingsText.textContent = `Save up to $${savings} by choosing the best schedule value`;

        document.getElementById('rmp-content').scrollTop = 0;
        console.log('[JetSlice] Schedule populated:', originCode, '->', destCode);
    },

    /**
     * Resets the Rate Marketplace panel to awaiting state
     */
    _resetRateMarketplace() {
        const panel = document.getElementById('rate-marketplace-panel');
        const awaiting = document.getElementById('rmp-awaiting');
        const active = document.getElementById('rmp-active');
        const badge = document.getElementById('rmp-status-badge');
        const routeLabel = document.getElementById('rmp-route-label');
        const bookBtn = document.getElementById('rmp-book-btn');
        const savingsText = document.getElementById('rmp-savings-text');

        if (!panel) return;

        panel.classList.add('awaiting');
        panel.classList.remove('active');
        if (awaiting) awaiting.style.display = '';
        if (active) active.style.display = 'none';
        if (badge) badge.innerHTML = '<span class="pulse-dot"></span> Scanning';
        if (routeLabel) routeLabel.innerHTML = '<span>Awaiting route data</span>';
        if (bookBtn) bookBtn.disabled = true;
        if (savingsText) savingsText.textContent = 'Select options to compare savings';
    }
};

function bootJetSlice() {
    if (window.__MAPBOX_TOKEN !== undefined) {
        app.initMap();
    } else {
        document.addEventListener('JetSliceConfigReady', () => app.initMap());
    }

    // Hide the wing logo on first UI click
    const wing = document.getElementById('jetslice-wing');
    if (wing) {
        const hideWing = () => {
            wing.style.opacity = '0';
            wing.style.transform = 'translateX(-10px)';
            setTimeout(() => { wing.style.display = 'none'; }, 400);
        };
        const appCont = document.getElementById('active-iphone-simulator').querySelector('.app-container');
        if (appCont) appCont.addEventListener('click', hideWing, { once: true });
    }
}

// Initialize listeners when DOM is ready, but defer Mapbox until API token loads
document.addEventListener('DOMContentLoaded', bootJetSlice);
