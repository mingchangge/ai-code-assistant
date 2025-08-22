import { useState } from 'react';
import { SandpackProvider, SandpackPreview, SandpackConsole } from '@codesandbox/sandpack-react';
import PromptBox from './PromptBox';
import EditorPanel from './EditorPanel';
import '@/styles/home.css';

type FileRecord = Record<string, string>;

export default function Home() {
  const [files, setFiles] = useState<FileRecord>({
    'index.html': '<h1>等待生成…</h1>',
    'style.css': '',
    'index.js': '',
  });

  return (
  <SandpackProvider template="vanilla" files={files} >
    <div>
      <PromptBox onFiles={setFiles} />
      <div className="flex">
        <div className='flex-1'>
           <EditorPanel files={files} onChange={setFiles} />
        </div>
        <div className='flex-1'>
          <SandpackPreview />
          <SandpackConsole />   {/* 有错误会直接打印 */}
        </div>
      </div>
    </div>
  </SandpackProvider>
  );
}