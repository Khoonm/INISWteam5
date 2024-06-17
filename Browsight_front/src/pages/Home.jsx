import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [key, setKey] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // 로그인 키 검증 로직 추가 가능
    navigate('/employee');
  };

  return (
    <div className="login-container">
      <h1>WORK WALK</h1>
      <h2 className="login-title">관리자 로그인</h2>
      <div className="login-box">
        <div className="login-form">
          <label htmlFor="key">Key</label>
          <input
            type="text"
            id="key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="관리자 키를 입력하세요"
            className="login-input"
          />
        </div>
        <button onClick={handleLogin} className="login-button">로그인</button>
        <p className="register-link">관리자 키발급 신청</p>
      </div>
    </div>
  );
};

export default Home;
