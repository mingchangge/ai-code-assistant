import styled from 'styled-components'
import MdTabs from '@/components/MarkDownReader/MdTabs'
// import './js-new-features/es6.js'
// import './js-new-features/es10.js'
import './js-new-features/es15.js'
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

function JsNewFeature() {
  const customMdTabs = import.meta.glob<string>(
    '@/assets/docs/js-new-features/*.md',
    {
      query: '?url',
      import: 'default',
      eager: true
    }
  )
  return (
    <StyledReaderBox>
      <MdTabs mdMap={customMdTabs} docsPath="/docs/js-new-features/" />
    </StyledReaderBox>
  )
}

export default JsNewFeature
