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
let mapCenter = [-74.6, 40.15205];
let mapZoom = 7.75;

// Adjust for mobile
if (window.innerWidth <= 600) {
    mapCenter = [-74.3, 39.9];
    mapZoom = 6.65;
}

// --- Initialize Mapbox Map with LIGHT basemap ---
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/j00by/cmbqvtons000201qlgcox1gi5', // LIGHT BASEMAP
    center: mapCenter,
    zoom: mapZoom,
    minZoom: 6.5,
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

// --- Helper Functions ---
function formatNumber(num) {
    num = Number(num);
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    if (num === 0) return "0";
    if (isNaN(num)) return '–';
    return num;
}

// --- V2 POPUP HTML FUNCTION ---
function countyPopupHTML(props) {
    // Displacement parcels bar
    const riskBar = `
        <div style="display:flex;height:18px;border-radius:2px;overflow:hidden;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <div style="width:${(props.CRISIS_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Crisis};"></div>
            <div style="width:${(props.EMIGRATING_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Emigrating};"></div>
            <div style="width:${(props.DESTINATION_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Destination};"></div>
            <div style="width:${(props.STABLE_PARCELS_PCT * 100).toFixed(0)}%;background:${riskColors.Stable};"></div>
        </div>
    `;

    // Build array of assets with risk
    const assets = [
        {
            label: '✈️ Airports',
            total: props.TOTAL_AIRPORTS,
            count2025: props.AIRPORTS_2025,
            pct2025: props.PCT_AIRPORTS_2025,
            count2050: props.AIRPORTS_2050,
            pct2050: props.PCT_AIRPORTS_2050
        },
        {
            label: '🏥 Hospitals',
            total: props.TOTAL_HOSPITALS,
            count2025: props.HOSPITALS_2025,
            pct2025: props.PCT_HOSPITALS_2025,
            count2050: props.HOSPITAL_2050,
            pct2050: props.PCT_HOSPITALS_2050
        },
        {
            label: '📚 Libraries',
            total: props.TOTAL_LIBRARY,
            count2025: props.LIBRARY_2025,
            pct2025: props.PCT_LIBRARY_2025,
            count2050: props.LIBRARY_2050,
            pct2050: props.PCT_LIBRARY_2050
        },
        {
            label: '🌳 Parks',
            total: props.TOTAL_PARKS,
            count2025: props.PARKS_2025,
            pct2025: props.PCT_PARKS_2025,
            count2050: props.PARKS_2050,
            pct2050: props.PCT_PARKS_2050
        },
        {
            label: '⚡ Power Plants',
            total: props.TOTAL_POWERPLANTS,
            count2025: props.POWERPLANTS_2025,
            pct2025: props.PCT_POWERPLANTS_2025,
            count2050: props.POWERPLANTS_2050,
            pct2050: props.PCT_POWERPLANTS_2050
        },
        {
            label: '🏫 Schools',
            total: props.TOTAL_SCHOOL,
            count2025: props.SCHOOL_2025,
            pct2025: props.PCT_SCHOOL_2025,
            count2050: props.SCHOOL_2050,
            pct2050: props.PCT_SCHOOL_2050
        },
        {
            label: '⚠️ Contaminated Sites',
            total: props.TOTAL_KNOWN_CONTAMINATED_SITE,
            count2025: props.KNOWN_CONTAMINATED_SITE_2025,
            pct2025: props.PCT_KNOWN_CONTAMINATED_SITE_2025,
            count2050: props.KNOWN_CONTAMINATED_SITE_2050,
            pct2050: props.PCT_KNOWN_CONTAMINATED_SITE_2050
        },
        {
            label: '☢️ Solid/Hazardous Waste',
            total: props.TOTAL_SOLID_HAZARD_WASTE,
            count2025: props.SOLID_HAZARD_WASTE_2025,
            pct2025: props.PCT_SOLID_HAZARD_WASTE_2025,
            count2050: props.SOLID_HAZARD_WASTE_2050,
            pct2050: props.PCT_SOLID_HAZARD_WASTE_2050
        },
        {
            label: '🗑️ Landfills',
            total: props.TOTAL_SOLID_WASTE_LANDFILL,
            count2025: props.SOLID_WASTE_LANDFILL_2025,
            pct2025: props.PCT_SOLID_WASTE_LANDFILL_2025,
            count2050: props.SOLID_WASTE_LANDFILL_2050,
            pct2050: props.PCT_SOLID_WASTE_LANDFILL_2050
        },
        {
            label: '☣️ Superfund Sites',
            total: props.TOTAL_SUPERFUND,
            count2025: props.SUPERFUND_2025,
            pct2025: props.PCT_SUPERFUND_2025,
            count2050: props.SUPERFUND_2050,
            pct2050: props.PCT_SUPERFUND_2050
        },
        {
            label: '💧 Wastewater Treatment',
            total: props.TOTAL_WASTEWATER_TREATMENT,
            count2025: props.WASTEWATER_TREATMENT_2025,
            pct2025: props.PCT_WASTEWATER_TREATMENT_2025,
            count2050: props.WASTEWATER_TREATMENT_2050,
            pct2050: props.PCT_WASTEWATER_TREATMENT_2050
        }
    ];

    // Filter to only show assets with risk
    const assetsAtRisk = assets.filter(asset => {
        const hasTotal = asset.total && Number(asset.total) > 0;
        const has2025Risk = asset.count2025 && Number(asset.count2025) > 0;
        const has2050Risk = asset.count2050 && Number(asset.count2050) > 0;
        return hasTotal && (has2025Risk || has2050Risk);
    });

    // Calculate summary metric
    const totalAssets = assets.reduce((sum, a) => sum + (Number(a.total) || 0), 0);
    const assetsAtRisk2050 = assets.reduce((sum, a) => sum + (Number(a.count2050) || 0), 0);
    const summaryPct = totalAssets > 0 ? ((assetsAtRisk2050 / totalAssets) * 100).toFixed(1) : 0;

    // Helper function for compact asset bars (two-column layout)
    function compactAssetBar(label, count2025, pct2025, count2050, pct2050, total) {
        let p2025 = Number(pct2025) || 0;
        let p2050 = Number(pct2050) || 0;
        p2025 = Math.max(0, Math.min(p2025, 100));
        p2050 = Math.max(0, Math.min(p2050, 100));
        
        // Light theme colors with good contrast
        let color2025 = p2025 < 20 ? '#10b981' : p2025 < 50 ? '#f59e0b' : '#ef4444';
        let color2050 = p2050 < 20 ? '#10b981' : p2050 < 50 ? '#f59e0b' : '#ef4444';
        
        return `
            <div style="margin-bottom:10px;padding:10px;background:#f9fafb;border-radius:4px;border:1px solid #e5e7eb;">
                <div style="font-size:0.9em;font-weight:600;margin-bottom:6px;color:#111827;">${label}</div>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                    <span style="width:38px;font-size:0.78em;color:#6b7280;font-weight:500;">2025:</span>
                    <div style="flex:1;background:#e5e7eb;height:10px;border-radius:2px;overflow:hidden;">
                        <div style="background:${color2025};width:${p2025}%;height:100%;transition:width 0.3s;"></div>
                    </div>
                    <span style="width:95px;text-align:right;font-size:0.82em;color:#374151;font-weight:500;">
                        ${count2025 || 0}/${total} <span style="color:#6b7280;">(${p2025.toFixed(1)}%)</span>
                    </span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="width:38px;font-size:0.78em;color:#6b7280;font-weight:500;">2050:</span>
                    <div style="flex:1;background:#e5e7eb;height:10px;border-radius:2px;overflow:hidden;">
                        <div style="background:${color2050};width:${p2050}%;height:100%;transition:width 0.3s;"></div>
                    </div>
                    <span style="width:95px;text-align:right;font-size:0.82em;color:#374151;font-weight:500;">
                        ${count2050 || 0}/${total} <span style="color:#6b7280;">(${p2050.toFixed(1)}%)</span>
                    </span>
                </div>
            </div>
        `;
    }

    // Split assets into two columns
    const midpoint = Math.ceil(assetsAtRisk.length / 2);
    const leftColumn = assetsAtRisk.slice(0, midpoint);
    const rightColumn = assetsAtRisk.slice(midpoint);

    let leftColumnHTML = leftColumn.map(asset => 
        compactAssetBar(
            asset.label,
            asset.count2025,
            asset.pct2025,
            asset.count2050,
            asset.pct2050,
            asset.total
        )
    ).join('');

    let rightColumnHTML = rightColumn.map(asset => 
        compactAssetBar(
            asset.label,
            asset.count2025,
            asset.pct2025,
            asset.count2050,
            asset.pct2050,
            asset.total
        )
    ).join('');

    let totalParcels = formatNumber(props.TOTAL_PARCELS);

    return `
        <div style="display:flex;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;width:720px;max-width:90vw;background:#fff;">
            
            <!-- NARROW DISPLACEMENT SIDEBAR (Left) -->
            <div style="background:#f3f4f6;color:#111827;width:230px;padding:18px 16px;display:flex;flex-direction:column;border-right:2px solid #e5e7eb;">
                <!-- County Header -->
                <div style="border-left:4px solid #0054ff;padding-left:10px;margin-bottom:16px;">
                    <div style="font-weight:700;font-size:1.25em;color:#111827;line-height:1.2;margin-bottom:10px;">
                        ${props.COUNTY} COUNTY
                    </div>
                    <div style="font-size:0.9em;color:#111827;line-height:1.45;margin-bottom:6px;">
                        <span style="font-weight:600;color:#dc2626;">${(props.PCT_PARCELS_RISK_2024 * 100).toFixed(1)}%</span> of parcels 
                        (<span style="font-weight:600;">$${formatNumber(props.MARKET_VALUE_RISK_2024)}</span> value) are at high flood risk now.
                    </div>
                    <div style="font-size:0.9em;color:#0054ff;font-weight:600;line-height:1.4;">
                        By 2050: ${(props.PCT_PARCELS_RISK_2050 * 100).toFixed(1)}% ($${formatNumber(props.MARKET_VALUE_RISK_2050)} at risk)
                    </div>
                </div>

                <!-- Displacement Risk Section -->
                <div style="flex:1;">
                    <div style="font-weight:600;font-size:0.95em;margin-bottom:6px;color:#111827;">
                        🏠 Displacement Risk & Migration (Parcel-Level)
                    </div>
                    <div style="font-size:0.85em;color:#6b7280;margin-bottom:8px;">
                        Total parcels: ${totalParcels}
                    </div>
                    ${riskBar}
                    
                    <!-- Risk Categories in Table Format -->
                    <table style="width:100%;border-collapse:collapse;">
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:6px 0;display:flex;align-items:center;gap:6px;">
                                <span style="color:${riskColors.Crisis};font-size:1.1em;line-height:1;">⬤</span>
                                <span style="color:${riskColors.Crisis};font-weight:600;font-size:0.9em;">Crisis</span>
                            </td>
                            <td style="padding:6px 0;text-align:right;color:#374151;font-weight:500;font-size:0.9em;">
                                ${formatNumber(props.CRISIS_PARCELS)}
                            </td>
                            <td style="padding:6px 0 6px 8px;text-align:right;color:${riskColors.Crisis};font-weight:600;font-size:0.9em;">
                                ${(props.CRISIS_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:6px 0;display:flex;align-items:center;gap:6px;">
                                <span style="color:${riskColors.Emigrating};font-size:1.1em;line-height:1;">⬤</span>
                                <span style="color:${riskColors.Emigrating};font-weight:600;font-size:0.9em;">Emigrating</span>
                            </td>
                            <td style="padding:6px 0;text-align:right;color:#374151;font-weight:500;font-size:0.9em;">
                                ${formatNumber(props.EMIGRATING_PARCELS)}
                            </td>
                            <td style="padding:6px 0 6px 8px;text-align:right;color:${riskColors.Emigrating};font-weight:600;font-size:0.9em;">
                                ${(props.EMIGRATING_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:6px 0;display:flex;align-items:center;gap:6px;">
                                <span style="color:${riskColors.Destination};font-size:1.1em;line-height:1;">⬤</span>
                                <span style="color:${riskColors.Destination};font-weight:600;font-size:0.9em;">Destination</span>
                            </td>
                            <td style="padding:6px 0;text-align:right;color:#374151;font-weight:500;font-size:0.9em;">
                                ${formatNumber(props.DESTINATION_PARCELS)}
                            </td>
                            <td style="padding:6px 0 6px 8px;text-align:right;color:${riskColors.Destination};font-weight:600;font-size:0.9em;">
                                ${(props.DESTINATION_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0;display:flex;align-items:center;gap:6px;">
                                <span style="color:${riskColors.Stable};font-size:1.1em;line-height:1;">⬤</span>
                                <span style="color:${riskColors.Stable};font-weight:600;font-size:0.9em;">Stable</span>
                            </td>
                            <td style="padding:6px 0;text-align:right;color:#374151;font-weight:500;font-size:0.9em;">
                                ${formatNumber(props.STABLE_PARCELS)}
                            </td>
                            <td style="padding:6px 0 6px 8px;text-align:right;color:${riskColors.Stable};font-weight:600;font-size:0.9em;">
                                ${(props.STABLE_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- CTA Link -->
                <div style="margin-top:auto;padding-top:14px;border-top:2px solid #d1d5db;">
                    <a href="https://rebuildbydesign.org/nj-flood-risk" target="_blank" 
                       style="font-weight:600;color:#dd4000;text-decoration:none;font-size:0.88em;display:inline-flex;align-items:center;gap:4px;">
                        📋 Explore Full Strategy →
                    </a>
                </div>
            </div>

            <!-- WIDE INFRASTRUCTURE PANEL (Right) -->
            <div style="background:#ffffff;flex:1;padding:18px 20px;overflow-y:auto;max-height:500px;">
                <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e5e7eb;">
                    <div style="font-weight:700;font-size:1.08em;color:#111827;letter-spacing:0.01em;margin-bottom:6px;">
                        🛡️ Critical Facilities in Flood-Prone Areas
                    </div>
                    <div style="font-size:0.9em;color:#374151;line-height:1.4;">
                        By 2050: <span style="color:#dc2626;font-weight:600;">${summaryPct}%</span> of all public assets at risk
                        <span style="color:#6b7280;"> (${assetsAtRisk2050}/${totalAssets} total)</span>
                    </div>
                </div>
                
                ${assetsAtRisk.length > 0 ? `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                        <div>${leftColumnHTML}</div>
                        <div>${rightColumnHTML}</div>
                    </div>
                    <div style="font-size:0.78em;color:#6b7280;line-height:1.3;margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;font-style:italic;">
                        * Assets on 2050 floodplain or within 100ft to capture full impact on adjacent areas
                    </div>
                ` : '<div style="font-size:0.9em;color:#6b7280;font-style:italic;">No critical infrastructure at risk</div>'}
            </div>
        </div>
    `;
}

// --- Map Load Event ---
map.on('load', () => {
    // Hide loading indicator
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';

    // 1. Add parcel layers (displacement risk groups)
    parcelLayers.forEach(layer => {
        map.addSource(layer.id, { 
            type: 'vector', 
            url: `mapbox://${layer.tileset}` 
        });
        
        map.addLayer({
            id: `${layer.id}-fill`,
            type: 'fill',
            source: layer.id,
            'source-layer': 'parcels',
            minzoom: 7.5,
            paint: { 
                'fill-color': layer.color, 
                'fill-opacity': 0.9 
            }
        });
        
        map.addLayer({
            id: `${layer.id}-outline`,
            type: 'line',
            source: layer.id,
            'source-layer': 'parcels',
            minzoom: 7.5,
            paint: { 
                'line-color': '#333', 
                'line-width': 0.2 
            }
        });
    });

    // 2. Add NJ county outlines (visual boundaries)
    map.addSource('nj_counties', { 
        type: 'vector', 
        url: 'mapbox://j00by.d08646su' 
    });
    
    map.addLayer({
        id: 'nj_counties-outline',
        type: 'line',
        source: 'nj_counties',
        'source-layer': 'county_boundaries',
        layout: { 
            'line-join': 'round', 
            'line-cap': 'round' 
        },
        paint: { 
            'line-color': '#ffffff',
            'line-width': 1.5
        }
    });

    // 3. Load county GeoJSON with popup data
    fetch('data/county_popup.geojson')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load county data: ${response.status}`);
            }
            return response.json();
        })
        .then(geojson => {
            map.addSource('counties', { 
                type: 'geojson', 
                data: geojson 
            });
            
            map.addLayer({
                id: 'county-fills',
                type: 'fill',
                source: 'counties',
                paint: { 
                    'fill-color': 'transparent',
                    'fill-opacity': 0 
                }
            });

            // Popup on click (V2 style)
            map.on('click', 'county-fills', (e) => {
                const feature = e.features[0];
                new mapboxgl.Popup({ closeButton: true, maxWidth: "800px" })
                    .setLngLat(e.lngLat)
                    .setHTML(countyPopupHTML(feature.properties))
                    .addTo(map);
            });

            // Hover effect for counties
            map.on('mouseenter', 'county-fills', () => {
                map.getCanvas().style.cursor = 'pointer';
            });
            
            map.on('mouseleave', 'county-fills', () => {
                map.getCanvas().style.cursor = '';
            });
        })
        .catch(error => {
            console.error('Error loading county data:', error);
            console.warn('Make sure data/county_popup.geojson exists in your project folder');
        });

    // 4. Show only Crisis and Emigrating on launch (Primary Displacement)
    const riskGroupBtns = document.querySelectorAll('[data-group]');
    
    // Activate only Crisis and Emigrating buttons
    parcelLayers.forEach(layer => {
        const fillId = `${layer.id}-fill`;
        const outlineId = `${layer.id}-outline`;
        
        if (layer.id === 'crisis' || layer.id === 'emigrating') {
            // Show Crisis and Emigrating
            if (map.getLayer(fillId)) map.setLayoutProperty(fillId, 'visibility', 'visible');
            if (map.getLayer(outlineId)) map.setLayoutProperty(outlineId, 'visibility', 'visible');
        } else {
            // Hide Destination and Stable
            if (map.getLayer(fillId)) map.setLayoutProperty(fillId, 'visibility', 'none');
            if (map.getLayer(outlineId)) map.setLayoutProperty(outlineId, 'visibility', 'none');
        }
    });
    
    // Add active class to Crisis and Emigrating buttons only
    riskGroupBtns.forEach(btn => {
        const group = btn.getAttribute('data-group');
        if (group === 'Crisis' || group === 'Emigrating') {
            btn.classList.add('active');
        }
    });
    
    // Individual risk group buttons
    riskGroupBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const group = btn.getAttribute('data-group');
            const isActive = btn.classList.contains('active');

            if (isActive) {
                // Deactivate this group
                btn.classList.remove('active');
                const layerId = group.toLowerCase();
                if (map.getLayer(`${layerId}-fill`)) map.setLayoutProperty(`${layerId}-fill`, 'visibility', 'none');
                if (map.getLayer(`${layerId}-outline`)) map.setLayoutProperty(`${layerId}-outline`, 'visibility', 'none');
            } else {
                // Activate this group
                btn.classList.add('active');
                const layerId = group.toLowerCase();
                if (map.getLayer(`${layerId}-fill`)) map.setLayoutProperty(`${layerId}-fill`, 'visibility', 'visible');
                if (map.getLayer(`${layerId}-outline`)) map.setLayoutProperty(`${layerId}-outline`, 'visibility', 'visible');
            }
        });
    });

    // 5. Add geocoder (search)
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: {
            color: '#dd4000' // Use crisis red for marker
        },
        countries: 'us',
        bbox: [-75.559614, 38.928519, -73.893979, 41.357423],
        placeholder: 'Search NJ addresses...',
        flyTo: { 
            zoom: 15, 
            bearing: 0, 
            speed: 1.2, 
            curve: 1
        }
    });

    map.addControl(geocoder, 'top-right');
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
});

// --- How To Use Modal Logic ---
const howtoModal = document.getElementById('howto-modal');
const howtoBanner = document.getElementById('howto-banner');
const howtoClose = document.getElementById('howto-close');

if (howtoBanner) {
    howtoBanner.addEventListener('click', () => {
        howtoModal.classList.remove('hidden');
    });
}

if (howtoClose) {
    howtoClose.addEventListener('click', () => {
        howtoModal.classList.add('hidden');
    });
}

if (howtoModal) {
    howtoModal.addEventListener('click', (e) => {
        if (e.target === howtoModal) {
            howtoModal.classList.add('hidden');
        }
    });
}

// --- Methodology Link Logic ---
const methodologyLink = document.getElementById('methodology-link');

if (methodologyLink) {
    methodologyLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://rebuildbydesign.org/nj-flood-risk', '_blank');
    });
}