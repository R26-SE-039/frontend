import Editor from '@monaco-editor/react';

type TestCaseCodeEditorProps = {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
};

export default function TestCaseCodeEditor({
  value,
  language,
  onChange,
  height = '480px',
  readOnly = false,
}: TestCaseCodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(next) => onChange?.(next ?? '')}
        theme="vs"
        loading={
          <div className="flex h-full min-h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
          </div>
        }
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'line',
          automaticLayout: true,
        }}
      />
    </div>
  );
}
