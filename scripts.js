// --- Mapbox Access Token ---
mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';

// --- Color Palette for Displacement Risk Groups ---
const riskColors = {
    Crisis: '#dd4000',
    Emigrating: '#f27407',
    Destination: '#f2a007',
    Stable: '#f7c320'
};

// --- Initialize Mapbox Map ---
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/j00by/cmbqvtons000201qlgcox1gi5',
    center: [-75.32569, 40.15205],
    zoom: 7.75,
    minZoom: 7.75,
    maxBounds: [
        [-78.27621, 38.89837],
        [-72.85168, 41.38302]
    ]
});

// --- Displacement Risk Group Layers ---
window.parcelLayers = [
    { id: 'stable', tileset: 'j00by.dxxv2rrd', color: '#f7c320' },
    { id: 'emigrating', tileset: 'j00by.38l572x2', color: '#f27407' },
    { id: 'crisis', tileset: 'j00by.cpk925km', color: '#dd4000' },
    { id: 'destination', tileset: 'j00by.2pl97lme', color: '#f2a007' }
];

map.on('load', () => {
    // 1. Add parcel layers
    parcelLayers.forEach(layer => {
        map.addSource(layer.id, { type: 'vector', url: `mapbox://${layer.tileset}` });
        map.addLayer({
            id: `${layer.id}-fill`,
            type: 'fill',
            source: layer.id,
            'source-layer': 'parcels',
            minzoom: 7.5,
            paint: { 'fill-color': layer.color, 'fill-opacity': 0.9 }
        });
        map.addLayer({
            id: `${layer.id}-outline`,
            type: 'line',
            source: layer.id,
            'source-layer': 'parcels',
            minzoom: 7.5,
            paint: { 'line-color': '#333', 'line-width': 0.2 }
        });
    });

    // 2. FEMA Floodplain Layer (Toggle)
    const toggle = document.getElementById('toggle-floodplain');
    if (toggle) {
        toggle.checked = false;
        toggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                if (!map.getSource('fema_rutgers')) {
                    map.addSource('fema_rutgers', { type: 'vector', url: 'mapbox://j00by.77lcuflb' });
                    map.addLayer({
                        id: 'fema_rutgers-fill',
                        type: 'fill',
                        source: 'fema_rutgers',
                        'source-layer': 'floodplain',
                        paint: {
                            'fill-color': '#0054ff',
                            'fill-opacity': 0.8,
                            'fill-antialias': true
                        }
                    });
                } else {
                    map.setLayoutProperty('fema_rutgers-fill', 'visibility', 'visible');
                    map.setLayoutProperty('fema_rutgers-outline', 'visibility', 'visible');
                }
            } else {
                if (map.getLayer('fema_rutgers-fill')) map.setLayoutProperty('fema_rutgers-fill', 'visibility', 'none');
                if (map.getLayer('fema_rutgers-outline')) map.setLayoutProperty('fema_rutgers-outline', 'visibility', 'none');
            }
        });
    }

    // 3. County Outlines (White)
    map.addSource('nj_counties', { type: 'vector', url: 'mapbox://j00by.d08646su' });
    map.addLayer({
        id: 'nj_counties-outline',
        type: 'line',
        source: 'nj_counties',
        'source-layer': 'county_boundaries',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#fff', 'line-width': 1 }
    });

    // 4. Hospitals (toggle)
    map.addSource('hospitals', { type: 'geojson', data: '/data/hospitals.geojson' });
    map.loadImage('/img/hospitals.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('hospital-icon')) {
            map.addImage('hospital-icon', image, { sdf: false });
        }
        map.addLayer({
            id: 'hospitals-symbol',
            type: 'symbol',
            source: 'hospitals',
            layout: {
                'icon-image': 'hospital-icon',
                'icon-allow-overlap': true,
                'icon-size': [
                    'interpolate', ['linear'], ['zoom'],
                    7, 0.18, 9, 0.26, 11, 0.42, 13, 0.65, 15, 1.0
                ],
                'visibility': 'none'
            }
        });
    });

    // 5. Schools (toggle)
    map.addSource('schools', { type: 'geojson', data: '/data/schools.geojson' });
    map.loadImage('/img/schools.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('schools-icon')) {
            map.addImage('schools-icon', image, { sdf: false });
        }
        map.addLayer({
            id: 'schools-symbol',
            type: 'symbol',
            source: 'schools',
            layout: {
                'icon-image': 'schools-icon',
                'icon-allow-overlap': true,
                'icon-size': [
                    'interpolate', ['linear'], ['zoom'],
                    7, 0.16, 9, 0.22, 11, 0.32, 13, 0.50, 15, 0.8
                ],
                'visibility': 'none'
            }
        });
    });


    // 6. Parks (toggle)
    map.addSource('parks', { type: 'geojson', data: '/data/parks.geojson' });
    map.loadImage('/img/parks.png', (error, image) => {
        if (error) throw error;
        if (!map.hasImage('parks-icon')) {
            map.addImage('parks-icon', image, { sdf: false });
        }
        map.addLayer({
            id: 'parks-symbol',
            type: 'symbol',
            source: 'parks',
            layout: {
                'icon-image': 'parks-icon',
                'icon-allow-overlap': true,
                'icon-size': [
                    'interpolate', ['linear'], ['zoom'],
                    7, 0.16, 9, 0.22, 11, 0.32, 13, 0.50, 15, 0.8
                ],
                'visibility': 'none'
            }
        });
    });


    // 6. Show all risk groups on launch
    setActiveGroup('ShowAll');


    let riskGroupsVisible = true; // Start with risk groups visible

    const toggleAllBtn = document.getElementById('toggle-risk-groups');
    if (toggleAllBtn) {
        // Set to "SHOW ALL" with active state on load
        toggleAllBtn.textContent = 'SHOW ALL';
        toggleAllBtn.classList.add('active');

        toggleAllBtn.addEventListener('click', function () {
            riskGroupsVisible = !riskGroupsVisible;
            if (riskGroupsVisible) {
                setActiveGroup('ShowAll');
                this.textContent = 'SHOW ALL';
                this.classList.add('active');
            } else {
                parcelLayers.forEach(layer => {
                    const layerId = `${layer.id}-fill`;
                    if (map.getLayer(layerId)) {
                        map.setLayoutProperty(layerId, 'visibility', 'none');
                    }
                });
                this.textContent = 'HIDE ALL';
                this.classList.add('active');
            }
        });
    }

    document.querySelectorAll('.risk-buttons button').forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.dataset.group;
            setActiveGroup(group);
            document.querySelectorAll('.risk-buttons button')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Reset toggle button
            if (toggleAllBtn) {
                riskGroupsVisible = true;
                toggleAllBtn.textContent = 'SHOW ALL';
                toggleAllBtn.classList.add('active');
            }
        });
    });





    // 7. Mapbox Geocoder (Address Search)
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: 'Search Address Here',
        flyTo: { zoom: 13, bearing: 0, speed: 1.2, curve: 1, easing: t => t }
    });
    const geocoderContainer = document.createElement('div');
    geocoderContainer.id = 'custom-geocoder';
    geocoderContainer.style.position = 'absolute';
    geocoderContainer.style.top = '35px';
    geocoderContainer.style.right = '10px';
    geocoderContainer.style.zIndex = '999';
    document.body.appendChild(geocoderContainer);
    geocoderContainer.appendChild(geocoder.onAdd(map));
    let searchMarker = null;
    geocoder.on('result', (e) => {
        if (searchMarker) searchMarker.remove();

        // Use a large, high-contrast SVG marker
        const el = document.createElement('div');
        el.innerHTML = `
        <svg width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="19" cy="19" rx="14" ry="14" fill="#000" stroke="#ff00f6" stroke-width="4"/>
            <ellipse cx="19" cy="19" rx="8" ry="8" fill="#fff"/>
            <path d="M19 47C23.5 37.5 33 27 19 27C5 27 14.5 37.5 19 47Z" fill="#ff00f6" stroke="#000" stroke-width="2"/>
        </svg>
    `;
        el.style.width = '38px';
        el.style.height = '48px';
        el.style.display = 'block';
        el.style.zIndex = '2000';
        searchMarker = new mapboxgl.Marker(el).setLngLat(e.result.center).addTo(map);
    });


    // --- 8. Toggles for Hospitals and Schools ---
    const hospitalToggle = document.getElementById('toggle-hospitals');
    if (hospitalToggle) {
        hospitalToggle.checked = false;
        hospitalToggle.addEventListener('change', function (e) {
            if (map.getLayer('hospitals-symbol')) {
                map.setLayoutProperty('hospitals-symbol', 'visibility', e.target.checked ? 'visible' : 'none');
            }
        });
    }
    const schoolToggle = document.getElementById('toggle-schools');
    if (schoolToggle) {
        schoolToggle.checked = false;
        schoolToggle.addEventListener('change', function (e) {
            if (map.getLayer('schools-symbol')) {
                map.setLayoutProperty('schools-symbol', 'visibility', e.target.checked ? 'visible' : 'none');
            }
        });
    }

    const parksToggle = document.getElementById('toggle-parks');
    if (parksToggle) {
        parksToggle.checked = false;
        parksToggle.addEventListener('change', function (e) {
            if (map.getLayer('parks-symbol')) {
                map.setLayoutProperty('parks-symbol', 'visibility', e.target.checked ? 'visible' : 'none');
            }
        });
    }


    // --- 9. Zoom Banner (Top Right) ---
    const banner = document.getElementById('zoom-banner');
    function toggleBanner() {
        if (!banner) return;
        const visible = map.getZoom() < 13;
        banner.classList.toggle('hidden', !visible);
    }
    map.on('load', toggleBanner);
    map.on('zoom', toggleBanner);

    // Hide loading spinner when map is ready
    map.on('idle', () => {
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';
    });
}); // --- END map.on('load') ---


// --- Risk Group Buttons ---
document.querySelectorAll('.risk-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        setActiveGroup(group);
        document.querySelectorAll('.risk-buttons button')
            .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// --- Show/Hide Parcels by Group ---
function setActiveGroup(riskGroup) {
    parcelLayers.forEach(layer => {
        const layerId = `${layer.id}-fill`;
        if (!map.getLayer(layerId)) return;
        if (riskGroup === 'ShowAll') {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            map.setPaintProperty(layerId, 'fill-opacity', 0.9);
        } else {
            if (layer.id.toLowerCase() === riskGroup.toLowerCase()) {
                map.setLayoutProperty(layerId, 'visibility', 'visible');
                map.setPaintProperty(layerId, 'fill-opacity', 0.9);
            } else {
                map.setLayoutProperty(layerId, 'visibility', 'none');
            }
        }


    });
}

// --- HOW TO USE MODAL HANDLING ---
document.addEventListener('DOMContentLoaded', function () {
    var banner = document.getElementById('howto-banner');
    var modal = document.getElementById('howto-modal');
    var closeBtn = document.getElementById('howto-close');

    if (banner && modal && closeBtn) {
        banner.addEventListener('click', function () {
            modal.classList.remove('hidden');
            modal.focus();
        });
        closeBtn.addEventListener('click', function () {
            modal.classList.add('hidden');
        });
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                modal.classList.add('hidden');
            }
        });
    }
});