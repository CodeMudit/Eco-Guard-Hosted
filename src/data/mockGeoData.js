// Mock GeoJSON data for Administrative Boundaries and Road Networks

export const nerStateBoundaries = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Meghalaya", type: "State" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [89.8, 26.1],
            [92.8, 26.1],
            [92.8, 25.0],
            [89.8, 25.0],
            [89.8, 26.1]
          ]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "Assam", type: "State" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [89.8, 27.5],
            [96.0, 27.5],
            [96.0, 26.1],
            [89.8, 26.1],
            [89.8, 27.5]
          ]
        ]
      }
    }
  ]
};

export const nerRoadNetwork = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "NH-40", status: "Open" },
      geometry: {
        type: "LineString",
        coordinates: [
          [91.738, 26.14],
          [91.8, 25.57],
          [92.0, 25.268] // Node 1 area
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "SH-12", status: "Partially Blocked" },
      geometry: {
        type: "LineString",
        coordinates: [
          [92.0, 25.268],
          [92.2, 25.2],
          [92.5, 25.1]
        ]
      }
    },
    {
      type: "Feature",
      properties: { name: "NH-27", status: "Open" },
      geometry: {
        type: "LineString",
        coordinates: [
          [91.0, 26.2],
          [91.738, 26.14],
          [92.5, 26.5]
        ]
      }
    }
  ]
};

// Heatmap points: [lat, lng, intensity]
export const nerRiskHeatmapPoints = [
  // High risk cluster around node-1 (Hill Sector)
  [25.268, 91.738, 0.9],
  [25.269, 91.737, 0.8],
  [25.270, 91.739, 0.95],
  [25.265, 91.740, 0.7],
  [25.266, 91.735, 0.85],
  
  // Moderate risk along river
  [25.280, 91.750, 0.5],
  [25.282, 91.755, 0.6],
  [25.285, 91.760, 0.55],
  
  // High risk spot
  [25.300, 91.700, 0.88],
  [25.302, 91.705, 0.75],
];

export const nerVillages = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Mawphlang Village", population: 1500, risk: "High" },
      geometry: { type: "Point", coordinates: [91.738, 25.268] }
    },
    {
      type: "Feature",
      properties: { name: "Nongthymmai", population: 3200, risk: "Moderate" },
      geometry: { type: "Point", coordinates: [91.750, 25.280] }
    },
    {
      type: "Feature",
      properties: { name: "Cherrapunji Sub-hub", population: 5000, risk: "Extreme" },
      geometry: { type: "Point", coordinates: [91.700, 25.300] }
    }
  ]
};
