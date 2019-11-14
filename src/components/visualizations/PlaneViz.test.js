import React from 'react';
import ReactDOM from 'react-dom';
import PlaneViz from './PlaneViz';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<PlaneViz />, div);
  ReactDOM.unmountComponentAtNode(div);
});
