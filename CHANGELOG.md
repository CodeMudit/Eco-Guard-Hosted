# Changelog

All notable changes to the Eco-Watch SIH prototype will be documented in this file.

## [Unreleased / SIH 2026 Prototype Build]

### Added
- **Real-Time GIS Integration**: Interactive map utilizing `react-leaflet`, `leaflet.heat` for dynamic risk heatmaps, and mock GeoJSON infrastructure overlays (Roads and Villages).
- **Offline Citizen Reporting**: PWA-ready reporting interface powered by `localforage`. Allows offline media uploads (with client-side image compression) and syncs immediately when network returns. Interactive pin-drop minimap included.
- **Multilingual Support**: Fully initialized `i18next` with `react-i18next`. Included complete `en`, `hi`, and `as` (Assamese) translations. Accessible language switcher in the top navigation.
- **Accessibility Toolbar**: Government-grade accessibility compliant. Allows real-time font scaling (A-, A, A+) and High Contrast toggle via root CSS variable injection.
- **Authority Dashboards**: Implemented Road Connectivity Matrix, 24-72h Weather Risk Forecast, and a dynamically sorted Emergency Response Prioritization list.
- **3D Terrain Viewer**: Integrated an isometric CSS-based 3D Terrain Profile Viewer mimicking DEM terrain risk analysis for critical hazard zones.
- **True ML Mock Endpoint**: Built a robust backend endpoint `/api/risk/predict` simulating an ensemble Random Forest model, outputting categorical risk, confidence scores, and feature weights.
- **Mock Alert Dispatch**: Added a transport simulator in the Express backend (`alerts.js`) mocking the MSG91 SMS gateway for `HIGH` and `CRITICAL` alert dissemination.

### Changed
- **Aesthetic Overhaul**: Converted the UI to strict NER-DRR styling standards — high-contrast slate backgrounds, deep blues, and glassmorphic panels for a trustworthy government portal feel.
- **Architecture**: Separated context state, routing, and modular components to prevent Vite HMR crashes.

### Fixed
- Fixed an issue where the main React root would crash to a black screen upon rapid re-renders. State management in `AppContext.jsx` is now stable.
- Resolved JSON parsing errors in the Express backend by adding a proper JSON 404 catch-all.
