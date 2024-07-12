export function randomCity(buildBlockSize, maxBuildingHeight) {
  const perRow = Math.floor(buildBlockSize / 2);

  // é uma constante por enquanto
  const citySize = 12;

  const city = initializeCity(citySize, maxBuildingHeight);

  for (let i = 0; i < citySize; i += 3) {
    const rowStart = Math.round(Math.random() * perRow);

    for (let j = rowStart; j < citySize; j += perRow) {
      city[i][j] = 0;
      city[i + 1][j] = 0;
    }

    for (let j = 0; j < citySize; j++) {
      city[i + 2][j] = 0;
    }
  }

  return city;
}

function initializeCity(size, maxBuildingHeight) {
  const city = [];

  for (let i = 0; i < size; i++) {
    city.push([]);
    for (let j = 0; j < size; j++) {
      city[i].push(Math.round(Math.random() * maxBuildingHeight + 1) + 1);
    }
  }

  return city;
}
