// --- Mapbox Access Token ---
mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';

// --- Color Palette for Displacement Risk Groups ---
const riskColors = {
    Crisis: '#dd4000',
    Emigrating: '#f27407',
    Destination: '#f2a007',
    Stable: '#f7c320'
};

// --- Dynamic zoom/center for mobile ---
let mapCenter = [-75.32569, 40.15205];
let mapZoom = 7.75;

// Adjust for mobile
if (window.innerWidth <= 600) {
    mapCenter = [-74.8, 39.9];
    mapZoom = 6.65;
}

// --- Initialize Mapbox Map ---
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/j00by/cmbqvtons000201qlgcox1gi5',
    center: mapCenter,
    zoom: mapZoom,
    minZoom: 6.5,   // Allow zoom out on mobile if needed
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

// --- County Popup Information (Upgraded) ---

function formatNumber(num) {
    num = Number(num);
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    if (num === 0) return "0";
    if (isNaN(num)) return '–';
    return num;
}

function percentBar(n, d, p) {
    // If missing/invalid, show placeholder
    if (!d || isNaN(n) || isNaN(d) || d === 0 || isNaN(p)) {
        return `
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;background:#e9ecef;height:14px;border-radius:6px;overflow:hidden;margin-right:6px;">
            <div style="background:#1976d2;width:0%;height:100%;"></div>
          </div>
          <span style="width:38px;text-align:right;color:#aaa;font-weight:600;">–</span>
        </div>
        `;
    }
    // Cap percent for display, fallback if weird value
    let pct = Math.max(0, Math.min(Number(p) * 100, 100)).toFixed(0);
    return `
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="flex:1;background:#e9ecef;height:14px;border-radius:6px;overflow:hidden;margin-right:6px;">
          <div style="background:#1976d2;width:${pct}%;height:100%;"></div>
        </div>
        <span style="width:38px;text-align:right;color:#1976d2;font-weight:600;">${pct}%</span>
      </div>
    `;
}

function countyPopupHTML(props) {
    const riskColors = {
        Crisis: '#dd4000',
        Emigrating: '#f27407',
        Destination: '#f2a007',
        Stable: '#f7c320'
    };

    // Displacement parcels bar
    const riskBar = `
    <div style="display:flex;height:18px;border-radius:4px;overflow:hidden;margin-bottom:8px;margin-top:2px;">
      <div style="width:${(props.CRISIS_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Crisis};"></div>
      <div style="width:${(props.EMIGRATING_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Emigrating};"></div>
      <div style="width:${(props.DESTINATION_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Destination};"></div>
      <div style="width:${(props.STABLE_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Stable};"></div>
    </div>`;

    // Asset row with improved NaN/undefined handling and blue percent bar
    function assetRow(label, atRisk, total, pct) {
        let n = Number(atRisk), d = Number(total), p = Number(pct);
        // Handle nulls and missing
        let atRiskText = (!isNaN(n) && !isNaN(d)) ? `${n}/${d}` : (isNaN(n) && !isNaN(d)) ? `0/${d}` : "–";
        return `
        <tr>
            <td>${label}</td>
            <td style="text-align:right;padding-right:8px;">${atRiskText}</td>
            <td>${percentBar(n, d, p)}</td>
        </tr>`;
    }

    // Total parcels row for clarity
    let totalParcels = formatNumber(props.TOTAL_PARCELS);

    return `
    <div style="font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;max-width:410px;">
      <div style="border-left:6px solid #1976d2;padding-left:12px;margin-bottom:8px;">
        <div style="font-weight:700;font-size:1.5em;">${props.COUNTY} COUNTY</div>
        <div style="font-size:1.01em;color:#111;margin-top:2px;">
          <b>${(props.PCT_PARCELS_RISK_2024 * 100).toFixed(1)}%</b> of parcels (<b>$${formatNumber(props.MARKET_VALUE_RISK_2024)}</b> value) are at high flood risk now.<br>
          <span style="color:#1976d2;font-weight:600;">
            By 2050: ${(props.PCT_PARCELS_RISK_2050 * 100).toFixed(1)}% ($${formatNumber(props.MARKET_VALUE_RISK_2050)} at risk)
          </span>
        </div>
      </div>
      <div style="margin-bottom:7px;">
        <div style="font-weight:600;margin-bottom:2px;letter-spacing:0.01em;">🏠 Displacement Risk Parcels</div>
        <div style="font-size:0.97em;color:#000;margin-bottom:4px;font-weight:500;">
          Total parcels: ${totalParcels}
        </div>
        ${riskBar}
        <table style="width:100%;font-size:0.99em;">
          <tr style="color:${riskColors.Crisis}"><td>⬤ Crisis</td><td style="text-align:right;">${formatNumber(props.CRISIS_PARCELS)}</td><td style="text-align:right;">${(props.CRISIS_PARCELS_PCT * 100).toFixed(1)}%</td></tr>
          <tr style="color:${riskColors.Emigrating}"><td>⬤ Emigrating</td><td style="text-align:right;">${formatNumber(props.EMIGRATING_PARCELS)}</td><td style="text-align:right;">${(props.EMIGRATING_PARCELS_PCT * 100).toFixed(1)}%</td></tr>
          <tr style="color:${riskColors.Destination}"><td>⬤ Destination</td><td style="text-align:right;">${formatNumber(props.DESTINATION_PARCELS)}</td><td style="text-align:right;">${(props.DESTINATION_PARCELS_PCT * 100).toFixed(1)}%</td></tr>
          <tr style="color:${riskColors.Stable}"><td>⬤ Stable</td><td style="text-align:right;">${formatNumber(props.STABLE_PARCELS)}</td><td style="text-align:right;">${(props.STABLE_PARCELS_PCT * 100).toFixed(1)}%</td></tr>
        </table>
      </div>
      <div style="font-weight:600;margin-bottom:3px;letter-spacing:0.01em;">🛡️ Public Assets at Flood Risk</div>
      <table style="width:100%;font-size:0.99em;margin-bottom:2px;">
        ${assetRow('Airports', props.AIRPORTS_AT_RISK, props.TOTAL_AIRPORTS, props.PERC_AIRPORTS_AT_RISK)}
        ${assetRow('Hospitals', props.HOSPITALS_AT_RISK, props.TOTAL_HOSPITALS, props.PERC_HOSPITALS_AT_RISK)}
        ${assetRow('Libraries', props.LIBRARIES_AT_RISK, props.TOTAL_LIBRARIES, props.PERC_LIBRARIES_AT_RISK)}
        ${assetRow('Parks', props.PARKS_AT_RISK, props.TOTAL_PARKS, props.PERC_PARKS_AT_RISK)}
        ${assetRow('Power Plants', props.PLANTS_AT_RISK, props.TOTAL_PLANTS, props.PERC_PLANTS_AT_RISK)}
        ${assetRow('Schools', props.SCHOOLS_AT_RISK, props.TOTAL_SCHOOLS, props.PERC_SCHOOLS_AT_RISK)}
        ${assetRow('Superfunds', props.SUPER_FUND_AT_RISK, props.TOTAL_SUPER_FUND, props.PERC_SUPER_FUND_AT_RISK)}
      </table>
      <div style="font-size:0.92em;color:#888;line-height:1.08;margin-bottom:6px;">
  * <i>Includes assets on the 2050 floodplain or within 100ft to better capture the full impact of flooding on adjacent neighbors and blocks.</i>
</div>
      <div class="cta" style="margin-top:5px;">
        <a href="https://rebuildbydesign.org/nj-flood-risk" target="_blank" style="font-weight:700;color:#1976d2;text-decoration:underline;">Explore Rebuild by Design’s Strategy for a Safer New Jersey</a>
      </div>
    </div>
    `;
}



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

    // 3. Hospitals (toggle)
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

    // 4. Schools (toggle)
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


    // 5. Parks (toggle)
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

    // 6. County Outlines (White)
    map.addSource('nj_counties', { type: 'vector', url: 'mapbox://j00by.d08646su' });
    map.addLayer({
        id: 'nj_counties-outline',
        type: 'line',
        source: 'nj_counties',
        'source-layer': 'county_boundaries',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#fff', 'line-width': 1 }
    });

    // Load your county geojson (update path if needed)
    fetch('/data/county_popup.json')
        .then(response => response.json())
        .then(geojson => {
            map.addSource('counties', { type: 'geojson', data: geojson });
            map.addLayer({
                id: 'county-fills',
                type: 'fill',
                source: 'counties',
                paint: { 'fill-color': '#0054ff', 'fill-opacity': 0.03 }
            });
            map.addLayer({
                id: 'county-borders',
                type: 'line',
                source: 'counties',
                paint: { 'line-color': '#fff', 'line-width': 1.2 }
            });

            // Popup on click
            map.on('click', 'county-fills', (e) => {
                const feature = e.features[0];
                new mapboxgl.Popup({ closeButton: true, maxWidth: "425px" })
                    .setLngLat(e.lngLat)
                    .setHTML(countyPopupHTML(feature.properties))
                    .addTo(map);
            });

            // Change cursor to pointer
            map.on('mouseenter', 'county-fills', () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', 'county-fills', () => {
                map.getCanvas().style.cursor = '';
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
    geocoderContainer.style.right = '10px';
    geocoderContainer.style.zIndex = '999';

    // Responsive top positioning
    if (window.innerWidth <= 800) {
        geocoderContainer.style.top = '5px';   // mobile/tablet
    } else {
        geocoderContainer.style.top = '35px';   // desktop
    }

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

    // Optional: adjust on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 800) {
            geocoderContainer.style.top = '5px';
        } else {
            geocoderContainer.style.top = '35px';
        }
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