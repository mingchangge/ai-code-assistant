import styled from 'styled-components'
import MdTabs from './components/MdTabs'

// 样式
const StyledReaderBox = styled.div`
  width: 100%;
  height: calc(100vh - 168px);
  overflow: hidden;
  .ant-tabs-content-holder {
    overflow-x: hidden;
    overflow-y: auto;
  }
  .reader-box {
    width: 100%;
    height: 100%;
  }
`
export default function Home() {
  return (
    <StyledReaderBox>
      <MdTabs />
    </StyledReaderBox>
  )
}
