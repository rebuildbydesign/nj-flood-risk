// --- Mapbox Access Token ---
mapboxgl.accessToken = 'pk.eyJ1IjoiajAwYnkiLCJhIjoiY2x1bHUzbXZnMGhuczJxcG83YXY4czJ3ayJ9.S5PZpU9VDwLMjoX_0x5FDQ';

// --- Color Palette for Displacement Risk Groups ---
const riskColors = {
    Crisis: '#dd4000',
    Emigrating: '#f27407',
    Destination: '#f2a007',
    Stable: '#f7c320'
};

// --- Dynamic zoom/center ---
// Always center on NJ geographically. On desktop, Mapbox padding (set after load)
// visually shifts NJ left to clear the finding card — without moving the geographic center.
let mapCenter = [-74.6, 40.15205];
let mapZoom = 7.5;

if (window.innerWidth <= 600) {
    // Mobile: finding card is hidden, keep NJ centered
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

    // Calculate summary metrics
    const totalAssets = assets.reduce((sum, a) => sum + (Number(a.total) || 0), 0);
    const assetsAtRisk2025 = assets.reduce((sum, a) => sum + (Number(a.count2025) || 0), 0);
    const assetsAtRisk2050 = assets.reduce((sum, a) => sum + (Number(a.count2050) || 0), 0);
    const summaryPct2025 = totalAssets > 0 ? ((assetsAtRisk2025 / totalAssets) * 100).toFixed(1) : 0;
    const summaryPct2050 = totalAssets > 0 ? ((assetsAtRisk2050 / totalAssets) * 100).toFixed(1) : 0;

    // Comma-format helper for asset counts
    const fmtComma = n => Number(n || 0).toLocaleString('en-US');

    // Helper function for compact asset bars (two-column layout)
    function compactAssetBar(label, count2025, pct2025, count2050, pct2050, total) {
        let p2025 = Number(pct2025) || 0;
        let p2050 = Number(pct2050) || 0;
        p2025 = Math.max(0, Math.min(p2025, 100));
        p2050 = Math.max(0, Math.min(p2050, 100));
        
        // Blue palette matching municipality branding
        let color2025 = '#a5d5f1';
        let color2050 = '#3a7fc3';
        
        return `
            <div style="margin-bottom:8px;padding:8px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-left:6px solid #999;border-radius:0 4px 4px 0;transition:opacity 0.25s ease,transform 0.15s ease;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                    <span style="font-size:1.01em;font-weight:600;color:#111827;letter-spacing:0.2px;">${label}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:4px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:0.88em;color:#6b7280;width:28px;flex-shrink:0;text-align:right;font-weight:500;line-height:1.1;">2025</span>
                        <div style="flex:1;height:10px;background:#e5e7eb;border-radius:2px;overflow:hidden;">
                            <div style="background:${color2025};width:${p2025}%;height:100%;border-radius:2px;transition:width 0.4s ease;min-width:3px;"></div>
                        </div>
                        <span style="font-size:0.92em;color:#374151;width:50px;flex-shrink:0;text-align:right;font-weight:600;line-height:1.1;">
                            ${fmtComma(count2025)}/${fmtComma(total)}
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:0.88em;color:#6b7280;width:28px;flex-shrink:0;text-align:right;font-weight:500;line-height:1.1;">2050</span>
                        <div style="flex:1;height:10px;background:#e5e7eb;border-radius:2px;overflow:hidden;">
                            <div style="background:${color2050};width:${p2050}%;height:100%;border-radius:2px;transition:width 0.4s ease;min-width:3px;"></div>
                        </div>
                        <span style="font-size:0.92em;color:#374151;width:50px;flex-shrink:0;text-align:right;font-weight:600;line-height:1.1;">
                            ${fmtComma(count2050)}/${fmtComma(total)}
                        </span>
                    </div>
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
                <div style="border-left:4px solid #111827;padding-left:10px;margin-bottom:14px;">
                    <div style="font-weight:700;font-size:1.49em;color:#111827;line-height:1.2;margin-bottom:4px;">
                        ${props.COUNTY} COUNTY
                    </div>
                    <div style="font-size:0.97em;color:#374151;line-height:1.45;">
                        ${formatNumber(props.TOTAL_PARCELS)} parcels · <span style="font-weight:700;color:#dc2626;">${(props.PCT_PARCELS_RISK_2024 * 100).toFixed(1)}%</span> at risk in 2025, <span style="font-weight:700;color:#dc2626;">${(props.PCT_PARCELS_RISK_2050 * 100).toFixed(1)}%</span> by 2050
                    </div>
                </div>

                <!-- Economic Impact Section -->
                <div style="background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:10px 12px;margin-bottom:14px;">
                    <div style="font-weight:600;font-size:0.92em;color:#6b7280;margin-bottom:8px;letter-spacing:0.3px;text-transform:uppercase;">
                        Economic Risk
                    </div>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="padding:0 0 2px 0;"></td>
                            <td style="padding:0 0 2px 0;text-align:right;font-size:0.92em;color:#6b7280;font-weight:600;">2025</td>
                            <td style="padding:0 0 2px 6px;text-align:right;font-size:0.92em;color:#6b7280;font-weight:600;">2050</td>
                        </tr>
                        <tr style="border-bottom:1px solid #f3f4f6;">
                            <td style="padding:5px 0;font-size:1.01em;color:#374151;font-weight:500;">Market Value</td>
                            <td style="padding:5px 0;text-align:right;font-size:1.1em;color:#2e7d32;font-weight:700;">$${formatNumber(props.MARKET_VALUE_RISK_2024)}</td>
                            <td style="padding:5px 0 5px 6px;text-align:right;font-size:1.1em;color:#1b5e20;font-weight:700;">$${formatNumber(props.MARKET_VALUE_RISK_2050)}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0;font-size:1.01em;color:#374151;font-weight:500;">Tax Revenue</td>
                            <td style="padding:5px 0;text-align:right;font-size:1.1em;color:#2e7d32;font-weight:700;">$${formatNumber(props.TAX_RISK_2024)}</td>
                            <td style="padding:5px 0 5px 6px;text-align:right;font-size:1.1em;color:#1b5e20;font-weight:700;">$${formatNumber(props.TAX_RISK_2050)}</td>
                        </tr>
                    </table>
                </div>

                <!-- Displacement Risk Section -->
                <div style="flex:1;">
                    <div style="font-weight:600;font-size:1.1em;margin-bottom:6px;color:#111827;">
                        Displacement Risk (Parcel-Level)
                    </div>
                    <div style="font-size:0.95em;color:#6b7280;">
                        Each property is classified by flood exposure and financial capacity.
                    </div>
                    ${riskBar}

                    <!-- Risk Categories in Table Format -->
                    <table style="width:100%;border-collapse:collapse;">
                        <tr style="border-bottom:2px solid #d1d5db;">
                            <td style="padding:0 0 4px 0;font-size:0.92em;color:#6b7280;font-weight:600;">Group</td>
                            <td style="padding:0 0 4px 0;text-align:right;font-size:0.92em;color:#6b7280;font-weight:600;">Parcels</td>
                            <td style="padding:0 0 4px 8px;text-align:right;font-size:0.92em;color:#6b7280;font-weight:600;">%</td>
                        </tr>
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:5px 0;display:flex;align-items:center;gap:5px;">
                                <span style="display:inline-block;width:10px;height:10px;background:${riskColors.Crisis};border-radius:2px;flex-shrink:0;"></span>
                                <span style="color:${riskColors.Crisis};font-weight:600;font-size:1.01em;">Crisis</span>
                            </td>
                            <td style="padding:5px 0;text-align:right;color:${riskColors.Crisis};font-weight:600;font-size:1.01em;">
                                ${formatNumber(props.CRISIS_PARCELS)}
                            </td>
                            <td style="padding:5px 0 5px 8px;text-align:right;color:${riskColors.Crisis};font-weight:600;font-size:1.01em;">
                                ${(props.CRISIS_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:5px 0;display:flex;align-items:center;gap:5px;">
                                <span style="display:inline-block;width:10px;height:10px;background:${riskColors.Emigrating};border-radius:2px;flex-shrink:0;"></span>
                                <span style="color:${riskColors.Emigrating};font-weight:600;font-size:1.01em;">Emigrating</span>
                            </td>
                            <td style="padding:5px 0;text-align:right;color:${riskColors.Emigrating};font-weight:600;font-size:1.01em;">
                                ${formatNumber(props.EMIGRATING_PARCELS)}
                            </td>
                            <td style="padding:5px 0 5px 8px;text-align:right;color:${riskColors.Emigrating};font-weight:600;font-size:1.01em;">
                                ${(props.EMIGRATING_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:5px 0;display:flex;align-items:center;gap:5px;">
                                <span style="display:inline-block;width:10px;height:10px;background:${riskColors.Destination};border-radius:2px;flex-shrink:0;"></span>
                                <span style="color:${riskColors.Destination};font-weight:600;font-size:1.01em;">Destination</span>
                            </td>
                            <td style="padding:5px 0;text-align:right;color:${riskColors.Destination};font-weight:600;font-size:1.01em;">
                                ${formatNumber(props.DESTINATION_PARCELS)}
                            </td>
                            <td style="padding:5px 0 5px 8px;text-align:right;color:${riskColors.Destination};font-weight:600;font-size:1.01em;">
                                ${(props.DESTINATION_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0;display:flex;align-items:center;gap:5px;">
                                <span style="display:inline-block;width:10px;height:10px;background:${riskColors.Stable};border-radius:2px;flex-shrink:0;"></span>
                                <span style="color:${riskColors.Stable};font-weight:600;font-size:1.01em;">Stable</span>
                            </td>
                            <td style="padding:5px 0;text-align:right;color:${riskColors.Stable};font-weight:600;font-size:1.01em;">
                                ${formatNumber(props.STABLE_PARCELS)}
                            </td>
                            <td style="padding:5px 0 5px 8px;text-align:right;color:${riskColors.Stable};font-weight:600;font-size:1.01em;">
                                ${(props.STABLE_PARCELS_PCT * 100).toFixed(1)}%
                            </td>
                        </tr>
                    </table>
                </div>

                <!-- CTA Link -->
                <div style="margin-top:auto;padding-top:12px;border-top:2px solid #d1d5db;">
                    <a href="https://rebuildbydesign.org/nj-flood-risk" target="_blank"
                       style="font-weight:600;color:#dd4000;text-decoration:none;font-size:1.01em;display:inline-flex;align-items:center;gap:4px;">
                        📋 Explore Full Strategy →
                    </a>
                </div>
            </div>

            <!-- WIDE INFRASTRUCTURE PANEL (Right) -->
            <div style="background:#ffffff;flex:1;padding:18px 20px;overflow-y:auto;max-height:500px;">
                <div style="margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #e5e7eb;">
                    <div style="font-weight:700;font-size:1.21em;color:#111827;letter-spacing:0.01em;margin-bottom:6px;">
                        Public Assets in Flood-Prone Areas
                    </div>
                    <div style="font-size:0.97em;color:#374151;line-height:1.45;">
                        ${fmtComma(totalAssets)} public assets · <span style="font-weight:700;color:#dc2626;">${summaryPct2025}%</span> at risk in 2025, <span style="font-weight:700;color:#dc2626;">${summaryPct2050}%</span> by 2050
                    </div>
                </div>

                ${assetsAtRisk.length > 0 ? `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                        <div>${leftColumnHTML}</div>
                        <div>${rightColumnHTML}</div>
                    </div>
                    <div style="font-size:0.88em;color:#6b7280;line-height:1.3;margin-top:16px;padding-top:12px;border-top:1px solid #e5e7eb;font-style:italic;">
                        * Assets were analyzed with a 100-foot buffer and intersected with 2025 and 2050 floodplains to capture full impact on adjacent areas
                    </div>
                ` : '<div style="font-size:1.01em;color:#6b7280;font-style:italic;">No critical infrastructure at risk</div>'}
            </div>
        </div>
    `;
}

// --- Map Load Event ---
map.on('load', () => {
    // Hide loading indicator
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';

    // On desktop, use Mapbox padding to visually shift NJ left, clearing the finding card.
    // This is the correct approach — keeps NJ geographically centered, no broken coordinates.
    if (window.innerWidth > 1024) {
        map.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 410 }, duration: 0 });
    }

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
                const findingCard = document.getElementById('finding-card');

                // Hide the finding card while the county popup is open
                if (findingCard) findingCard.style.display = 'none';

                const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: "800px" })
                    .setLngLat(e.lngLat)
                    .setHTML(countyPopupHTML(feature.properties))
                    .addTo(map);

                // Restore the finding card when the popup is closed
                popup.on('close', () => {
                    if (findingCard) findingCard.style.display = '';
                });
            });

            // Hover tooltip for counties
            let hoverPopup = null;

            const toTitleCase = str => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

            const hoverHTML = (rawName) => {
                const name = toTitleCase(rawName);
                return `
                    <div style="font-size:0.8em;color:#555;margin-bottom:1px;line-height:1.2;">Click to learn more</div>
                    <div style="font-size:0.9em;font-weight:700;color:#111;line-height:1.2;">${name} County</div>
                `;
            };

            map.on('mouseenter', 'county-fills', (e) => {
                map.getCanvas().style.cursor = 'pointer';
                const countyName = e.features[0].properties.COUNTY;
                hoverPopup = new mapboxgl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    offset: [0, -8],
                    className: 'county-hover-tooltip'
                })
                .setLngLat(e.lngLat)
                .setHTML(hoverHTML(countyName))
                .addTo(map);
            });

            map.on('mousemove', 'county-fills', (e) => {
                if (hoverPopup) {
                    const countyName = e.features[0].properties.COUNTY;
                    hoverPopup.setLngLat(e.lngLat);
                    hoverPopup.setHTML(hoverHTML(countyName));
                }
            });

            map.on('mouseleave', 'county-fills', () => {
                map.getCanvas().style.cursor = '';
                if (hoverPopup) {
                    hoverPopup.remove();
                    hoverPopup = null;
                }
            });

            // Remove hover tooltip when county popup opens
            map.on('click', 'county-fills', () => {
                if (hoverPopup) {
                    hoverPopup.remove();
                    hoverPopup = null;
                }
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
            color: '#00e1ff' // Teal blue marker — stands out from warm risk palette
        },
        countries: 'us',
        bbox: [-75.559614, 38.928519, -73.893979, 41.357423],
        placeholder: 'Enter Address Here',
        flyTo: false // Disable built-in flyTo — we handle it manually so padding is respected
    });

    // After geocoder result: fly with padding so marker lands at visual center,
    // hide the finding card, and show a county hint popup
    let geocoderHint = null;
    geocoder.on('result', (e) => {
        const coords = e.result.center;
        const findingCard = document.getElementById('finding-card');

        // Hide finding card while a searched location is active
        if (findingCard) findingCard.style.display = 'none';

        // Fly to result with the same right padding so the pin sits at visual center
        map.flyTo({
            center: coords,
            zoom: 10.5,
            padding: { top: 0, bottom: 0, left: 0, right: window.innerWidth > 1024 ? 410 : 0 },
            speed: 1.2,
            curve: 1
        });

        // Remove any previous hint
        if (geocoderHint) { geocoderHint.remove(); geocoderHint = null; }

        // Show hint popup below the marker
        geocoderHint = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            offset: [0, 12],
            anchor: 'top',
            className: 'geocoder-hint-popup'
        })
        .setLngLat(coords)
        .setHTML(`<span style="font-size:0.84em;color:#111;font-weight:500;">Click on a county to explore flood risk & infrastructure data</span>`)
        .addTo(map);

        // Auto-dismiss hint after 6 seconds
        setTimeout(() => {
            if (geocoderHint) { geocoderHint.remove(); geocoderHint = null; }
        }, 6000);
    });

    // Restore finding card when geocoder is cleared
    geocoder.on('clear', () => {
        const findingCard = document.getElementById('finding-card');
        if (findingCard) findingCard.style.display = '';
    });

    // Clear hint when user clicks a county
    map.on('click', 'county-fills', () => {
        if (geocoderHint) { geocoderHint.remove(); geocoderHint = null; }
    });

    // Mount geocoder directly into the sidebar Step 2 container
    const geocoderContainer = document.getElementById('geocoder-container');
    if (geocoderContainer) {
        geocoderContainer.appendChild(geocoder.onAdd(map));
    }
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