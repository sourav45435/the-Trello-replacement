import React, { useState } from 'react';
import { dodilArtifacts, DodilFileItem } from '../data/dodilArtifacts';
import {
  X,
  Copy,
  Check,
  FileCode,
  Terminal,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Download,
} from 'lucide-react';

interface DodilRemixModalProps {
  onClose: () => void;
}

export const DodilRemixModal: React.FC<DodilRemixModalProps> = ({ onClose }) => {
  const [selectedFile, setSelectedFile] = useState<DodilFileItem>(dodilArtifacts[0]);
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(
      'dodil git remix acme-org/taskflow --to-org <your-org> --name taskflow'
    );
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Dodil Boards Challenge Submission</h2>
                <span className="text-[10px] bg-blue-500/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded font-mono">
                  100% Dodil Compliant
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1-Click Remixable repository with DataK3, appid user pool, and native MCP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close remix package"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Remix Command Banner */}
        <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-emerald-400 font-semibold">$</span>
            <span className="text-slate-100 font-medium">
              dodil git remix acme-org/taskflow --to-org &lt;your-org&gt; --name taskflow
            </span>
          </div>
          <button
            onClick={handleCopyCommand}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 shrink-0 transition-colors"
          >
            {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCmd ? 'Copied CLI Command' : 'Copy Remix Command'}</span>
          </button>
        </div>

        {/* Rules Checklist Grid */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DataK3 (No external DB)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>appid User Pool</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Native MCP Actions</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Valid remix.yaml</span>
          </div>
        </div>

        {/* Main code viewer layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* File selector sidebar */}
          <div className="w-full md:w-60 bg-slate-100 border-r border-slate-200 p-3 overflow-y-auto space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block mb-1">
              Contest Files
            </span>
            {dodilArtifacts.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{file.path}</span>
                </button>
              );
            })}
          </div>

          {/* Code content window */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-200 overflow-hidden">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-semibold text-blue-400">
                  {selectedFile.path}
                </span>
                <p className="text-[10px] text-slate-400">{selectedFile.description}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="flex-1 p-4 overflow-auto text-xs font-mono leading-relaxed text-slate-300">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Test accounts: <span className="font-semibold text-slate-700">alex@acmeworkspace.io</span> (Owner),{' '}
            <span className="font-semibold text-slate-700">sarah@acmeworkspace.io</span> (Member)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
