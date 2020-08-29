import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import './App.css';
import { QuickStart } from './sample/quickStart';
import { SampleApp1 } from './sample/sampleApp1';

function App() {
  return (
    <div className="App">
      <Router>
        <header className="App-header">
          <Link to="/">ts-react-mvvm-example</Link>
        </header>
        <div>
          <Switch>
            <Route path="/quickStart/">
              <QuickStart />
            </Route>
            <Route path="/sampleApp1/">
              <SampleApp1 />
            </Route>
            <Route path="/sample03/">
              sample03
            </Route>
            <Route path="/">
              <ul>
                <li>
                  <Link to="/quickStart/">quick start</Link>
                </li>
                <li>
                  <Link to="/sampleApp1/">sample app</Link>
                </li>
              </ul>
            </Route>
          </Switch>
        </div>
      </Router>
    </div>
  );
}

export default App;
// (window as any).React2 = require('react');
// console.log("★★★", (window as any).React1 === (window as any).React2, (window as any).React1 )
