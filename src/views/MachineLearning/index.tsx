import MdTabs from '@/components/MarkDownReader/MdTabs'

export default function MachineLearning() {
  const customMdTabs = import.meta.glob<string>(
    '@/assets/docs/machine-learning/*.md',
    {
      query: '?url',
      import: 'default',
      eager: true
    }
  )
  return (
    <div>
      <MdTabs
        mdMap={customMdTabs}
        docsPath="/assets/docs/machine-learning/"
        tabPosition="top"
      />
    </div>
  )
}
