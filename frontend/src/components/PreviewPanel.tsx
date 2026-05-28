import { useEffect, useMemo, useState } from 'react';
import type { PreviewResponse } from '../lib/api';

interface Props {
  preview: PreviewResponse | null;
  loading: boolean;
  error?: string;
}

export function PreviewPanel({ preview, loading, error }: Props) {
  const textFiles = useMemo(
    () => preview?.files.filter((file) => !file.binary) ?? [],
    [preview]
  );

  const [selectedPath, setSelectedPath] = useState<string>('');

  useEffect(() => {
    if (!textFiles.length) {
      setSelectedPath('');
      return;
    }

    if (!textFiles.some((file) => file.path === selectedPath)) {
      setSelectedPath(textFiles[0].path);
    }
  }, [textFiles, selectedPath]);

  const selectedFile =
    textFiles.find((file) => file.path === selectedPath) ??
    textFiles[0] ??
    null;

  if (loading) {
    return <p className="muted">Rendering generated files…</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!preview) {
    return <p className="muted">Configure your project to preview generated files.</p>;
  }

  return (
    <div className="real-preview">
      <div className="preview-toolbar">
        <strong>{preview.folderName}/</strong>
        <span>{preview.files.length} files</span>
      </div>

      <div className="preview-grid">
        <div className="file-list" aria-label="Generated files">
          {preview.files.map((file) => (
            <button
              key={file.path}
              type="button"
              className={selectedFile?.path === file.path ? 'selected' : ''}
              disabled={file.binary}
              onClick={() => setSelectedPath(file.path)}
            >
              <span>{file.path}</span>
              {file.binary && <small>binary</small>}
              {file.executable && <small>exec</small>}
            </button>
          ))}
        </div>

        <div className="file-viewer">
          {selectedFile ? (
            <>
              <div className="file-viewer-header">
                <strong>{selectedFile.path}</strong>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(selectedFile.contents ?? '')}
                >
                  Copy
                </button>
              </div>
              <pre>
                <code>{selectedFile.contents}</code>
              </pre>
            </>
          ) : (
            <p className="muted">Select a text file to preview.</p>
          )}
        </div>
      </div>
    </div>
  );
}