import React, { useState } from 'react';
import { X, Copy, Check, Download, Upload, Share2, AlertCircle, FileCode, CheckCircle2 } from 'lucide-react';
import { LibraryWallpaperItem } from '../../library/types';
import { WallpaperImportExport } from '../../library/WallpaperImportExport';

interface ImportExportModalProps {
  exportItem?: LibraryWallpaperItem | null;
  onClose: () => void;
  onImportSuccess: (importedId?: string) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  exportItem,
  onClose,
  onImportSuccess
}) => {
  const [mode, setMode] = useState<'export' | 'import'>(exportItem ? 'export' : 'import');
  const [importInput, setImportInput] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedJSON, setCopiedJSON] = useState<boolean>(false);

  // Generate codes if export item is provided
  const exportedCode = exportItem ? WallpaperImportExport.exportToCode(exportItem) : '';
  const exportedJSON = exportItem ? WallpaperImportExport.exportToJSON(exportItem) : '';

  const handleCopyCode = () => {
    if (!exportedCode) return;
    navigator.clipboard.writeText(exportedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyJSON = () => {
    if (!exportedJSON) return;
    navigator.clipboard.writeText(exportedJSON);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!exportedJSON || !exportItem) return;
    const blob = new Blob([exportedJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportItem.name.toLowerCase().replace(/\s+/g, '-')}-procedural.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDoImport = () => {
    setStatusMessage(null);
    if (!importInput.trim()) {
      setStatusMessage({ text: 'Please paste a World Code, Design Code, or JSON.', isError: true });
      return;
    }

    const res = WallpaperImportExport.importFromCodeOrJSON(importInput);
    if (res.success) {
      setStatusMessage({ text: res.message, isError: false });
      setTimeout(() => {
        onImportSuccess(res.importedId);
        onClose();
      }, 1200);
    } else {
      setStatusMessage({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#080d1a] border border-white/15 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-5">
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMode('export');
                setStatusMessage(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                mode === 'export'
                  ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Export
            </button>
            <button
              onClick={() => {
                setMode('import');
                setStatusMessage(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                mode === 'import'
                  ? 'bg-[#00FFA3]/20 text-[#00FFA3] border border-[#00FFA3]/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Import Code
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content based on Mode */}
        {mode === 'export' ? (
          <div className="space-y-4">
            {exportItem ? (
              <>
                <div>
                  <h4 className="text-sm font-bold text-white font-['Orbitron']">
                    Exporting "{exportItem.name}"
                  </h4>
                  <p className="text-xs text-slate-400">
                    Deterministic code containing procedural DNA parameters, seed, and shaders.
                  </p>
                </div>

                {/* World Code Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>WORLD CODE (COMPACT)</span>
                    <button
                      onClick={handleCopyCode}
                      className="text-[#00F0FF] hover:underline flex items-center gap-1"
                    >
                      {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-[11px] font-mono text-slate-300 break-all max-h-24 overflow-y-auto">
                    {exportedCode}
                  </div>
                </div>

                {/* JSON Export Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>JSON CONFIGURATION</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopyJSON}
                        className="text-[#00FFA3] hover:underline flex items-center gap-1"
                      >
                        {copiedJSON ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedJSON ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                      <button
                        onClick={handleDownloadJSON}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <Download size={12} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-slate-300 overflow-x-auto max-h-28">
                    {exportedJSON}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                Select a wallpaper from the library to export its code.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white font-['Orbitron']">
                Import Procedural Wallpaper
              </h4>
              <p className="text-xs text-slate-400">
                Paste a World Code (<span className="text-[#00F0FF]">HW-UNIVERSE-v1:...</span>), Design Code (<span className="text-[#00FFA3]">HW-DESIGN-v1:...</span>), or JSON configuration.
              </p>
            </div>

            <textarea
              rows={5}
              placeholder="Paste code or JSON here..."
              value={importInput}
              onChange={(e) => setImportInput(e.target.value)}
              className="w-full p-3 rounded-2xl bg-black/60 border border-white/15 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-[#00FFA3]"
            />

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 font-mono ${
                  statusMessage.isError
                    ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                }`}
              >
                {statusMessage.isError ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <button
              onClick={handleDoImport}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#00FFA3] to-[#00F0FF] text-black font-extrabold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:brightness-110 active:scale-95 transition-all"
            >
              Verify & Import Wallpaper
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
