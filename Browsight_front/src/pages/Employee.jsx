import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Employee = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [departments, setDepartments] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState('전체');
    const [modalOpen, setModalOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState({ name: '', department: '', phone: '' });
    const [errorMessage, setErrorMessage] = useState('');

    // 데이터 변환 함수
    const transformData = (data) => {
        return data.map(item => ({
            name: item.USER_NM,
            key: item.USER_KEY_CD,
            date: item.REG_YMD,
            department: item.DEPT_NM,
            phone: item.HP_NUM
        }));
    };

    // 데이터 불러오기 함수
    const fetchData = async () => {
        try {
            const response = await axios.get('http://localhost:3000/employee');
            const result = await response.data;
            const transformedData = transformData(result);
            transformedData.sort((a, b) => new Date(b.date) - new Date(a.date)); // 등록일 기준으로 최신 순 정렬
            setData(transformedData);
            setFilteredData(transformedData);

            const deptSet = new Set(transformedData.map(item => item.department));
            setDepartments(['전체', ...deptSet]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = () => {
        let filtered = data;
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(item =>
                item.name.includes(searchQuery)
            );
        }
        if (selectedDepartment !== '전체') {
            filtered = filtered.filter(item =>
                item.department === selectedDepartment
            );
        }
        setFilteredData(filtered);
        setCurrentPage(1); // 검색 시 첫 페이지로 이동
    };

    const sortData = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });

        const sortedData = [...filteredData].sort((a, b) => {
            if (key === 'date') {
                return direction === 'ascending'
                    ? new Date(a[key]) - new Date(b[key])
                    : new Date(b[key]) - new Date(a[key]);
            }
            if (a[key] < b[key]) {
                return direction === 'ascending' ? -1 : 1;
            }
            if (a[key] > b[key]) {
                return direction === 'ascending' ? 1 : -1;
            }
            return 0;
        });
        setFilteredData(sortedData);
        setCurrentPage(1); // 정렬 시 첫 페이지로 이동
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // 페이지 수 변경 시 첫 페이지로 이동
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleDepartmentChange = (dept) => {
        setSelectedDepartment(dept);
        let filtered = data;
        if (dept !== '전체') {
            filtered = data.filter(item => item.department === dept);
        }
        setFilteredData(filtered);
        setCurrentPage(1); // 부서 변경 시 첫 페이지로 이동
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewEmployee(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const validatePhoneNumber = (콜) => {
        const phonePattern = /^010-\d{4}-\d{4}$/;
        return phonePattern.test(콜);
    };

    const handleRegister = async () => {
        if (!validatePhoneNumber(newEmployee.phone)) {
            setErrorMessage('휴대전화 형식이 올바르지 않습니다. 010-1234-5678 형식으로 입력하세요.');
            return;
        }

        const newEntry = {
            ...newEmployee,
            key: Math.random().toString(36).substr(2, 8).toUpperCase(),
            date: new Date().toISOString().split('T')[0]
        };

        const updatedData = [newEntry, ...data];
        updatedData.sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 데이터가 위로 오도록 정렬
        setData(updatedData);

        let filtered = updatedData;
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(item =>
                item.name.includes(searchQuery)
            );
        }
        if (selectedDepartment !== '전체') {
            filtered = filtered.filter(item =>
                item.department === selectedDepartment
            );
        }
        setFilteredData(filtered);

        if (!departments.includes(newEntry.department)) {
            setDepartments(prevDepts => [...prevDepts, newEntry.department]);
        }

        const transformedEntry = {
            USER_NM: newEntry.name,
            USER_KEY_CD: newEntry.key,
            DEPT_NM: newEntry.department,
            HP_NUM: newEntry.phone
        };

        try {
            await axios.post('http://localhost:3000/employee', transformedEntry);
            fetchData();
        } catch (error) {
            console.error('Error posting data:', error);
        }

        setModalOpen(false);
        setNewEmployee({ name: '', department: '', phone: '' });
        setErrorMessage('');
        setCurrentPage(1); // 신규 등록 시 첫 페이지로 이동
    };

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const isFormComplete = newEmployee.name && newEmployee.department && newEmployee.phone;

    return (
        <div className="management-container">
            <h2>직원 목록</h2>
            <div className="employee-header">
                <div className="employee-search">
                    <input 
                        type="text" 
                        placeholder="직원명" 
                        className="employee-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button className="search-button" onClick={handleSearch}>찾기</button>
                </div>
                <button className="register-button" onClick={() => setModalOpen(true)}>신규 등록</button>
            </div>
            <div className="department-filter">
                {departments.map((dept, index) => (
                    <button 
                        key={index}
                        className={`department-button ${selectedDepartment === dept ? 'active' : ''}`}
                        onClick={() => handleDepartmentChange(dept)}
                    >
                        {dept}
                    </button>
                ))}
            </div>
            <div className="employee-table-container">
                <div className="employee-table-header">
                    <h3> </h3>
                    <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                        <option value="10">10명씩 보기</option>
                        <option value="20">20명씩 보기</option>
                        <option value="30">30명씩 보기</option>
                    </select>
                </div>
                <div className="table-container">
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th onClick={() => sortData('name')}>
                                    이름
                                    <button className="sort-button">
                                        {sortConfig.key === 'name' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                                    </button>
                                </th>
                                <th>key</th>
                                <th onClick={() => sortData('date')}>
                                    등록일
                                    <button className="sort-button">
                                        {sortConfig.key === 'date' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                                    </button>
                                </th>
                                <th onClick={() => sortData('department')}>
                                    부서
                                    <button className="sort-button">
                                        {sortConfig.key === 'department' ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                                    </button>
                                </th>
                                <th>휴대전화</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.name}</td>
                                    <td>{item.key}</td>
                                    <td>{item.date}</td>
                                    <td>{item.department}</td>
                                    <td>{item.phone}</td>
                                </tr>
                            ))}
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
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>신규 등록</h3>
                        <label>
                            이름
                            <input 
                                type="text" 
                                name="name" 
                                value={newEmployee.name} 
                                onChange={handleInputChange} 
                                placeholder="김유정"
                            />
                        </label>
                        <label>
                            부서
                            <input 
                                type="text" 
                                name="department" 
                                value={newEmployee.department} 
                                onChange={handleInputChange} 
                                placeholder="행정"
                            />
                        </label>
                        <label>
                            휴대전화
                            <input 
                                type="text" 
                                name="phone" 
                                value={newEmployee.phone} 
                                onChange={handleInputChange} 
                                placeholder="010-1234-5678"
                            />
                        </label>
                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                        <div className="modal-buttons">
                            <button onClick={() => setModalOpen(false)}>등록취소</button>
                            <button className={!isFormComplete ? 'disabled' : ''} onClick={handleRegister} disabled={!isFormComplete}>등록완료</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Employee;
