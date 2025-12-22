export const generateTreePositions = (treeSize = 'medium') => {
  const positions = [];
  
  // IMPROVED: Better scaling for all tree sizes
  const sizeConfig = {
    small: { 
      layers: 10, 
      baseWidth: 280, 
      height: 420,
      pointsPerLayer: 5 
    },
    medium: { 
      layers: 14, 
      baseWidth: 400, 
      height: 600,
      pointsPerLayer: 7
    },
    large: { 
      layers: 18, 
      baseWidth: 520, 
      height: 780,
      pointsPerLayer: 9
    }
  };
  
  const config = sizeConfig[treeSize];
  const { layers, baseWidth, height, pointsPerLayer } = config;
  
  // Generate Christmas tree shape (triangle with slightly curved sides)
  for (let layer = 0; layer < layers; layer++) {
    const progress = layer / (layers - 1); // 0 to 1
    
    // Y position: top to bottom
    const y = (progress * height) - (height * 0.45); // Centered vertically
    
    // Width decreases as we go up (tree shape)
    const layerProgress = 1 - progress; // 1 at top, 0 at bottom
    const widthAtLayer = baseWidth * (0.3 + (progress * 0.7)); // 30% at top, 100% at bottom
    
    // Number of ornaments at this layer
    const ornamentsInLayer = Math.max(
      3, 
      Math.floor(pointsPerLayer * (0.5 + progress * 0.5))
    );
    
    // Distribute ornaments across the layer
    for (let i = 0; i < ornamentsInLayer; i++) {
      const horizontalProgress = i / (ornamentsInLayer - 1 || 1); // 0 to 1
      
      // X position: spread across layer width
      const x = (horizontalProgress - 0.5) * widthAtLayer;
      
      // Add slight randomness for natural look
      const randomOffsetX = (Math.random() - 0.5) * 15;
      const randomOffsetY = (Math.random() - 0.5) * 10;
      
      positions.push({ 
        x: x + randomOffsetX, 
        y: y + randomOffsetY 
      });
    }
  }
  
  console.log(`🎄 Generated ${positions.length} positions for ${treeSize} tree`);
  return positions;
};

export const findNearestPosition = (dragPosition, availablePositions, occupiedPositions, threshold = 150) => {
  if (!availablePositions || availablePositions.length === 0) {
    console.warn('⚠️ No available positions');
    return null;
  }
  
  let nearestPosition = null;
  let minDistance = Infinity;
  
  for (const pos of availablePositions) {
    // Check if position is already occupied (with smaller tolerance)
    const isOccupied = occupiedPositions.some(
      occupied => Math.abs(occupied.x - pos.x) < 40 && Math.abs(occupied.y - pos.y) < 40
    );
    
    if (isOccupied) continue;
    
    // Calculate distance from drag position
    const distance = Math.sqrt(
      Math.pow(dragPosition.x - pos.x, 2) + 
      Math.pow(dragPosition.y - pos.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPosition = pos;
    }
  }
  
  // Return if within threshold
  if (nearestPosition && minDistance < threshold) {
    console.log(`✅ Found position at distance: ${Math.round(minDistance)}px`);
    return nearestPosition;
  }
  
  // If no position found within threshold, return the closest one anyway
  if (nearestPosition) {
    console.log(`⚠️ Using closest position (${Math.round(minDistance)}px away)`);
    return nearestPosition;
  }
  
  console.warn(`⚠️ No suitable position found`);
  return null;
};
