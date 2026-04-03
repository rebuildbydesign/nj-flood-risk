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
const isIframe = window.self !== window.top;
const desktopRightPadding = 760;
let mapCenter = [-74.3, 40.15205];
let mapZoom = 7.5;

if (window.innerWidth <= 600 && !isIframe) {
    // Mobile (standalone): finding card is hidden, keep NJ centered
    mapCenter = [-74.3, 39.9];
    mapZoom = 6.65;
} else if (isIframe) {
    // Iframe/modal embed: center on NJ without sidebar offset, show full state
    mapCenter = [-74.4, 40.0];
    mapZoom = 7.7;
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

// --- Blue Acres State ---
let blueAcresVisible = false;

// Pre-computed Blue Acres stats per county
const blueAcresCountyStats = {
    'Atlantic':   { count: 20,  acres: 31.8 },
    'Bergen':     { count: 54,  acres: 10.8 },
    'Burlington': { count: 56,  acres: 65.7 },
    'Cumberland': { count: 131, acres: 55.1 },
    'Essex':      { count: 25,  acres: 5.0 },
    'Hunterdon':  { count: 6,   acres: 5.8 },
    'Middlesex':  { count: 579, acres: 74.6 },
    'Monmouth':   { count: 19,  acres: 14.8 },
    'Morris':     { count: 119, acres: 28.0 },
    'Passaic':    { count: 191, acres: 34.2 },
    'Somerset':   { count: 398, acres: 36.7 },
    'Union':      { count: 53,  acres: 8.8 },
    'Warren':     { count: 26,  acres: 16.9 }
};
const blueAcresTotalCount = 1677;
const blueAcresTotalAcres = 388.1;

// --- County → Featured City cross-link mapping ---
const countyToCity = {
    'ESSEX':    { name: 'Newark',        key: 'NEWARK CITY' },
    'UNION':    { name: 'Elizabeth',     key: 'ELIZABETH CITY' },
    'CAMDEN':   { name: 'Camden',        key: 'CAMDEN CITY' },
    'MERCER':   { name: 'Trenton',       key: 'TRENTON CITY' },
    'HUDSON':   { name: 'Jersey City',   key: 'JERSEY CITY' },
    'PASSAIC':  { name: 'Paterson',      key: 'PATERSON CITY' },
    'MONMOUTH': { name: 'Asbury Park',   key: 'ASBURY PARK CITY' },
    'ATLANTIC': { name: 'Atlantic City', key: 'ATLANTIC CITY' }
};

function countyFactSheetURL(countyName) {
    if (!countyName) return 'https://rebuildbydesign.org/nj-flood-risk';
    const slug = countyName
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('_');
    return `https://rebuildbydesign.org/wp-content/uploads/NJ_Under_Water_${slug}_County.pdf`;
}

// --- V2 POPUP HTML FUNCTION ---
function countyPopupHTML(props) {
    // Blue Acres stats for this county
    const countyNameTitleCase = props.COUNTY.charAt(0) + props.COUNTY.slice(1).toLowerCase();
    const baStats = blueAcresCountyStats[countyNameTitleCase];
    const baHTML = baStats ? `
        <div style="background:#1a332e;border-left:3px solid #2dd4a8;padding:5px 8px;">
            <div style="font-weight:600;font-size:0.8em;color:#2dd4a8;margin-bottom:2px;letter-spacing:0.3px;text-transform:uppercase;">Blue Acres Buyouts</div>
            <div style="font-size:0.9em;color:#e0e0e0;font-weight:700;">${baStats.count.toLocaleString()} parcels · ${baStats.acres.toFixed(1)} acres</div>
            <div style="font-size:0.75em;color:#888888;margin-top:2px;font-style:italic;">Part of ${blueAcresTotalCount.toLocaleString()} statewide buyouts since 1987</div>
        </div>
    ` : `
        <div style="background:#2a2a2a;border-left:3px solid #4a4a4a;padding:5px 8px;">
            <div style="font-weight:600;font-size:0.8em;color:#888888;margin-bottom:2px;letter-spacing:0.3px;text-transform:uppercase;">Blue Acres Buyouts</div>
            <div style="font-size:0.8em;color:#888888;font-style:italic;">No acquisitions in this county</div>
        </div>
    `;

    // Population-based displacement bar
    const totalPop = Number(props.TOTAL_POPULATION) || 1;
    const crisisPopPct = (Number(props.CRISIS_POPULATION) / totalPop * 100);
    const emigratingPopPct = (Number(props.EMIGRATING_POPULATION) / totalPop * 100);
    const destinationPopPct = (Number(props.DESTINATION_POPULATION) / totalPop * 100);
    const stablePopPct = (Number(props.STABLE_POPULATION) / totalPop * 100);

    const riskBar = `
        <div style="display:flex;height:18px;border-radius:0;overflow:hidden;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.3);">
            <div style="width:${crisisPopPct.toFixed(0)}%;background:${riskColors.Crisis};"></div>
            <div style="width:${emigratingPopPct.toFixed(0)}%;background:${riskColors.Emigrating};"></div>
            <div style="width:${destinationPopPct.toFixed(0)}%;background:${riskColors.Destination};"></div>
            <div style="width:${stablePopPct.toFixed(0)}%;background:${riskColors.Stable};"></div>
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
        },
        {
            label: '👮 Police Stations',
            total: props.TOTAL_POLICE_STATION,
            count2025: props.POLICE_STATION_2025,
            pct2025: props.PCT_POLICE_STATION_2025,
            count2050: props.POLICE_STATION_2050,
            pct2050: props.PCT_POLICE_STATION_2050
        },
        {
            label: '🚒 Fire Departments',
            total: props.TOTAL_FIRE_DEPARTMENT,
            count2025: props.FIRE_DEPARTMENT_2025,
            pct2025: props.PCT_FIRE_DEPARTMENT_2025,
            count2050: props.FIRE_DEPARTMENT_2050,
            pct2050: props.PCT_FIRE_DEPARTMENT_2050
        }
    ];

    // Filter to only show assets with risk, then sort by 2050 risk percentage (highest first)
    const assetsAtRisk = assets.filter(asset => {
        const hasTotal = asset.total && Number(asset.total) > 0;
        const has2025Risk = asset.count2025 && Number(asset.count2025) > 0;
        const has2050Risk = asset.count2050 && Number(asset.count2050) > 0;
        return hasTotal && (has2025Risk || has2050Risk);
    }).sort((a, b) => (Number(b.pct2050) || 0) - (Number(a.pct2050) || 0));

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
            <div style="margin-bottom:6px;padding:6px 8px;background:#2a2a2a;border:1px solid #3a3a3a;">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                    <span style="font-size:0.9em;font-weight:600;color:#e0e0e0;">${label}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:3px;">
                    <div style="display:flex;align-items:center;gap:5px;">
                        <span style="font-size:0.85em;color:#888888;width:26px;flex-shrink:0;text-align:right;font-weight:500;">2025</span>
                        <div style="flex:1;height:8px;background:#3a3a3a;overflow:hidden;">
                            <div style="background:${color2025};width:${p2025}%;height:100%;transition:width 0.4s ease;min-width:3px;"></div>
                        </div>
                        <span style="font-size:0.85em;color:#b0b0b0;width:55px;flex-shrink:0;text-align:right;font-weight:600;">
                            ${fmtComma(count2025)}/${fmtComma(total)}
                        </span>
                    </div>
                    <div style="display:flex;align-items:center;gap:5px;">
                        <span style="font-size:0.85em;color:#888888;width:26px;flex-shrink:0;text-align:right;font-weight:500;">2050</span>
                        <div style="flex:1;height:8px;background:#3a3a3a;overflow:hidden;">
                            <div style="background:${color2050};width:${p2050}%;height:100%;transition:width 0.4s ease;min-width:3px;"></div>
                        </div>
                        <span style="font-size:0.85em;color:#b0b0b0;width:55px;flex-shrink:0;text-align:right;font-weight:600;">
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

    const featuredCity = countyToCity[props.COUNTY];
    const factSheetURL = countyFactSheetURL(props.COUNTY);
    const cityLinkHTML = featuredCity ? `
        <a href="https://rebuildbydesign.github.io/nj-flood-risk-city/?city=${encodeURIComponent(featuredCity.key)}" target="_blank"
           style="font-weight:700;color:#e0e0e0;text-decoration:none;font-size:1em;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 12px;background:#1a1a1a;border:1px solid #888888;border-radius:0;transition:background 0.2s ease,border-color 0.2s ease;letter-spacing:0.3px;text-transform:uppercase;"
           onmouseover="this.style.background='#2a2a2a';this.style.borderColor='#b0b0b0';"
           onmouseout="this.style.background='#1a1a1a';this.style.borderColor='#888888';">
            Explore ${featuredCity.name} Data →
        </a>` : '';

    return `
        <div style="display:flex;font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;font-size:14px;width:740px;max-width:90vw;background:#1f1f1f;border-radius:0;overflow:hidden;max-height:80vh;">

            <!-- LEFT PANEL -->
            <div style="background:#2a2a2a;color:#e0e0e0;width:250px;min-width:250px;padding:12px 12px;display:flex;flex-direction:column;border-right:2px solid #3a3a3a;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#555 transparent;">
                <!-- County Header -->
                <div style="border-left:4px solid #e0e0e0;padding-left:10px;margin-bottom:8px;">
                    <div style="font-weight:700;font-size:1.4em;color:#e0e0e0;line-height:1.2;margin-bottom:2px;">${props.COUNTY} COUNTY</div>
                    <div style="font-size:0.9em;color:#b0b0b0;line-height:1.35;">
                        ${formatNumber(props.TOTAL_PARCELS)} parcels · <span style="font-weight:700;color:#f87171;">${Number(props.PCT_PARCELS_RISK_2024).toFixed(1)}%</span> at risk in 2025, <span style="font-weight:700;color:#f87171;">${Number(props.PCT_PARCELS_RISK_2050).toFixed(1)}%</span> by 2050
                    </div>
                </div>

                <!-- Economic Impact -->
                <div style="background:#1f1f1f;border:1px solid #3a3a3a;padding:6px 8px;margin-bottom:8px;">
                    <div style="font-weight:600;font-size:0.85em;color:#888888;margin-bottom:4px;letter-spacing:0.3px;text-transform:uppercase;">Economic Risk</div>
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td></td>
                            <td style="text-align:right;font-size:0.85em;color:#888888;font-weight:600;padding-bottom:2px;">2025</td>
                            <td style="text-align:right;font-size:0.85em;color:#888888;font-weight:600;padding:0 0 2px 4px;">2050</td>
                        </tr>
                        <tr>
                            <td style="padding:3px 0;font-size:0.9em;color:#b0b0b0;">Market Value</td>
                            <td style="padding:3px 0;text-align:right;font-size:1em;color:#f87171;font-weight:700;">$${formatNumber(props.MARKET_VALUE_RISK_2024)}</td>
                            <td style="padding:3px 0 3px 4px;text-align:right;font-size:1em;color:#f87171;font-weight:700;">$${formatNumber(props.MARKET_VALUE_RISK_2050)}</td>
                        </tr>
                        <tr>
                            <td style="padding:3px 0;font-size:0.9em;color:#b0b0b0;">Tax Revenue</td>
                            <td style="padding:3px 0;text-align:right;font-size:1em;color:#f87171;font-weight:700;">$${formatNumber(props.TAX_RISK_2024)}</td>
                            <td style="padding:3px 0 3px 4px;text-align:right;font-size:1em;color:#f87171;font-weight:700;">$${formatNumber(props.TAX_RISK_2050)}</td>
                        </tr>
                    </table>
                </div>

                <!-- Displacement Risk -->
                <div style="margin-bottom:8px;">
                    <div style="font-weight:600;font-size:0.9em;margin-bottom:3px;color:#e0e0e0;">Displacement Risk</div>
                    <div style="font-size:0.8em;color:#888888;margin-bottom:4px;">${formatNumber(props.TOTAL_POPULATION)} people</div>
                    ${riskBar}
                    <table style="width:100%;border-collapse:collapse;">
                        <tr>
                            <td style="padding:0 0 2px 0;font-size:0.85em;color:#888888;font-weight:600;">Group</td>
                            <td style="padding:0 0 2px 0;text-align:right;font-size:0.85em;color:#888888;font-weight:600;">People</td>
                            <td style="padding:0 0 2px 4px;text-align:right;font-size:0.85em;color:#888888;font-weight:600;">%</td>
                        </tr>
                        <tr>
                            <td style="padding:3px 0;display:flex;align-items:center;gap:4px;">
                                <span style="display:inline-block;width:8px;height:8px;background:${riskColors.Crisis};flex-shrink:0;"></span>
                                <span style="color:${riskColors.Crisis};font-weight:600;font-size:0.85em;">High Risk, Lower Inc.</span>
                            </td>
                            <td style="padding:3px 0;text-align:right;color:${riskColors.Crisis};font-weight:600;font-size:0.9em;">${formatNumber(props.CRISIS_POPULATION)}</td>
                            <td style="padding:3px 0 3px 4px;text-align:right;color:${riskColors.Crisis};font-weight:600;font-size:0.9em;">${crisisPopPct.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td style="padding:3px 0;display:flex;align-items:center;gap:4px;">
                                <span style="display:inline-block;width:8px;height:8px;background:${riskColors.Emigrating};flex-shrink:0;"></span>
                                <span style="color:${riskColors.Emigrating};font-weight:600;font-size:0.85em;">High Risk, Higher Inc.</span>
                            </td>
                            <td style="padding:3px 0;text-align:right;color:${riskColors.Emigrating};font-weight:600;font-size:0.9em;">${formatNumber(props.EMIGRATING_POPULATION)}</td>
                            <td style="padding:3px 0 3px 4px;text-align:right;color:${riskColors.Emigrating};font-weight:600;font-size:0.9em;">${emigratingPopPct.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td style="padding:3px 0;display:flex;align-items:center;gap:4px;">
                                <span style="display:inline-block;width:8px;height:8px;background:${riskColors.Destination};flex-shrink:0;"></span>
                                <span style="color:${riskColors.Destination};font-weight:600;font-size:0.85em;">Low Risk, Lower Inc.</span>
                            </td>
                            <td style="padding:3px 0;text-align:right;color:${riskColors.Destination};font-weight:600;font-size:0.9em;">${formatNumber(props.DESTINATION_POPULATION)}</td>
                            <td style="padding:3px 0 3px 4px;text-align:right;color:${riskColors.Destination};font-weight:600;font-size:0.9em;">${destinationPopPct.toFixed(1)}%</td>
                        </tr>
                        <tr>
                            <td style="padding:3px 0;display:flex;align-items:center;gap:4px;">
                                <span style="display:inline-block;width:8px;height:8px;background:${riskColors.Stable};flex-shrink:0;"></span>
                                <span style="color:${riskColors.Stable};font-weight:600;font-size:0.85em;">Low Risk, Higher Inc.</span>
                            </td>
                            <td style="padding:3px 0;text-align:right;color:${riskColors.Stable};font-weight:600;font-size:0.9em;">${formatNumber(props.STABLE_POPULATION)}</td>
                            <td style="padding:3px 0 3px 4px;text-align:right;color:${riskColors.Stable};font-weight:600;font-size:0.9em;">${stablePopPct.toFixed(1)}%</td>
                        </tr>
                    </table>
                </div>

                <!-- Blue Acres -->
                ${baHTML}

                <!-- CTA -->
                <div style="margin-top:auto;padding-top:8px;display:flex;flex-direction:column;gap:4px;">
                    <a href="${factSheetURL}" target="_blank" rel="noopener noreferrer"
                       style="font-weight:700;color:#e0e0e0;text-decoration:none;font-size:0.9em;display:flex;align-items:center;justify-content:center;gap:5px;padding:6px 10px;background:#1a1a1a;border:1px solid #888888;border-radius:0;transition:background 0.2s ease,border-color 0.2s ease;letter-spacing:0.3px;text-transform:uppercase;"
                       onmouseover="this.style.background='#2a2a2a';this.style.borderColor='#b0b0b0';"
                       onmouseout="this.style.background='#1a1a1a';this.style.borderColor='#888888';">
                        Download Fact Sheet →
                    </a>
                </div>
            </div>

            <!-- RIGHT PANEL -->
            <div style="background:#1f1f1f;width:430px;padding:12px 14px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:#555 transparent;">
                <div style="margin-bottom:10px;">
                    <div style="font-weight:700;font-size:1em;color:#e0e0e0;margin-bottom:3px;">Public Assets in Flood-Prone Areas</div>
                    <div style="font-size:0.9em;color:#b0b0b0;line-height:1.35;">
                        ${fmtComma(totalAssets)} assets · <span style="font-weight:700;color:#f87171;">${summaryPct2025}%</span> at risk in 2025, <span style="font-weight:700;color:#f87171;">${summaryPct2050}%</span> by 2050
                    </div>
                </div>

                ${assetsAtRisk.length > 0 ? `
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
                        <div>${leftColumnHTML}</div>
                        <div>${rightColumnHTML}</div>
                    </div>
                    <div style="font-size:0.8em;color:#888888;line-height:1.3;margin-top:8px;font-style:italic;">
                        * 100-ft buffer analysis intersected with 2025 &amp; 2050 floodplains
                    </div>
                ` : '<div style="font-size:0.9em;color:#888888;font-style:italic;">No critical infrastructure at risk</div>'}
                ${cityLinkHTML ? `<div style="margin-top:10px;">${cityLinkHTML}</div>` : ''}
            </div>
        </div>
    `;
}

// --- Map Load Event ---
map.on('load', () => {
    // Hide loading indicator
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';

    // On desktop (not iframe), use Mapbox padding to visually shift NJ left, clearing the finding card.
    // This is the correct approach — keeps NJ geographically centered, no broken coordinates.
    if (window.innerWidth > 1024 && !isIframe) {
        map.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: desktopRightPadding }, duration: 0 });
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
            minzoom: 7,
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
            minzoom: 7,
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

            // Popup on click (V2 style) — desktop vs mobile
            map.on('click', 'county-fills', (e) => {
                const feature = e.features[0];
                const findingCard = document.getElementById('finding-card');

                if (window.innerWidth <= 1024) {
                    // MOBILE/TABLET: show bottom sheet instead of Mapbox popup
                    openMobileCountySheet(feature.properties);
                } else {
                    // DESKTOP: classic Mapbox popup
                    if (findingCard) findingCard.style.display = 'none';

                    const popup = new mapboxgl.Popup({
                        closeButton: true,
                        maxWidth: "780px"
                    })
                        .setLngLat(e.lngLat)
                        .setHTML(countyPopupHTML(feature.properties))
                        .addTo(map);

                    popup.on('close', () => {
                        if (findingCard) findingCard.style.display = '';
                    });
                }
            });

            // Hover tooltip for counties
            let hoverPopup = null;

            const toTitleCase = str => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

            const hoverHTML = (rawName) => {
                const name = toTitleCase(rawName);
                return `
                    <div style="font-size:0.8em;color:#888888;margin-bottom:1px;line-height:1.2;">Click to learn more</div>
                    <div style="font-size:0.9em;font-weight:700;color:#e0e0e0;line-height:1.2;">${name} County</div>
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
            const layerId = group.toLowerCase();

            if (isActive) {
                // Deactivate this group
                btn.classList.remove('active');
                if (map.getLayer(`${layerId}-fill`)) map.setLayoutProperty(`${layerId}-fill`, 'visibility', 'none');
                if (map.getLayer(`${layerId}-outline`)) map.setLayoutProperty(`${layerId}-outline`, 'visibility', 'none');
            } else {
                // Activate this group
                btn.classList.add('active');
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
    // hide the finding card, and auto-open the county popup to the right of the pin
    let geocoderCountyPopup = null;
    geocoder.on('result', (e) => {
        const coords = e.result.center;
        const findingCard = document.getElementById('finding-card');

        // Hide finding card while a searched location is active
        if (findingCard) findingCard.style.display = 'none';

        // Remove any previous geocoder county popup
        if (geocoderCountyPopup) { geocoderCountyPopup.remove(); geocoderCountyPopup = null; }

        // Fly to result with the same right padding so the pin sits at visual center
        map.flyTo({
            center: coords,
            zoom: 10.5,
            padding: { top: 0, bottom: 0, left: 0, right: window.innerWidth > 1024 ? desktopRightPadding : 0 },
            speed: 1.2,
            curve: 1
        });

        // After fly animation completes, find the county and auto-open its popup
        map.once('moveend', () => {
            // Query the county-fills layer at the searched point
            const point = map.project(coords);
            const features = map.queryRenderedFeatures(point, { layers: ['county-fills'] });

            if (features && features.length > 0) {
                const feature = features[0];

                if (window.innerWidth <= 1024) {
                    // MOBILE/TABLET: use bottom sheet
                    openMobileCountySheet(feature.properties);
                } else {
                    // DESKTOP: popup to the right of the pin
                    geocoderCountyPopup = new mapboxgl.Popup({
                        closeButton: true,
                        maxWidth: "780px",
                        anchor: 'left',
                        offset: [25, 0]
                    })
                    .setLngLat(coords)
                    .setHTML(countyPopupHTML(feature.properties))
                    .addTo(map);

                    geocoderCountyPopup.on('close', () => {
                        if (findingCard) findingCard.style.display = '';
                        geocoderCountyPopup = null;
                    });
                }
            }
        });
    });

    // Restore finding card when geocoder is cleared
    geocoder.on('clear', () => {
        const findingCard = document.getElementById('finding-card');
        if (findingCard) findingCard.style.display = '';
        // Also remove geocoder county popup if open
        if (geocoderCountyPopup) { geocoderCountyPopup.remove(); geocoderCountyPopup = null; }
        // Close mobile sheet if open
        if (typeof closeMobileCountySheet === 'function') closeMobileCountySheet();
    });

    // Close geocoder county popup when user clicks a different county
    map.on('click', 'county-fills', () => {
        if (geocoderCountyPopup) { geocoderCountyPopup.remove(); geocoderCountyPopup = null; }
    });

    // Mount geocoder directly into the sidebar Step 2 container
    const geocoderContainer = document.getElementById('geocoder-container');
    if (geocoderContainer) {
        geocoderContainer.appendChild(geocoder.onAdd(map));
    }
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // ======================================
    // 6. BLUE ACRES LAYERS
    // ======================================

    // Add Blue Acres polygon source
    map.addSource('blueacres', {
        type: 'geojson',
        data: 'data/blueacres.geojson'
    });

    // Add Blue Acres centroid source (clustered)
    map.addSource('blueacres-centroids', {
        type: 'geojson',
        data: 'data/blueacres_centroids.geojson',
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 60
    });

    // Blue Acres fill layer
    map.addLayer({
        id: 'blueacres-fill',
        type: 'fill',
        source: 'blueacres',
        paint: {
            'fill-color': '#0d9488',
            'fill-opacity': 0.45
        },
        layout: { visibility: 'none' }
    });

    // Blue Acres outline layer
    map.addLayer({
        id: 'blueacres-outline',
        type: 'line',
        source: 'blueacres',
        paint: {
            'line-color': '#0f766e',
            'line-width': 1.5,
            'line-opacity': 0.8
        },
        layout: { visibility: 'none' }
    });

    // Cluster circles
    map.addLayer({
        id: 'blueacres-clusters',
        type: 'circle',
        source: 'blueacres-centroids',
        filter: ['has', 'point_count'],
        paint: {
            'circle-color': '#0d9488',
            'circle-opacity': 0.9,
            'circle-radius': [
                'step', ['get', 'point_count'],
                16, 10, 22, 50, 30, 200, 38
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff'
        },
        layout: { visibility: 'none' }
    });

    // Cluster count labels
    map.addLayer({
        id: 'blueacres-cluster-count',
        type: 'symbol',
        source: 'blueacres-centroids',
        filter: ['has', 'point_count'],
        layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 13,
            visibility: 'none'
        },
        paint: {
            'text-color': '#ffffff'
        }
    });

    // Unclustered individual points — fade out as you zoom in so parcel polygons take over
    map.addLayer({
        id: 'blueacres-unclustered',
        type: 'circle',
        source: 'blueacres-centroids',
        filter: ['!', ['has', 'point_count']],
        paint: {
            'circle-color': '#0d9488',
            'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                13, 5,
                15, 3,
                16, 0
            ],
            'circle-stroke-width': [
                'interpolate', ['linear'], ['zoom'],
                13, 1.5,
                15, 0.5,
                16, 0
            ],
            'circle-stroke-color': '#fff',
            'circle-opacity': [
                'interpolate', ['linear'], ['zoom'],
                13, 0.9,
                15, 0.4,
                16, 0
            ]
        },
        layout: { visibility: 'none' }
    });

    // Blue Acres hover popup
    let blueAcresPopup = null;

    map.on('mouseenter', 'blueacres-fill', (e) => {
        if (!blueAcresVisible) return;
        map.getCanvas().style.cursor = 'pointer';
        const props = e.features[0].properties;
        const name = props.NAME_LABEL || props.FEE_SIMPLE || 'Blue Acres Parcel';
        const use = props.USE_LABEL || '';
        const acres = props.GISACRES ? Number(props.GISACRES).toFixed(2) : '–';
        const date = props.PRESERVATI ? props.PRESERVATI.substring(0, 10) : '–';
        const muni = props.MUNICIPALI || '';

        blueAcresPopup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -5]
        })
        .setLngLat(e.lngLat)
        .setHTML(`
            <div style="font-size:0.85em;line-height:1.45;max-width:220px;">
                <div style="font-weight:700;color:#0d9488;margin-bottom:2px;">🌿 ${name}</div>
                <div style="color:#555;">${muni} · ${use}</div>
                <div style="color:#555;">${acres} acres · Preserved ${date}</div>
            </div>
        `)
        .addTo(map);
    });

    map.on('mousemove', 'blueacres-fill', (e) => {
        if (blueAcresPopup) blueAcresPopup.setLngLat(e.lngLat);
    });

    map.on('mouseleave', 'blueacres-fill', () => {
        map.getCanvas().style.cursor = '';
        if (blueAcresPopup) {
            blueAcresPopup.remove();
            blueAcresPopup = null;
        }
    });

    // Cluster click → zoom in
    map.on('click', 'blueacres-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['blueacres-clusters'] });
        const clusterId = features[0].properties.cluster_id;
        map.getSource('blueacres-centroids').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom });
        });
    });

    // Toggle Blue Acres visibility
    const blueAcresToggle = document.getElementById('toggle-blue-acres');

    // Ensure Blue Acres layers render on top of displacement layers
    function ensureBlueAcresOnTop() {
        if (blueAcresVisible) {
            ['blueacres-fill', 'blueacres-outline', 'blueacres-clusters',
             'blueacres-cluster-count', 'blueacres-unclustered'].forEach(id => {
                if (map.getLayer(id)) map.moveLayer(id);
            });
        }
    }

    const blueAcresPill = document.getElementById('blue-acres-pill');
    if (blueAcresPill) {
        blueAcresPill.addEventListener('click', () => {
            blueAcresToggle.checked = !blueAcresToggle.checked;
            blueAcresVisible = blueAcresToggle.checked;
            blueAcresPill.classList.toggle('active', blueAcresVisible);
            const vis = blueAcresVisible ? 'visible' : 'none';

            ['blueacres-fill', 'blueacres-outline', 'blueacres-clusters',
             'blueacres-cluster-count', 'blueacres-unclustered'].forEach(id => {
                if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
            });

            // Ensure BA layers render on top of displacement layers
            ensureBlueAcresOnTop();
        });
    }

    // Finding card close button
    const findingClose = document.getElementById('finding-close');
    if (findingClose) {
        findingClose.addEventListener('click', () => {
            const card = document.getElementById('finding-card');
            if (card) card.style.display = 'none';
        });
    }
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

// --- Methodology modal: ESC key support ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && howtoModal && !howtoModal.classList.contains('hidden')) {
        howtoModal.classList.add('hidden');
    }
});

// ======================================
// MOBILE / TABLET: Sidebar Toggle
// ======================================
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');

if (sidebarToggle && sidebar) {
    const toggleLabel = sidebarToggle.querySelector('.sidebar-toggle-label');
    sidebarToggle.addEventListener('click', () => {
        if (sidebar.classList.contains('collapsed')) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.add('expanded');
            if (toggleLabel) toggleLabel.textContent = 'Click to Hide Map Controls';
        } else {
            sidebar.classList.remove('expanded');
            sidebar.classList.add('collapsed');
            if (toggleLabel) toggleLabel.textContent = 'Click to Explore Map Controls';
        }
    });
}

// ======================================
// MOBILE / TABLET: County Bottom Sheet
// ======================================

// Build the "Displacement" tab content HTML
function mobileDisplacementHTML(props) {
    const countyNameTitleCase = props.COUNTY.charAt(0) + props.COUNTY.slice(1).toLowerCase();
    const baStats = blueAcresCountyStats[countyNameTitleCase];
    const factSheetURL = countyFactSheetURL(props.COUNTY);

    // Population-based displacement
    const totalPop = Number(props.TOTAL_POPULATION) || 1;
    const crisisPopPct = (Number(props.CRISIS_POPULATION) / totalPop * 100);
    const emigratingPopPct = (Number(props.EMIGRATING_POPULATION) / totalPop * 100);
    const destinationPopPct = (Number(props.DESTINATION_POPULATION) / totalPop * 100);
    const stablePopPct = (Number(props.STABLE_POPULATION) / totalPop * 100);

    const riskBar = `
        <div style="display:flex;height:14px;overflow:hidden;margin:6px 0 10px 0;box-shadow:0 1px 3px rgba(0,0,0,0.3);">
            <div style="width:${crisisPopPct.toFixed(0)}%;background:${riskColors.Crisis};"></div>
            <div style="width:${emigratingPopPct.toFixed(0)}%;background:${riskColors.Emigrating};"></div>
            <div style="width:${destinationPopPct.toFixed(0)}%;background:${riskColors.Destination};"></div>
            <div style="width:${stablePopPct.toFixed(0)}%;background:${riskColors.Stable};"></div>
        </div>
    `;

    const groups = [
        { label: 'High Risk, Lower Inc.', color: riskColors.Crisis, count: props.CRISIS_POPULATION, pct: crisisPopPct },
        { label: 'High Risk, Higher Inc.', color: riskColors.Emigrating, count: props.EMIGRATING_POPULATION, pct: emigratingPopPct },
        { label: 'Low Risk, Lower Inc.', color: riskColors.Destination, count: props.DESTINATION_POPULATION, pct: destinationPopPct },
        { label: 'Low Risk, Higher Inc.', color: riskColors.Stable, count: props.STABLE_POPULATION, pct: stablePopPct }
    ];

    const groupRows = groups.map(g => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a2a;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="display:inline-block;width:10px;height:10px;background:${g.color};flex-shrink:0;"></span>
                <span style="color:${g.color};font-weight:600;font-size:0.85em;">${g.label}</span>
            </div>
            <span style="color:#b0b0b0;font-size:0.85em;font-weight:600;">${formatNumber(g.count)} people (${g.pct.toFixed(1)}%)</span>
        </div>
    `).join('');

    const baHTML = baStats ? `
        <div style="background:#1a332e;border-left:3px solid #2dd4a8;padding:8px 10px;margin-top:12px;">
            <div style="font-weight:600;font-size:0.78em;color:#2dd4a8;letter-spacing:0.3px;text-transform:uppercase;margin-bottom:2px;">Blue Acres Buyouts</div>
            <div style="font-size:0.9em;color:#e0e0e0;font-weight:700;">${baStats.count.toLocaleString()} parcels · ${baStats.acres.toFixed(1)} acres</div>
        </div>
    ` : '';

    return `
        <div style="font-family:Arial,sans-serif;color:#e0e0e0;">
            <!-- Summary -->
            <div style="font-size:0.9em;color:#b0b0b0;margin-bottom:10px;">
                ${formatNumber(props.TOTAL_PARCELS)} parcels · <span style="font-weight:700;color:#f87171;">${Number(props.PCT_PARCELS_RISK_2024).toFixed(1)}%</span> at risk in 2025, <span style="font-weight:700;color:#f87171;">${Number(props.PCT_PARCELS_RISK_2050).toFixed(1)}%</span> by 2050
            </div>

            <!-- Economic Risk -->
            <div style="background:#2a2a2a;padding:8px 10px;margin-bottom:10px;border:1px solid #3a3a3a;">
                <div style="font-weight:600;font-size:0.78em;color:#888;letter-spacing:0.3px;text-transform:uppercase;margin-bottom:6px;">Economic Risk</div>
                <table style="width:100%;border-collapse:collapse;">
                    <tr>
                        <td></td>
                        <td style="text-align:right;font-size:0.85em;color:#888;font-weight:600;padding-bottom:2px;">2025</td>
                        <td style="text-align:right;font-size:0.85em;color:#888;font-weight:600;padding:0 0 2px 4px;">2050</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;font-size:0.9em;color:#b0b0b0;">Market Value</td>
                        <td style="padding:3px 0;text-align:right;font-size:0.95em;color:#f87171;font-weight:700;">$${formatNumber(props.MARKET_VALUE_RISK_2024)}</td>
                        <td style="padding:3px 0 3px 4px;text-align:right;font-size:0.95em;color:#f87171;font-weight:700;">$${formatNumber(props.MARKET_VALUE_RISK_2050)}</td>
                    </tr>
                    <tr>
                        <td style="padding:3px 0;font-size:0.9em;color:#b0b0b0;">Tax Revenue</td>
                        <td style="padding:3px 0;text-align:right;font-size:0.95em;color:#f87171;font-weight:700;">$${formatNumber(props.TAX_RISK_2024)}</td>
                        <td style="padding:3px 0 3px 4px;text-align:right;font-size:0.95em;color:#f87171;font-weight:700;">$${formatNumber(props.TAX_RISK_2050)}</td>
                    </tr>
                </table>
            </div>

            <!-- Displacement Risk -->
            <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:2px;">
                <span style="font-weight:600;font-size:0.9em;color:#e0e0e0;">Displacement Risk</span>
                <span style="font-size:0.8em;color:#888;">${formatNumber(props.TOTAL_POPULATION)} people</span>
            </div>
            ${riskBar}
            ${groupRows}
            ${baHTML}
            <a href="${factSheetURL}" target="_blank" rel="noopener noreferrer"
               style="display:block;text-align:center;font-weight:700;color:#e0e0e0;text-decoration:none;font-size:0.9em;padding:8px 12px;background:#1a1a1a;border:1px solid #888;margin-top:12px;text-transform:uppercase;letter-spacing:0.3px;">
                Download Fact Sheet →
            </a>
        </div>
    `;
}

// Build the "Public Assets" tab content HTML
function mobileAssetsHTML(props) {
    const fmtComma = n => Number(n || 0).toLocaleString('en-US');

    const assets = [
        { label: '✈️ Airports', total: props.TOTAL_AIRPORTS, c25: props.AIRPORTS_2025, p25: props.PCT_AIRPORTS_2025, c50: props.AIRPORTS_2050, p50: props.PCT_AIRPORTS_2050 },
        { label: '🏥 Hospitals', total: props.TOTAL_HOSPITALS, c25: props.HOSPITALS_2025, p25: props.PCT_HOSPITALS_2025, c50: props.HOSPITAL_2050, p50: props.PCT_HOSPITALS_2050 },
        { label: '📚 Libraries', total: props.TOTAL_LIBRARY, c25: props.LIBRARY_2025, p25: props.PCT_LIBRARY_2025, c50: props.LIBRARY_2050, p50: props.PCT_LIBRARY_2050 },
        { label: '🌳 Parks', total: props.TOTAL_PARKS, c25: props.PARKS_2025, p25: props.PCT_PARKS_2025, c50: props.PARKS_2050, p50: props.PCT_PARKS_2050 },
        { label: '⚡ Power Plants', total: props.TOTAL_POWERPLANTS, c25: props.POWERPLANTS_2025, p25: props.PCT_POWERPLANTS_2025, c50: props.POWERPLANTS_2050, p50: props.PCT_POWERPLANTS_2050 },
        { label: '🏫 Schools', total: props.TOTAL_SCHOOL, c25: props.SCHOOL_2025, p25: props.PCT_SCHOOL_2025, c50: props.SCHOOL_2050, p50: props.PCT_SCHOOL_2050 },
        { label: '⚠️ Contaminated Sites', total: props.TOTAL_KNOWN_CONTAMINATED_SITE, c25: props.KNOWN_CONTAMINATED_SITE_2025, p25: props.PCT_KNOWN_CONTAMINATED_SITE_2025, c50: props.KNOWN_CONTAMINATED_SITE_2050, p50: props.PCT_KNOWN_CONTAMINATED_SITE_2050 },
        { label: '☢️ Solid/Hazardous Waste', total: props.TOTAL_SOLID_HAZARD_WASTE, c25: props.SOLID_HAZARD_WASTE_2025, p25: props.PCT_SOLID_HAZARD_WASTE_2025, c50: props.SOLID_HAZARD_WASTE_2050, p50: props.PCT_SOLID_HAZARD_WASTE_2050 },
        { label: '🗑️ Landfills', total: props.TOTAL_SOLID_WASTE_LANDFILL, c25: props.SOLID_WASTE_LANDFILL_2025, p25: props.PCT_SOLID_WASTE_LANDFILL_2025, c50: props.SOLID_WASTE_LANDFILL_2050, p50: props.PCT_SOLID_WASTE_LANDFILL_2050 },
        { label: '☣️ Superfund Sites', total: props.TOTAL_SUPERFUND, c25: props.SUPERFUND_2025, p25: props.PCT_SUPERFUND_2025, c50: props.SUPERFUND_2050, p50: props.PCT_SUPERFUND_2050 },
        { label: '💧 Wastewater', total: props.TOTAL_WASTEWATER_TREATMENT, c25: props.WASTEWATER_TREATMENT_2025, p25: props.PCT_WASTEWATER_TREATMENT_2025, c50: props.WASTEWATER_TREATMENT_2050, p50: props.PCT_WASTEWATER_TREATMENT_2050 },
        { label: '👮 Police Stations', total: props.TOTAL_POLICE_STATION, c25: props.POLICE_STATION_2025, p25: props.PCT_POLICE_STATION_2025, c50: props.POLICE_STATION_2050, p50: props.PCT_POLICE_STATION_2050 },
        { label: '🚒 Fire Depts', total: props.TOTAL_FIRE_DEPARTMENT, c25: props.FIRE_DEPARTMENT_2025, p25: props.PCT_FIRE_DEPARTMENT_2025, c50: props.FIRE_DEPARTMENT_2050, p50: props.PCT_FIRE_DEPARTMENT_2050 }
    ];

    const atRisk = assets.filter(a => {
        const hasTotal = a.total && Number(a.total) > 0;
        const has25 = a.c25 && Number(a.c25) > 0;
        const has50 = a.c50 && Number(a.c50) > 0;
        return hasTotal && (has25 || has50);
    }).sort((a, b) => (Number(b.p50) || 0) - (Number(a.p50) || 0));

    const totalAssets = assets.reduce((s, a) => s + (Number(a.total) || 0), 0);
    const risk25 = assets.reduce((s, a) => s + (Number(a.c25) || 0), 0);
    const risk50 = assets.reduce((s, a) => s + (Number(a.c50) || 0), 0);
    const pct25 = totalAssets > 0 ? ((risk25 / totalAssets) * 100).toFixed(1) : 0;
    const pct50 = totalAssets > 0 ? ((risk50 / totalAssets) * 100).toFixed(1) : 0;

    function assetRow(a) {
        let p25 = Math.max(0, Math.min(Number(a.p25) || 0, 100));
        let p50 = Math.max(0, Math.min(Number(a.p50) || 0, 100));
        return `
            <div style="margin-bottom:8px;padding:6px 8px;background:#2a2a2a;border:1px solid #3a3a3a;">
                <div style="font-size:0.88em;font-weight:600;color:#e0e0e0;margin-bottom:4px;">${a.label}</div>
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                    <span style="font-size:0.8em;color:#888;width:28px;text-align:right;">2025</span>
                    <div style="flex:1;height:7px;background:#3a3a3a;overflow:hidden;">
                        <div style="background:#a5d5f1;width:${p25}%;height:100%;min-width:2px;"></div>
                    </div>
                    <span style="font-size:0.8em;color:#b0b0b0;width:50px;text-align:right;font-weight:600;">${fmtComma(a.c25)}/${fmtComma(a.total)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-size:0.8em;color:#888;width:28px;text-align:right;">2050</span>
                    <div style="flex:1;height:7px;background:#3a3a3a;overflow:hidden;">
                        <div style="background:#3a7fc3;width:${p50}%;height:100%;min-width:2px;"></div>
                    </div>
                    <span style="font-size:0.8em;color:#b0b0b0;width:50px;text-align:right;font-weight:600;">${fmtComma(a.c50)}/${fmtComma(a.total)}</span>
                </div>
            </div>
        `;
    }

    const assetRows = atRisk.length > 0
        ? atRisk.map(assetRow).join('')
        : '<div style="font-size:0.9em;color:#888;font-style:italic;">No critical infrastructure at risk</div>';

    const featuredCity = countyToCity[props.COUNTY];
    const cityLink = featuredCity ? `
        <a href="https://rebuildbydesign.github.io/nj-flood-risk-city/?city=${encodeURIComponent(featuredCity.key)}" target="_blank"
           style="display:block;text-align:center;font-weight:700;color:#e0e0e0;text-decoration:none;font-size:0.9em;padding:8px 12px;background:#1a1a1a;border:1px solid #888;margin-top:12px;text-transform:uppercase;letter-spacing:0.3px;">
            Explore ${featuredCity.name} Data →
        </a>` : '';

    return `
        <div style="font-family:Arial,sans-serif;color:#e0e0e0;">
            <div style="font-size:0.9em;color:#b0b0b0;margin-bottom:10px;">
                ${fmtComma(totalAssets)} assets · <span style="font-weight:700;color:#f87171;">${pct25}%</span> at risk in 2025, <span style="font-weight:700;color:#f87171;">${pct50}%</span> by 2050
            </div>
            ${assetRows}
            <div style="font-size:0.75em;color:#888;font-style:italic;margin-top:6px;">* 100-ft buffer analysis intersected with 2025 & 2050 floodplains</div>
            ${cityLink}
        </div>
    `;
}

// Store current county props for tab switching
let _mobileCountyProps = null;

function openMobileCountySheet(props) {
    _mobileCountyProps = props;
    const sheet = document.getElementById('mobile-county-sheet');
    const title = document.getElementById('mobile-county-title');
    const body = document.getElementById('mobile-county-body');

    // Collapse sidebar if open
    if (sidebar && sidebar.classList.contains('expanded')) {
        sidebar.classList.remove('expanded');
        sidebar.classList.add('collapsed');
    }

    // Set title
    const countyName = props.COUNTY.charAt(0) + props.COUNTY.slice(1).toLowerCase();
    title.textContent = countyName + ' County';

    // Reset to Displacement tab
    document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.mobile-tab[data-tab="displacement"]').classList.add('active');
    body.innerHTML = mobileDisplacementHTML(props);

    // Show sheet
    sheet.classList.remove('hidden');

    // Wire up "Back to Map Controls" link if present
    const backLink = document.getElementById('mobile-back-to-controls');
    if (backLink) {
        backLink.onclick = () => {
            closeMobileCountySheet();
            if (sidebar) {
                sidebar.classList.remove('collapsed');
                sidebar.classList.add('expanded');
                const toggleLabel = document.querySelector('.sidebar-toggle-label');
                if (toggleLabel) toggleLabel.textContent = 'Click to Hide Map Controls';
            }
        };
    }
}

function closeMobileCountySheet() {
    const sheet = document.getElementById('mobile-county-sheet');
    sheet.classList.add('hidden');
    _mobileCountyProps = null;

    // Re-show sidebar toggle so users can get back to map controls
    if (sidebar && sidebar.classList.contains('collapsed')) {
        const toggle = document.getElementById('sidebar-toggle');
        if (toggle) toggle.style.display = '';
    }
}

// Close button
const mobileCountyClose = document.getElementById('mobile-county-close');
if (mobileCountyClose) {
    mobileCountyClose.addEventListener('click', closeMobileCountySheet);
}

// Tab switching
document.querySelectorAll('.mobile-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        if (!_mobileCountyProps) return;
        const tabName = tab.getAttribute('data-tab');
        const body = document.getElementById('mobile-county-body');

        document.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        if (tabName === 'displacement') {
            body.innerHTML = mobileDisplacementHTML(_mobileCountyProps);
        } else {
            body.innerHTML = mobileAssetsHTML(_mobileCountyProps);
        }
    });
});
