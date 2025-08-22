import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface EditorPanelProps {
  files: Record<string, string>;
  onChange: (files: Record<string, string>) => void;
}

const tabs: Array<'index.html' | 'style.css' | 'index.js'> = [
  'index.html',
  'style.css',
  'index.js',
];

export default function EditorPanel({ files, onChange }: EditorPanelProps) {
  const [tab, setTab] = useState<'index.html' | 'style.css' | 'index.js'>('index.html');

  const getLanguage = (name: string): string => {
    if (name.endsWith('.js')) return 'javascript';
    if (name.endsWith('.css')) return 'css';
    return 'html';
  };

  return (
    <div className='editor-panel'>
      <div className="editor-tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`px-3 py-1 ${tab === t ? 'bg-gray-900' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <Editor
        height="800px"
        className='editor-box'
        language={getLanguage(tab)}
        value={files[tab]}
        onChange={(v) => onChange({ ...files, [tab]: v ?? '' })}
        theme="vs-dark"
      />
    </div>
  );
}