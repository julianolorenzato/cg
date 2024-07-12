export function randomCity(buildBlockSize, citySize) {
  const perRow = Math.floor(buildBlockSize / 2);

  const city = initializeCity(citySize)

  for (let i = 0; i < citySize; i += 3) {
    const rowStart = Math.round(Math.random() * perRow)

    for (let j = rowStart; j < citySize; j += perRow) {
        console.log("j:", j)
        city[i][j] = 0;
        city[i+1][j] = 0;
    }
    
    for (let j = 0; j < citySize; j++) {
        city[i+2][j] = 0
    }
  }

  return city
}

// function randomCordinate() {
//   return {
//     x: Math.round(Math.random() * 9),
//     y: Math.round(Math.random() * 9),
//   };
// }


function initializeCity(size, buildBlockMaxHeight) {
  const city = [];

  for (let i = 0; i < size; i++) {
    city.push([]);
    for (let j = 0; j < size; j++) {
      city[i].push(Math.round(Math.random() * buildBlockMaxHeight));
    }
  }

  return city
}