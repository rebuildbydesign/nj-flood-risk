// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';



// New Jersey bounding box: [minLng, minLat, maxLng, maxLat]
const njBbox = [
  -75.5596, // southwest longitude
  38.7887,  // southwest latitude
  -73.8854, // northeast longitude
  41.3572   // northeast latitude
];



// Color palette for risk groups
const riskColors = {
    Crisis: '#dd4000',
    Emigrating: '#f27407',
    Destination: '#f2a007',
    Stable: '#f7c320'
};

// County vector tileset definitions
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



// Initialize the map view
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

// Build paint expressions based on the selected risk group
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

// Add all county sources and layers once the map loads
map.on('load', () => {


    
// Adding counties layer from mapbox

    countyLayers.forEach(county => {
        map.addSource(county.id, {
            type: 'vector',
            url: `mapbox://j00by.${county.tileset}`
        });

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




    // ACTIVATING THE FLOODPLAIN CHECKBOX TOGGLE


    // 1) define the two flood layer-IDs
    const floodLayers = ['fema_rutgers-fill', 'fema_rutgers-outline'];

    // 2) read the checkbox initial state & set them visible/none
    const toggle = document.getElementById('toggle-floodplain');
    let vis = toggle.checked ? 'visible' : 'none';
    floodLayers.forEach(id => map.setLayoutProperty(id, 'visibility', vis));

    // 3) wire up change handler
    toggle.addEventListener('change', (e) => {
        const newVis = e.target.checked ? 'visible' : 'none';
        floodLayers.forEach(id => map.setLayoutProperty(id, 'visibility', newVis));
    });


    // 1) Add your FEMA_Rutgers vector‐tile source
    map.addSource('fema_rutgers', {
        type: 'vector',
        url: 'mapbox://j00by.77lcuflb'
    });

    // 2) Draw it as a blue fill
    map.addLayer({
        id: 'fema_rutgers-fill',
        type: 'fill',
        source: 'fema_rutgers',
        'source-layer': 'floodplain',
        paint: {
            'fill-color': '#004494',      // a slightly softer blue
            'fill-opacity': 0.3,          // let more base map show through
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


  // 1) ADD NJ COUNTIES
  map.addSource('nj_counties', {
    type: 'vector',
    url: 'mapbox://j00by.d08646su'    // ← your tileset ID
  });

  // 2) Draw only the white outline (no fill)
  map.addLayer({
    id: 'nj_counties-outline',
    type: 'line',
    source: 'nj_counties',
    'source-layer': 'county_boundaries',  // matches the "-l county_boundaries" name
    layout: {
      'line-join': 'round',
      'line-cap':  'round'
    },
    paint: {
      'line-color': '#ffffff',
      'line-width': 1
    }
  });




    


setActiveGroup('ShowAll');

// ✅ Add geocoder manually (not with 'top-right')
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: false,
  placeholder: 'Search Address Here',
  flyTo: {
    zoom: 13,
    bearing: 0,
    speed: 1.2,
    curve: 1,
    easing: t => t
  }
});

// Create custom container for geocoder
const geocoderContainer = document.createElement('div');
geocoderContainer.id = 'custom-geocoder';
geocoderContainer.style.position = 'absolute';
geocoderContainer.style.top = '50px';     // Change this value as needed
geocoderContainer.style.right = '20px';
geocoderContainer.style.zIndex = '999';
document.body.appendChild(geocoderContainer);

// Append the geocoder UI to the custom container
geocoderContainer.appendChild(geocoder.onAdd(map));

// Re-check zoom level after geocoder fly
let searchMarker = null; // declare once globally

geocoder.on('result', (e) => {
  // Remove existing marker if present
  if (searchMarker) {
    searchMarker.remove();
  }

  // Create a new marker element
  const el = document.createElement('div');
  el.style.width = '16px';
  el.style.height = '16px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = '#fff';
  el.style.border = '4px solid #00ed3d'; // match your FEMA flood color
  el.style.boxShadow = '0 0 6px rgba(0, 0, 0, 0.4)';
  
  // Place marker at geocoded location
  searchMarker = new mapboxgl.Marker(el)
    .setLngLat(e.result.center)
    .addTo(map);
});


// Optional: nudge animation after 5s of inactivity
const nudgeTimeout = setTimeout(() => {
  const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
  if (geocoderEl) {
    geocoderEl.classList.add('nudge');
  }
}, 5000);

function removeNudgeOnInteraction() {
  clearTimeout(nudgeTimeout);
  const geocoderEl = document.querySelector('.mapboxgl-ctrl-geocoder');
  if (geocoderEl) {
    geocoderEl.classList.remove('nudge');
  }
  map.off('mousemove', removeNudgeOnInteraction);
}
map.on('mousemove', removeNudgeOnInteraction);





});

// Button click handling
document.querySelectorAll('.risk-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
        const group = btn.dataset.group;
        setActiveGroup(group);
        document.querySelectorAll('.risk-buttons button')
            .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Update layer styles when a new group is selected
function setActiveGroup(riskGroup) {
    countyLayers.forEach(county => {
        const layerId = `${county.id}-risk`;
        if (!map.getLayer(layerId)) return;

        map.setPaintProperty(layerId, 'fill-color', getColorExpression(riskGroup));
        map.setPaintProperty(
            layerId,
            'fill-opacity',
            riskGroup === 'ShowAll'
                ? 0.8
                : [
                    'case',
                    ['==', ['get', 'RISK_GROUP'], riskGroup],
                    0.85,
                    0.12
                ]
        );
    });
}

// Hide the loading indicator when the map is idle
map.on('idle', () => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
});

// Add hover cursor and click popups for each county layer
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

    // scripts.js (after map init)
    function toggleBanner() {
        const banner = document.getElementById('zoom-banner');
        const visible = map.getZoom() < 13;
        banner.classList.toggle('hidden', !visible);
    }
    map.on('load', toggleBanner);
    map.on('zoom', toggleBanner);

});
