// --- Mapbox Access Token ---
mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';

// --- New Jersey Map Boundaries ---
const njBbox = [-75.5596, 38.7887, -73.8854, 41.3572]; // [minLng, minLat, maxLng, maxLat]

// --- Color Palette for Displacement Risk Groups ---
const riskColors = {
    Crisis: '#dd4000',
    Emigrating: '#f27407',
    Destination: '#f2a007',
    Stable: '#f7c320'
};

// --- County Vector Tileset Definitions ---
const countyLayers = [
    { id: 'bergen', tileset: '4a0dl24e', sourceLayer: 'Bergen-0le3bi' },
    { id: 'atlantic', tileset: '7nuy1a8k', sourceLayer: 'Atlantic-0gbji1' },
    { id: 'monmouth', tileset: '94o2bnvg', sourceLayer: 'Monmouth-8y2nrf' },
    { id: 'union', tileset: 'ctef8rld', sourceLayer: 'Union-40malz' },
    { id: 'middlesex', tileset: '9mq4ynku', sourceLayer: 'Middlesex-9em40p' },
    { id: 'morris', tileset: '1zq8vok1', sourceLayer: 'Morris-02umxx' },
    { id: 'essex', tileset: 'do09sqee', sourceLayer: 'Essex-6xihac' },
    { id: 'camden', tileset: 'cpqj8pqn', sourceLayer: 'Camden-0u4811' },
    { id: 'mercer', tileset: '6beabe3u', sourceLayer: 'Mercer-cc6gdz' },
    { id: 'burlington', tileset: 'aefhywzh', sourceLayer: 'Burlington-6xh3f7' },
    { id: 'cape_may_hudson', tileset: '2vkc4woq', sourceLayer: 'CapeMay_Hudson-6o1nnv' },
    { id: 'reduced', tileset: '6repdkmg', sourceLayer: 'reduced-au5soh' },
    { id: 'ocean', tileset: 'ccwm0qbn', sourceLayer: 'Ocean-cgpepo' }
];

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

// --- Helper: Paint Expression for County Risk Layers ---
function getColorExpression(activeGroup) {
    if (activeGroup === 'ShowAll') {
        return [
            'match',
            ['get', 'RISK_GROUP'],
            'Crisis', riskColors.Crisis,
            'Emigrating', riskColors.Emigrating,
            'Destination', riskColors.Destination,
            'Stable', riskColors.Stable,
            '#444'
        ];
    }
    return [
        'case',
        ['==', ['get', 'RISK_GROUP'], activeGroup],
        riskColors[activeGroup],
        '#333'
    ];
}

// ========== MAP LOAD ==========
map.on('load', () => {
    // --- 1. ADD COUNTY VECTOR TILE LAYERS ---
    countyLayers.forEach(county => {
        // County Polygon Fill (colored by risk group)
        map.addSource(county.id, { type: 'vector', url: `mapbox://j00by.${county.tileset}` });
        map.addLayer({
            id: `${county.id}-risk`,
            type: 'fill',
            source: county.id,
            'source-layer': county.sourceLayer,
            minzoom: 13,
            paint: {
                'fill-color': getColorExpression('ShowAll'),
                'fill-opacity': 0.8
            }
        });
        // County Polygon Outline
        map.addLayer({
            id: `${county.id}-risk-line`,
            type: 'line',
            source: county.id,
            'source-layer': county.sourceLayer,
            minzoom: 13,
            paint: {
                'line-color': '#666',
                'line-width': 0.25
            }
        });
    });

    // --- 2. FEMA Floodplain Layer (Toggled) ---
    const toggle = document.getElementById('toggle-floodplain');
    toggle.checked = false; // Hide on load
    toggle.addEventListener('change', (e) => {
        if (e.target.checked) {
            // Add FEMA layer if not present
            if (!map.getSource('fema_rutgers')) {
                map.addSource('fema_rutgers', { type: 'vector', url: 'mapbox://j00by.77lcuflb' });
                map.addLayer({
                    id: 'fema_rutgers-fill',
                    type: 'fill',
                    source: 'fema_rutgers',
                    'source-layer': 'floodplain',
                    paint: {
                        'fill-color': '#004494',
                        'fill-opacity': 0.3,
                        'fill-antialias': true
                    }
                });
                map.addLayer({
                    id: 'fema_rutgers-outline',
                    type: 'line',
                    source: 'fema_rutgers',
                    'source-layer': 'floodplain',
                    paint: {
                        'line-color': '#004494',
                        'line-width': 1
                    }
                });
            } else {
                // Show if already present
                map.setLayoutProperty('fema_rutgers-fill', 'visibility', 'visible');
                map.setLayoutProperty('fema_rutgers-outline', 'visibility', 'visible');
            }
        } else {
            // Hide FEMA layer
            if (map.getLayer('fema_rutgers-fill')) map.setLayoutProperty('fema_rutgers-fill', 'visibility', 'none');
            if (map.getLayer('fema_rutgers-outline')) map.setLayoutProperty('fema_rutgers-outline', 'visibility', 'none');
        }
    });

    // --- 3. NJ County Outlines (White) ---
    map.addSource('nj_counties', { type: 'vector', url: 'mapbox://j00by.d08646su' });
    map.addLayer({
        id: 'nj_counties-outline',
        type: 'line',
        source: 'nj_counties',
        'source-layer': 'county_boundaries',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#fff', 'line-width': 1 }
    });

    // --- 4. Parcel Layers for Displacement Risk Groups ---
    window.parcelLayers = [
        { id: 'stable',      tileset: 'j00by.dxxv2rrd', color: '#f7c320' },
        { id: 'emigrating',  tileset: 'j00by.38l572x2', color: '#f27407' },
        { id: 'crisis',      tileset: 'j00by.cpk925km', color: '#dd4000' },
        { id: 'destination', tileset: 'j00by.2pl97lme', color: '#f2a007' }
    ];
    parcelLayers.forEach(layer => {
        map.addSource(layer.id, { type: 'vector', url: `mapbox://${layer.tileset}` });
        map.addLayer({
            id: `${layer.id}-fill`,
            type: 'fill',
            source: layer.id,
            'source-layer': 'parcels',
            minzoom: 7.5,
            paint: { 'fill-color': layer.color, 'fill-opacity': 1 }
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

    // --- 5. POINT LAYERS: Hospitals & Schools (Hidden by Default) ---
    // Hospitals
    map.addSource('hospitals', {
        type: 'geojson',
        data: 'https://rebuildbydesign.github.io/nj-flood-risk/data/hospitals.geojson'
    });
    map.loadImage(
    'https://rebuildbydesign.github.io/nj-flood-risk/img/hospital.png',
    (error, image) => {
        if (error) throw error;
        // Prevent duplicate add
        if (!map.hasImage('hospital-icon')) {
            map.addImage('hospital-icon', image, { sdf: false });
        }

        // Now add the hospital symbol layer
        map.addLayer({
            id: 'hospitals-symbol',
            type: 'symbol',
            source: 'hospitals',
            layout: {
                'icon-image': 'hospital-icon',
                'icon-allow-overlap': true,
                'icon-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    7, 0.08,   // Small statewide
                    10, 0.12,  // Medium
                    14, 0.20   // Large at high zoom
                ],
                'visibility': 'none'
            }
        });
    }
);



    // Elementary Schools
    map.addSource('elementary-schools', {
        type: 'geojson',
        data: 'https://rebuildbydesign.github.io/nj-flood-risk/data/elementary-schools.json'
    });
    map.addLayer({
        id: 'elementary-schools-layer',
        type: 'circle',
        source: 'elementary-schools',
        paint: {
            'circle-radius': 4,
            'circle-color': '#f2a007',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000'
        },
        layout: { 'visibility': 'none' }
    });

    // Secondary Schools
    map.addSource('secondary-schools', {
        type: 'geojson',
        data: 'https://rebuildbydesign.github.io/nj-flood-risk/data/secondary-schools.json'
    });
    map.addLayer({
        id: 'secondary-schools-layer',
        type: 'circle',
        source: 'secondary-schools',
        paint: {
            'circle-radius': 4,
            'circle-color': '#f27407',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000'
        },
        layout: { 'visibility': 'none' }
    });

    // --- 6. Activate all risk groups on launch ---
    setActiveGroup('ShowAll');

    // --- 7. Mapbox Geocoder (Address Search Bar, Manual Placement) ---
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: 'Search Address Here',
        flyTo: { zoom: 13, bearing: 0, speed: 1.2, curve: 1, easing: t => t }
    });
    // Custom Geocoder Container (so it doesn't conflict with Mapbox default UI)
    const geocoderContainer = document.createElement('div');
    geocoderContainer.id = 'custom-geocoder';
    geocoderContainer.style.position = 'absolute';
    geocoderContainer.style.top = '50px';
    geocoderContainer.style.right = '20px';
    geocoderContainer.style.zIndex = '999';
    document.body.appendChild(geocoderContainer);
    geocoderContainer.appendChild(geocoder.onAdd(map));
    // Add green dot for searched address
    let searchMarker = null;
    geocoder.on('result', (e) => {
        if (searchMarker) searchMarker.remove();
        const el = document.createElement('div');
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = '#fff';
        el.style.border = '4px solid #00ed3d';
        el.style.boxShadow = '0 0 6px rgba(0, 0, 0, 0.4)';
        searchMarker = new mapboxgl.Marker(el).setLngLat(e.result.center).addTo(map);
    });
    // Subtle animation to draw attention to geocoder if not used
    const nudgeTimeout = setTimeout(() => {
        const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
        if (geocoderEl) geocoderEl.classList.add('nudge');
    }, 5000);
    function removeNudgeOnInteraction() {
        clearTimeout(nudgeTimeout);
        const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
        if (geocoderEl) geocoderEl.classList.remove('nudge');
        map.off('mousemove', removeNudgeOnInteraction);
    }
    map.on('mousemove', removeNudgeOnInteraction);



    const hospitalToggle = document.getElementById('toggle-hospitals');
if (hospitalToggle) {
    hospitalToggle.checked = false; // hidden on load
    hospitalToggle.addEventListener('change', function (e) {
        if (map.getLayer('hospitals-symbol')) {
            map.setLayoutProperty(
                'hospitals-symbol',
                'visibility',
                e.target.checked ? 'visible' : 'none'
            );
        }
    });

}




}); // --- END map.on('load') ---

// ========== BUTTON HANDLING: Displacement Risk Group Buttons ==========
document.querySelectorAll('.risk-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        setActiveGroup(group);
        document.querySelectorAll('.risk-buttons button')
            .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// ========== LOGIC: Show/Hide Parcels and Color Counties by Group ==========
function setActiveGroup(riskGroup) {
    // County layers: color and opacity
    countyLayers.forEach(county => {
        const layerId = `${county.id}-risk`;
        if (!map.getLayer(layerId)) return;
        map.setPaintProperty(layerId, 'fill-color', getColorExpression(riskGroup));
        map.setPaintProperty(layerId, 'fill-opacity',
            riskGroup === 'ShowAll'
                ? 0.8
                : ['case', ['==', ['get', 'RISK_GROUP'], riskGroup], 0.85, 0.12]
        );
    });

    // Parcel layers: show/hide by risk group
    parcelLayers.forEach(layer => {
        const layerId = `${layer.id}-fill`;
        if (!map.getLayer(layerId)) return;
        if (riskGroup === 'ShowAll') {
            map.setLayoutProperty(layerId, 'visibility', 'visible');
            map.setPaintProperty(layerId, 'fill-opacity', 1);
        } else {
            if (layer.id.toLowerCase() === riskGroup.toLowerCase()) {
                map.setLayoutProperty(layerId, 'visibility', 'visible');
                map.setPaintProperty(layerId, 'fill-opacity', 1);
            } else {
                map.setLayoutProperty(layerId, 'visibility', 'none');
            }
        }
    });
}

// ========== UX: Hide Loading Spinner when Map is Ready ==========
map.on('idle', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
});

// ========== COUNTY LAYER INTERACTIONS: Hover Cursor & Popup ==========
countyLayers.forEach(county => {
    const layerId = `${county.id}-risk`;

    map.on('mouseenter', layerId, () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', layerId, () => {
        map.getCanvas().style.cursor = '';
    });

    map.on('click', layerId, e => {
        const props = e.features[0].properties;
        new mapboxgl.Popup({ offset: 4 })
            .setLngLat(e.lngLat)
            .setHTML(`
                <strong>Risk Group:</strong> ${props.RISK_GROUP}<br>
                <strong>County:</strong> ${props.COUNTY || county.id}
            `)
            .addTo(map);
    });

    // Banner for zoom level (shows when zoomed out)
    function toggleBanner() {
        const banner = document.getElementById('zoom-banner');
        const visible = map.getZoom() < 13;
        banner.classList.toggle('hidden', !visible);
    }
    map.on('load', toggleBanner);
    map.on('zoom', toggleBanner);
});

