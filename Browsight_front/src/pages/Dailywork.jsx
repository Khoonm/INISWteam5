import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChartComponent from '../components/ChartComponent';
import TicketKeywordTable from '../components/TicketKeywordTable';

const Dailywork = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState([]); // 전체 데이터를 저장
  const [filteredData, setFilteredData] = useState([]); // 필터된 데이터를 저장
  const [modalOpen, setModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null); // 선택된 보고서 데이터를 저장
  const [employeeInfo, setEmployeeInfo] = useState({}); // 이름을 기준으로 한 부서와 휴대전화 정보 저장
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 데이터 변환 함수
  const transformData = (data) => {
    return data.map((item) => ({
      date: item.DATE_YMD,
      nickname: item.Employee.USER_NM, // fk로 이름 불러오기
      userKeyCd: item.USER_KEY_CD, // 추가된 USER_KEY_CD
      status: item.FIN_FLG === 0 ? '근무 중' : '퇴근', // 업무 상태에 맞게 글로 변환
      totalTime: item.TIME_DT,
      reportStatus: item.FIN_FLG === 0 ? '수집 중' : '생성 완료', // 0이면 수집 중 1이면 생성 완료
    }));
  };

  useEffect(() => {
    // 비동기적으로 데이터 가져오기
    const fetchData = async () => {
      const response = await axios.get('http://localhost:3000/work');
      const result = await transformData(response.data);
      setData(result); // 가져온 데이터로 상태 업데이트
      filterDataByDate(result, selectedDate); // 초기 데이터 필터링
    };

    fetchData();
  }, [selectedDate]); // selectedDate가 변경될 때마다 fetchData 호출

  useEffect(() => {
    // 비동기적으로 employeeData 가져오기
    const fetchEmployeeData = async () => {
      const response = await axios.get('http://localhost:3000/employee');
      const result = await response.data;
      const info = {};
      result.forEach((emp) => {
        info[emp.USER_NM] = { userKeyCd: emp.USER_KEY_CD, department: emp.DEPT_NM, phone: emp.HP_NUM };
      });
      setEmployeeInfo(info);
    };

    fetchEmployeeData();
  }, []);

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    filterDataByDate(data, newDate); // 선택된 날짜에 따라 데이터 필터링
  };

  const handleTodayClick = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    filterDataByDate(data, today); // 오늘 날짜에 따라 데이터 필터링
  };

  const filterDataByDate = (data, date) => {
    const filtered = data.filter((employee) => employee.date === date);
    setFilteredData(filtered);
    setCurrentPage(1); // 날짜가 변경될 때 첫 페이지로 이동
  };

  const handleReportClick = (employee) => {
    if (employee.reportStatus === '생성 완료') {
      setReportData({
        ...employee,
        // userKeyCd: employeeInfo[employee.nickname]?.userKeyCd || '',
        department: employeeInfo[employee.nickname]?.department || '',
        phone: employeeInfo[employee.nickname]?.phone || '',
      }); // 선택된 보고서 데이터를 설정
      console.log("reportData.userKeyCd:", reportData.userKeyCd);
      setModalOpen(true);
    }
  };

  const sortData = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });

    const sortedData = [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : 0;
      }
      return 0;
    });
    setFilteredData(sortedData);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // 아이템 수 변경 시 첫 페이지로 이동
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // 시간 차이를 계산하는 함수
  const calculateWorkTime = (startTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHours, startMinutes, 0, 0);
    const now = new Date();
    const diffMs = now - startDate; // 차이를 밀리초로 계산
    const diffHrs = Math.floor(diffMs / 3600000); // 시간으로 변환
    const diffMins = Math.floor((diffMs % 3600000) / 60000); // 분으로 변환
    return `${diffHrs}:${diffMins}`;
  };

  return (
    <div className="dailywork-container">
      <h2>일별 근무 현황</h2>

      <div className="dailywork-header">
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          max={new Date().toISOString().split('T')[0]} // 오늘 날짜까지만 선택 가능
        />
        <button onClick={handleTodayClick}>오늘</button>
      </div>
      <div className="employee-table">
        <div className="table-header">
          <span>전체</span>
          <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
            <option value="10">10명씩 보기</option>
            <option value="20">20명씩 보기</option>
            <option value="30">30명씩 보기</option>
          </select>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => sortData('nickname')}>
                  닉네임
                  <button className="sort-button">
                    {sortConfig.key === 'nickname'
                      ? sortConfig.direction === 'ascending'
                        ? '▲'
                        : '▼'
                      : '↕'}
                  </button>
                </th>
                <th onClick={() => sortData('status')}>
                  업무 상태
                  <button className="sort-button">
                    {sortConfig.key === 'status'
                      ? sortConfig.direction === 'ascending'
                        ? '▲'
                        : '▼'
                      : '↕'}
                  </button>
                </th>
                <th onClick={() => sortData('totalTime')}>
                  업무 총시간
                  <button className="sort-button">
                    {sortConfig.key === 'totalTime'
                      ? sortConfig.direction === 'ascending'
                        ? '▲'
                        : '▼'
                      : '↕'}
                  </button>
                </th>
                <th onClick={() => sortData('reportStatus')}>
                  업무 보고서
                  <button className="sort-button">
                    {sortConfig.key === 'reportStatus'
                      ? sortConfig.direction === 'ascending'
                        ? '▲'
                        : '▼'
                      : '↕'}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentData.length > 0 ? (
                currentData.map((employee, index) => (
                  <tr key={index}>
                    <td>{employee.nickname}</td>
                    <td>{employee.status}</td>
                    <td>
                      {employee.reportStatus === '수집 중'
                        ? calculateWorkTime(employee.totalTime)
                        : employee.totalTime}
                    </td>
                    <td>
                      <button
                        className={`status-button ${
                          employee.reportStatus === '수집 중' ? 'collecting' : 'completed'
                        }`}
                        onClick={() => handleReportClick(employee)}
                        style={
                          employee.reportStatus === '수집 중'
                            ? { cursor: 'default', pointerEvents: 'none' }
                            : {}
                        }
                      >
                        {employee.reportStatus}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4">해당 일에는 근무 현황이 없습니다</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      {modalOpen && reportData && (
        <div className="dailywork-modal-overlay">
          <div className="dailywork-modal">
            <h3>업무 보고서</h3>
            <div className="modal-content">
              <table className="modal-table">
                <tbody>
                  <tr>
                    <td>이름</td>
                    <td>{reportData.nickname}</td>
                    <td>부서</td>
                    <td>{reportData.department}</td>
                  </tr>
                  <tr>
                    <td>휴대전화</td>
                    <td>{reportData.phone}</td>
                    <td>작성일</td>
                    <td>{reportData.date}</td>
                  </tr>

                  <tr>
                    <td colSpan="4">{reportData.task}</td>
                  </tr>
                  <tr>
                    <td>업무 시간</td>
                    <td>{reportData.totalTime}</td>
                    <td>평가 점수</td>
                    <td>{reportData.score}</td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="section-header">
                      근무시간 브라우저 활동과 업무 유사도 분석
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="4">
                      {/* <div className='DynamicImageComponent'>
                        <DynamicImageComponent />
                      </div> */}
                      <h4>1. 업무 별 군집과 유사도</h4>
                      <ChartComponent userKeyCd={reportData.userKeyCd} dateYmd={reportData.date} />
                      <TicketKeywordTable userKeyCd={reportData.userKeyCd} dateYmd={reportData.date} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button onClick={() => setModalOpen(false)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dailywork;
