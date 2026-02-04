import styled from 'styled-components'
import MdTabs from '@/components/MarkDownReader/MdTabs'
import '@/utils/jsStudy'
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
export default function SoftwareEngineerExam() {
  const mdMap = import.meta.glob<string>(
    '@/views/SoftwareEngineerExam/docs/*.md',
    {
      query: '?url',
      import: 'default',
      eager: true
    }
  )
  return (
    <StyledReaderBox>
      <MdTabs mdMap={mdMap} docsPath="/views/SoftwareEngineerExam/docs/" />
    </StyledReaderBox>
  )
}
