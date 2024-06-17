import React, { useEffect, useState } from 'react';
import axios from 'axios';

const TicketKeywordTable = ({ userKeyCd, dateYmd }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    if (userKeyCd && dateYmd) {
      axios.get(`http://localhost:3000/group/report`, { params: { USER_KEY_CD: userKeyCd, DATE_YMD: dateYmd } })
        .then(response => setData(response.data))
        .catch(error => console.error('Error fetching data:', error));
    } else {
      console.log('userKeyCd 또는 dateYmd가 정의되지 않았습니다. API 호출 건너뜀.');
    }
  }, [userKeyCd, dateYmd]);

  // 데이터 처리
  const processData = (data) => {
    const filteredData = data
      .filter(item => item.MeanSimilarity > 0.03);

    // 각 업무(Ticket)별로 그룹핑
    const groupedData = filteredData.reduce((acc, item) => {
      if (!acc[item.Ticket]) {
        acc[item.Ticket] = [];
      }
      acc[item.Ticket].push(item);
      return acc;
    }, {});

    // 각 업무에서 가장 높은 MeanSimilarity를 가진 군집의 Representation들을 선택
    const processedData = Object.values(groupedData).map(items => {
      const highestCluster = items.reduce((maxItem, item) => 
        item.MeanSimilarity > maxItem.MeanSimilarity ? item : maxItem, items[0]);

      return {
        ticket: highestCluster.Ticket,
        TicketName: highestCluster.TicketName,
        Representation: items
          .filter(item => item.Cluster === highestCluster.Cluster)
          .map(item => item.Representation)
      };
    });

    // 티켓을 내림차순으로 정렬
    return processedData.sort((a, b) => b.ticket - a.ticket);
  };

  const processedData = processData(data);

  return (
    <div>
      <h4>2. 업무 별 주요 키워드</h4>
      <table>
        <thead>
          <tr>
            <th>업무</th>
            <th>키워드</th>
          </tr>
        </thead>
        <tbody>
          {processedData.map(row => (
            <tr key={row.ticket}>
              <td>{row.TicketName}</td>
              <td>{row.Representation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TicketKeywordTable;
