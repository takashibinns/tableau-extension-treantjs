import React from "react";
import {
  BrowserRouter as Router,
  useLocation
} from "react-router-dom";
import Extension from './extension/extension';
import Config from './config/config';

export default function App() {
  return (
    <Router>
      <Navigator />
    </Router>
  );
}

function Navigator() {
  
  //  Get the location object
  let location = useLocation();
  
  //  Decide whether to show the extension or config popup
  const output = () => {
    if (location.hash === "#config"){
      return <Config />
    } else {
      return <Extension />
    }
  }
  return (
    <div>
      { output() }
    </div>
  );
}
