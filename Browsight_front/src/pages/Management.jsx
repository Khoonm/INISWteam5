import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import axios from 'axios';

const Management = () => {
  const [tasks, setTasks] = useState({});
  const [currentTask, setCurrentTask] = useState({ employee: '', status: '', index: -1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: '',
    dateStart: '',
    dateEnd: '',
    status: 'notStarted',
    reviewers: [],
    description: '',
  });
  const [newTaskModalOpen, setNewTaskModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeeData, setEmployeeData] = useState([]);
  const [ticketData, setTicketData] = useState([]);
  const [isFormValid, setIsFormValid] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dropdownRef = useRef(null);

  const transformData = (data) => {
    return data.map(item => ({
        ticketIdx: item.TICKET_IDX,
        userKeyCd: item.USER_KEY_CD,
        titleStr: item.TITLE_STR,
        dateStYmd: item.DATE_ST_YMD,
        dateEndYmd: item.DATE_END_YMD,
        contentStr: item.CONTENT_STR,
        managerStr: item.MANAGER_STR,
        statusFlg: item.STATUS_FLG
    }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/employee');
        const data = await response.data;
        setEmployeeData(data);
      } catch (error) {
        console.error('Failed to fetch employee data:', error);
      }
    };

    const fetchTicketData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/ticket');
        const data = await transformData(response.data);
        setTicketData(data);
      } catch (error) {
        console.error('Failed to fetch ticket data:', error);
      }
    };

    fetchEmployeeData();
    fetchTicketData();
  }, []);

  useEffect(() => {
    const { title, dateStart, dateEnd, reviewers, description } = modalContent;
    setIsFormValid(title && dateStart && dateEnd && reviewers.length > 0 && description);
  }, [modalContent]);

  const mapTicketsToTasks = (selectedEmployee) => {
    const tasks = { notStarted: [], inProgress: [], completed: [] };

    ticketData.forEach(ticket => {
      if (ticket.userKeyCd === selectedEmployee.USER_KEY_CD) {
        switch (ticket.statusFlg) {
          case 0:
            tasks.notStarted.push(ticket);
            break;
          case 1:
            tasks.inProgress.push(ticket);
            break;
          case 2:
            tasks.completed.push(ticket);
            break;
          default:
            break;
        }
      }
    });

    return tasks;
  };

  const handleEmployeeClick = (employee) => {
    if (!selectedEmployees.includes(employee.USER_NM)) {
      const employeeTasks = mapTicketsToTasks(employee);
      setTasks(prevTasks => ({
        ...prevTasks,
        [employee.USER_NM]: employeeTasks,
      }));
      setSelectedEmployees(prevSelected => [...prevSelected, employee.USER_NM]);
    }
  };

  const addTask = async (employee, status, task) => {
    await setTasks(prevTasks => ({
      ...prevTasks,
      [employee]: {
        ...prevTasks[employee],
        [status]: [...prevTasks[employee][status], task]
      }
    }));
  };

  const openModal = (employee, status, index) => {
    const task = tasks[employee][status][index];
    setCurrentTask({ employee, status, index });
    setModalContent({
      title: task.titleStr,
      dateStart: task.dateStYmd,
      dateEnd: task.dateEndYmd,
      status: status,
      reviewers: task.managerStr.split(',').map(name => ({ label: name, value: name })),
      description: task.contentStr,
    });
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewTaskModalOpen(false);
    setConfirmDelete(false);
    document.body.style.overflow = 'auto';
  };

  const confirmDeleteTask = () => {
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    const { employee, status, index } = currentTask;
    const newTasks = { ...tasks };
    const [task] = newTasks[employee][status].splice(index, 1);

    try {
      await axios.delete(`http://localhost:3000/ticket/${task.ticketIdx}`);
      setTasks(newTasks);
      closeModal();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const saveTask = async () => {
    const { employee, status, index } = currentTask;
    const newTasks = { ...tasks };

    const [task] = newTasks[employee][status].splice(index, 1);

    task.titleStr = modalContent.title;
    task.dateStYmd = modalContent.dateStart;
    task.dateEndYmd = modalContent.dateEnd;
    task.managerStr = modalContent.reviewers.map(reviewer => reviewer.value).join(',');
    task.contentStr = modalContent.description;
    task.statusFlg = modalContent.status === 'notStarted' ? 0 : modalContent.status === 'inProgress' ? 1 : 2;

    newTasks[employee][modalContent.status].push(task);

    const tftask = {
      TICKET_IDX: task.ticketIdx,
      USER_KEY_CD: task.userKeyCd,
      TITLE_STR: task.titleStr,
      DATE_ST_YMD: task.dateStYmd,
      DATE_END_YMD: task.dateEndYmd,
      CONTENT_STR: task.contentStr,
      MANAGER_STR: task.managerStr,
      STATUS_FLG: task.statusFlg
    };

    try {
      await axios.put(`http://localhost:3000/ticket/${tftask.TICKET_IDX}`, tftask);
      setTasks(newTasks);
      closeModal();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const openNewTaskModal = (employee, status) => {
    setCurrentTask({ employee, status, index: -1 });
    setModalContent({
      title: '',
      dateStart: '',
      dateEnd: '',
      status: status,
      reviewers: [],
      description: '',
    });
    setNewTaskModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const registerNewTask = async () => {
    const { employee } = currentTask;
    const { status } = modalContent;

    if (isFormValid) {
      const selectedEmployee = employeeData.find(emp => emp.USER_NM === employee);
      const newTask = {
        titleStr: modalContent.title,
        dateStYmd: modalContent.dateStart,
        dateEndYmd: modalContent.dateEnd,
        managerStr: modalContent.reviewers.map(reviewer => reviewer.value).join(','),
        contentStr: modalContent.description,
        statusFlg: status === 'notStarted' ? 0 : status === 'inProgress' ? 1 : 2,
      };


      const tfnewTask = {
        USER_KEY_CD: selectedEmployee.USER_KEY_CD,
        TITLE_STR: newTask.titleStr,
        DATE_ST_YMD: newTask.dateStYmd,
        DATE_END_YMD: newTask.dateEndYmd,
        MANAGER_STR: newTask.managerStr,
        CONTENT_STR: newTask.contentStr,
        STATUS_FLG: newTask.statusFlg
      };

      try {
        const response = await axios.post('http://localhost:3000/ticket', tfnewTask);
        const savedTask = response.data;
        newTask.ticketIdx = savedTask.TICKET_IDX; // API가 반환한 새 티켓의 인덱스 설정
        await addTask(employee, status, newTask);
        closeModal();
      } catch (error) {
          console.error('Failed to create new task:', error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setModalContent(prevContent => ({
      ...prevContent,
      [name]: value
    }));
  };

  const handleDateInputChange = (e) => {
    const { name, value } = e.target;
    setModalContent(prevContent => ({
      ...prevContent,
      [name]: value,
      dateEnd: name === 'dateStart' && modalContent.dateEnd === '' ? value : modalContent.dateEnd,
    }));
  };

  const handleReviewersChange = (selectedOptions) => {
    setModalContent(prevContent => ({
      ...prevContent,
      reviewers: selectedOptions
    }));
  };

  const removeEmployee = (employee) => {
    setSelectedEmployees(prevSelected => prevSelected.filter(emp => emp !== employee));
    setTasks(prevTasks => {
      const newTasks = { ...prevTasks };
      delete newTasks[employee];
      return newTasks;
    });
  };

  return (
    <div className="management-container">
      <h2>업무 분장</h2>
      <div className="employee-selection-container">
        <div className="dropdown" ref={dropdownRef}>
          <button className="dropdown-button" onClick={() => setDropdownOpen(!dropdownOpen)}>직원 선택</button>
          {dropdownOpen && (
            <div className="dropdown-menu">
              {employeeData.map((employee) => (
                <div key={employee.USER_KEY_CD} className="dropdown-item" onClick={() => handleEmployeeClick(employee)}>
                  {employee.USER_NM}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="selected-employees">
          {selectedEmployees.map((employee) => (
            <div key={employee} className="selected-employee">
              {employee}
              <button className="remove-button" onClick={() => removeEmployee(employee)}>x</button>
            </div>
          ))}
        </div>
      </div>
      <div className="management-content">
        <div className="employee-tasks-name">
          <div className="task-columns">
            <div className="task-column not-started">
              <h3>시작 전</h3>
            </div>
            <div className="task-column in-progress">
              <h3>진행 중</h3>
            </div>
            <div className="task-column completed">
              <h3>완료</h3>
            </div>
          </div>
        </div>
        {selectedEmployees.map((employee) => (
          <div key={employee} className="employee-tasks">
            <details>
              <summary>{employee}</summary>
              <div className="task-columns">
                <div className="task-column not-started">
                  {tasks[employee]?.notStarted.map((task, index) => (
                    <div
                      key={index}
                      className="task"
                      onClick={() => openModal(employee, 'notStarted', index)}
                    >
                      {task.titleStr}
                    </div>
                  ))}
                  <div className="task new-task" onClick={() => openNewTaskModal(employee, 'notStarted')}>
                    + New
                  </div>
                </div>
                <div className="task-column in-progress">
                  {tasks[employee]?.inProgress.map((task, index) => (
                    <div
                      key={index}
                      className="task"
                      onClick={() => openModal(employee, 'inProgress', index)}
                    >
                      {task.titleStr}
                    </div>
                  ))}
                  <div className="task new-task" onClick={() => openNewTaskModal(employee, 'inProgress')}>
                    + New
                  </div>
                </div>
                <div className="task-column completed">
                  {tasks[employee]?.completed.map((task, index) => (
                    <div
                      key={index}
                      className="task"
                      onClick={() => openModal(employee, 'completed', index)}
                    >
                      {task.titleStr}
                    </div>
                  ))}
                  <div className="task new-task" onClick={() => openNewTaskModal(employee, 'completed')}>
                    + New
                  </div>
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="management-modal-overlay">
          <div className="management-modal">
            <div className="modal-header">
              <h3>{`${currentTask.employee} 담당 업무 수정`}</h3>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  name="title"
                  placeholder="제목"
                  value={modalContent.title}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>기간</label>
                <div className="date-range">
                  <input
                    type="date"
                    name="dateStart"
                    placeholder="시작일"
                    value={modalContent.dateStart}
                    onChange={handleDateInputChange}
                  />
                  <span className="date-separator">~</span>
                  <input
                    type="date"
                    name="dateEnd"
                    placeholder="종료일"
                    value={modalContent.dateEnd}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>상태</label>
                <select
                  name="status"
                  value={modalContent.status}
                  onChange={handleInputChange}
                >
                  <option value="notStarted">시작 전</option>
                  <option value="inProgress">진행 중</option>
                  <option value="completed">완료</option>
                </select>
              </div>
              <div className="form-group">
                <label>검토자</label>
                <Select
                  isMulti
                  name="reviewers"
                  options={employeeData.map(employee => ({ label: employee.USER_NM, value: employee.USER_NM }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={modalContent.reviewers}
                  onChange={handleReviewersChange}
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea
                  name="description"
                  placeholder="설명"
                  value={modalContent.description}
                  onChange={handleInputChange}
                  rows="5"
                />
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={closeModal}>취소</button>
              <button onClick={saveTask}>수정</button>
              <button onClick={confirmDeleteTask}>삭제</button>
            </div>
          </div>
          {confirmDelete && (
            <div className="delete-confirmation-overlay">
              <div className="delete-confirmation-modal">
                <p>정말로 삭제하시겠습니까?</p>
                <div className="delete-confirmation-buttons">
                  <button onClick={handleDelete}>예</button>
                  <button onClick={() => setConfirmDelete(false)}>아니요</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {newTaskModalOpen && (
        <div className="management-modal-overlay">
          <div className="management-modal">
            <div className="modal-header">
              <h3>{`${currentTask.employee} 담당 업무 등록`}</h3>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>제목</label>
                <input
                  type="text"
                  name="title"
                  placeholder="제목"
                  value={modalContent.title}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>기간</label>
                <div className="date-range">
                  <input
                    type="date"
                    name="dateStart"
                    placeholder="시작일"
                    value={modalContent.dateStart}
                    onChange={handleDateInputChange}
                  />
                  <span className="date-separator">~</span>
                  <input
                    type="date"
                    name="dateEnd"
                    placeholder="종료일"
                    value={modalContent.dateEnd}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>상태</label>
                <select
                  name="status"
                  value={modalContent.status}
                  onChange={handleInputChange}
                >
                  <option value="notStarted">시작 전</option>
                  <option value="inProgress">진행 중</option>
                  <option value="completed">완료</option>
                </select>
              </div>
              <div className="form-group">
                <label>검토자</label>
                <Select
                  isMulti
                  name="reviewers"
                  options={employeeData.map(employee => ({ label: employee.USER_NM, value: employee.USER_NM }))}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  value={modalContent.reviewers}
                  onChange={handleReviewersChange}
                />
              </div>
              <div className="form-group">
                <label>설명</label>
                <textarea
                  name="description"
                  placeholder="설명"
                  value={modalContent.description}
                  onChange={handleInputChange}
                  rows="5"
                />
              </div>
            </div>
            <div className="modal-buttons">
              <button onClick={closeModal}>취소</button>
              <button onClick={registerNewTask} disabled={!isFormValid}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;