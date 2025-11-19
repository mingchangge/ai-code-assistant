import { Card } from 'antd'
import styled from 'styled-components'
import PredictingHousePrices from './PredictingHousePrices'
import DigitRecognizer from './DigitRecognizer'

const TestWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`
export default function Test() {
  const components = [
    { key: 1, title: '预测房价', Component: <PredictingHousePrices /> },
    { key: 2, title: '手写数字识别', Component: <DigitRecognizer /> }
  ]
  return (
    <TestWrapper>
      {components.map(({ key, title, Component }) => (
        <div key={key}>
          <Card key={key} title={title} style={{ height: '100%' }}>
            {Component}
          </Card>
        </div>
      ))}
    </TestWrapper>
  )
}
