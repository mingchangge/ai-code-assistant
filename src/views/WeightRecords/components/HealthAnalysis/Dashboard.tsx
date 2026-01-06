import React, { useEffect, useState } from 'react'
import { Row, Card, Col, Skeleton, Empty, Alert, Typography } from 'antd'
import {
  AdvisorService,
  type AnalysisResult,
  type UserProfile
} from '@/services/advisor'
import { AnalysisCard } from './AnalysisCard'

const { Title, Text } = Typography

interface DashboardProps {
  historyData: unknown[]
  userProfile: UserProfile
}

export const HealthDashboard: React.FC<DashboardProps> = ({
  historyData,
  userProfile
}) => {
  const [reports, setReports] = useState<AnalysisResult[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      // 基础校验
      if (historyData.length === 0) {
        setReports([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        // 调用 Service 获取分析结果
        const results = await AdvisorService.analyze(historyData, userProfile)
        if (isMounted) {
          setReports(results)
        }
      } catch (err) {
        if (isMounted) {
          setError('健康数据分析服务暂时不可用，请稍后重试。')
          console.error(err)
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [historyData, userProfile])

  // 1. Loading 状态
  if (loading) {
    return (
      <div className="p-4">
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card>
                <Skeleton active avatar paragraph={{ rows: 3 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    )
  }

  // 2. Error 状态
  if (error) {
    return (
      <Alert message="分析失败" description={error} type="error" showIcon />
    )
  }

  // 3. 空数据状态
  if (reports.length === 0) {
    return <Empty description="暂无有效的健康数据，请先上传或录入数据。" />
  }

  // 4. 正常渲染
  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <div className="mb-6">
        <Title level={4} style={{ margin: 0 }}>
          全维健康分析报告
        </Title>
        <Text type="secondary">
          基于 {userProfile.age}岁{' '}
          {userProfile.gender === 'female' ? '女性' : '男性'} 标准库生成
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {reports.map(report => (
          // 响应式布局：手机占满(24)，平板占半(12)，大屏占1/3(8)
          <Col xs={24} sm={12} lg={8} key={report.metric}>
            <AnalysisCard data={report} />
          </Col>
        ))}
      </Row>
    </div>
  )
}
