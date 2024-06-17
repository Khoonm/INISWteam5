import React from 'react';
import { NavLink } from 'react-router-dom';


const Sidebar = () => {
  return (
    <aside className="sidebar">
      <nav>
        <div className="menu-section">
          <h3>직원 정보 관리</h3>
          <ul>
            <li><NavLink to="/employee" activeClassName="active">직원 목록</NavLink></li>
          </ul>
        </div>
        <div className="menu-section">
          <h3>프로젝트 관리</h3>
          <ul>
            <li><NavLink to="/management" activeClassName="active">업무 분장</NavLink></li>
          </ul>
        </div>
        <div className="menu-section">
          <h3>근무 관리</h3>
          <ul>
            <li><NavLink to="/dailywork" activeClassName="active">일별 근무 현황</NavLink></li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
