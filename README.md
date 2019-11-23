
## Global Tree Density Visualization

- Acquired global tree density map as [GeoTIFF dataset from Yale](https://elischolar.library.yale.edu/yale_fes_data/1/) (special thanks to [Joanna Lin](https://github.com/joannalcy) for finding and compiling the data source)
- Use [`three-globe`]([https://github.com/vasturiano/three-globe](https://github.com/vasturiano/three-globe)) to render a globe with appropriate base map
- Parse and load the dataset as array with [`geotiff`](https://github.com/geotiffjs/geotiff.js)
- Create canvas element in React and use as canvas for ThreeJS WebGL renderer
- In ThreeJS:
-- Create blocks on the surface of the globe with heights depending on the density value
-- Use the parsed Geotiff data to determine the range of longitude and latitude represented by each value in the array
-- Use a `THREE.ShaderMaterial` to color the blocks brown and green depending on density value
- Use [Material UI](https://material-ui.com/) to create top and bottom bars to display title and data source
- View the final application at [https://northerncat.github.io/global-tree-density-viz/](https://northerncat.github.io/global-tree-density-viz/)


##

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

##

Author: [Brad Huang](https://github.com/northerncat) & [Joanna Lin](https://github.com/joannalcy)

Contact: brad820309@gmail.com
