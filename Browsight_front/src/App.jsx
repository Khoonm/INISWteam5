import React from "react";
import { Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';

import Home from './pages/Home.jsx';
import Employee from './pages/Employee.jsx';
import Management from './pages/Management.jsx';
import Dailywork from './pages/Dailywork.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import NotFound from './components/NotFound.jsx';

import './css/app.css';
import './css/home.css';
import './css/header.css';
import './css/sidebar.css';
import './css/employee.css';
import './css/management.css';
import './css/dailywork.css';


const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent = () => {
  const location = useLocation();
  const noHeaderPaths = ["/", "*"];


  return (
    <>
      {!noHeaderPaths.includes(location.pathname) && <Header />}
      <div className="main-layout">
        {!noHeaderPaths.includes(location.pathname) && <Sidebar />}
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/employee" element={<Employee />} />
            <Route path="/management" element={<Management />} />
            <Route path="/dailywork" element={<Dailywork />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
