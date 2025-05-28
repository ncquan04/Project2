import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';

// Đăng ký các thành phần Chart.js cần thiết
ChartJS.register(ArcElement, Tooltip, Legend);

interface AttendanceStatsProps {
  attendanceData: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({ attendanceData }) => {
  const { present, absent, late, total } = attendanceData;
  
  const chartData = {
    labels: ['Có mặt', 'Vắng mặt', 'Đi muộn'],
    datasets: [
      {
        data: [present, absent, late],
        backgroundColor: ['#52c41a', '#f5222d', '#faad14'],
        borderColor: ['#fff', '#fff', '#fff'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
    },
  };

  const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;
  const absentPercentage = total > 0 ? Math.round((absent / total) * 100) : 0;
  const latePercentage = total > 0 ? Math.round((late / total) * 100) : 0;

  return (
    <Card title="Thống kê điểm danh" className="mb-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <div style={{ height: 250 }}>
            <Pie data={chartData} options={chartOptions} />
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Statistic
                title="Có mặt"
                value={present}
                suffix={`/ ${total} (${presentPercentage}%)`}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Vắng mặt"
                value={absent}
                suffix={`/ ${total} (${absentPercentage}%)`}
                valueStyle={{ color: '#f5222d' }}
                prefix={<CloseCircleOutlined />}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Đi muộn"
                value={late}
                suffix={`/ ${total} (${latePercentage}%)`}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
};

export default AttendanceStats;