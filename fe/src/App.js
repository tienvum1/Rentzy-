import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Homepage  from './pages/hompage/homepage';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <Homepage />
          } />
      
        </Routes>
      </div>
    </Router>
  );
}

export default App;
