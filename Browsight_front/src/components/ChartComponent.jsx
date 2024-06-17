import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import 'chartjs-adapter-date-fns';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import axios from 'axios';

Chart.register(MatrixController, MatrixElement, ChartDataLabels);

const ChartComponent = ({ userKeyCd, dateYmd }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
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

  useEffect(() => {
    if (!data.length) return;

    const ctx = chartRef.current.getContext('2d');

    const tickets = [...new Set(data.map(item => item.TicketName))];
    const clusters = [...new Set(data.map(item => item.Cluster))];

    const clusterColors = clusters.map(() => {
      return [Math.floor(Math.random() * 200) + 55, Math.floor(Math.random() * 200) + 55, Math.floor(Math.random() * 200) + 55];
    });

    const matrixData = data.map(item => ({
      x: item.Cluster,
      y: item.TicketName,
      v: item.MeanSimilarity,
    }));

    const chartData = {
      datasets: [{
        label: 'Mean Similarity',
        data: matrixData,
        backgroundColor: context => {
          const value = context.dataset.data[context.dataIndex].v;
          const clusterIndex = clusters.indexOf(context.dataset.data[context.dataIndex].x);
          const [r, g, b] = clusterColors[clusterIndex];
          const alpha = (value - Math.min(...data.map(d => d.MeanSimilarity))) / (Math.max(...data.map(d => d.MeanSimilarity)) - Math.min(...data.map(d => d.MeanSimilarity)));
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
        borderWidth: 0,
        width: ({ chart }) => (chart.chartArea || {}).width / clusters.length,
        height: ({ chart }) => (chart.chartArea || {}).height / tickets.length,
      }]
    };

    const options = {
      responsive: true,
      scales: {
        x: {
          type: 'category',
          labels: clusters,
          title: {
            display: true,
            text: '군집',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            display: false
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0,
            padding: 30,
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        y: {
          type: 'category',
          labels: tickets,
          title: {
            display: true,
            text: '업무',
            font: {
              size: 14,
              weight: 'bold'
            }
          },
          grid: {
            display: false
          },
          ticks: {
            autoSkip: false,
            padding: 10,
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: false,
          padding: 40,
          text: 'Mean Similarity by Ticket and Cluster',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          enabled: false
        },
        datalabels: {
          display: true,
          formatter: (value, context) => `${(value.v * 100).toFixed(0)}`,
          color: '#000',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      }
    };

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: 'matrix',
      data: chartData,
      options: options,
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return <canvas ref={chartRef} />;
};

export default ChartComponent;
