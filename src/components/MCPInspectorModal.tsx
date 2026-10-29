import React, { useState } from 'react';
import { User, Board, BoardList, Card, ActivityLog } from '../domain/types';
import { executeMCPTool, MCPAppState } from '../domain/rules';
import {
  X,
  Play,
  Terminal,
  Code2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface MCPInspectorModalProps {
  currentUser: User;
  boards: Board[];
  lists: BoardList[];
  cards: Card[];
  allUsers: User[];
  activityLogs: ActivityLog[];
  onApplyStateUpdate: (updates: { cards?: Card[]; activityLogs?: ActivityLog[] }) => void;
  onClose: () => void;
}

interface ToolPreset {
  name: string;
  description: string;
  defaultArgs: Record<string, any>;
}

const toolPresets: ToolPreset[] = [
  {
    name: 'list_my_cards',
    description: 'Lists all cards assigned to the authenticated user across visible boards',
    defaultArgs: {},
  },
  {
    name: 'move_card',
    description: 'Moves a card to a different list on the board, enforcing user role rules',
    defaultArgs: { card_id: 12, target_list_title: 'Done' },
  },
  {
    name: 'add_card',
    description: 'Adds a new task card to a specified board and list',
    defaultArgs: {
      title: 'Send invoice #8493',
      board_name: 'Ops',
      list_title: 'Doing',
      description: 'Prepare and dispatch monthly cloud hosting invoice',
    },
  },
  {
    name: 'list_overdue',
    description: 'Finds all cards past their due date that are not in Done',
    defaultArgs: {},
  },
  {
    name: 'turn_card_into_checklist',
    description: 'AI Extra: Generates checklist items for a card from its title and description',
    defaultArgs: { card_id: 1 },
  },
  {
    name: 'get_board_summary',
    description: 'AI Extra: Generates a concise daily breakdown of board metrics',
    defaultArgs: { board_name: 'Product Launch' },
  },
];

export const MCPInspectorModal: React.FC<MCPInspectorModalProps> = ({
  currentUser,
  boards,
  lists,
  cards,
  allUsers,
  activityLogs,
  onApplyStateUpdate,
  onClose,
}) => {
  const [selectedTool, setSelectedTool] = useState<ToolPreset>(toolPresets[0]);
  const [argsJson, setArgsJson] = useState<string>(
    JSON.stringify(toolPresets[0].defaultArgs, null, 2)
  );
  const [rpcResponse, setRpcResponse] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [copiedReq, setCopiedReq] = useState(false);

  const handleSelectPreset = (preset: ToolPreset) => {
    setSelectedTool(preset);
    setArgsJson(JSON.stringify(preset.defaultArgs, null, 2));
    setParseError(null);
  };

  const handleExecute = () => {
    let parsedArgs: Record<string, any> = {};
    try {
      parsedArgs = JSON.parse(argsJson);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'Invalid JSON');
      return;
    }

    const appState: MCPAppState = {
      boards,
      lists,
      cards,
      users: allUsers,
      activityLogs,
    };

    const result = executeMCPTool(selectedTool.name, parsedArgs, currentUser, appState);

    // Build standard JSON-RPC 2.0 response format
    const responsePayload = {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 1000) + 1,
      result: {
        content: [
          {
            type: 'text',
            text: result.message,
          },
        ],
        structured_data: result.data || null,
        success: result.success,
      },
    };

    setRpcResponse(responsePayload);

    if (result.success && result.newState) {
      onApplyStateUpdate(result.newState);
    }
  };

  const jsonRpcRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: selectedTool.name,
      arguments: (() => {
        try {
          return JSON.parse(argsJson);
        } catch {
          return {};
        }
      })(),
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">MCP Tool Inspector & Protocol Console</h2>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-mono">
                  JSON-RPC 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execute actions as <span className="text-white font-semibold">{currentUser.name}</span> ({currentUser.role})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close MCP Inspector"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tool selector tabs */}
        <div className="bg-slate-900 px-6 py-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1">
            Available Tools:
          </span>
          {toolPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs transition-colors shrink-0 ${
                selectedTool.name === preset.name
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Main Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden text-xs">
          {/* Left: Arguments Editor */}
          <div className="p-5 flex flex-col min-h-0 overflow-y-auto">
            <div className="mb-3">
              <h3 className="font-bold text-slate-900 text-sm font-mono flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                {selectedTool.name}
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">{selectedTool.description}</p>
            </div>

            <div className="flex-1 flex flex-col mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-700 text-xs">Arguments (JSON)</label>
                {parseError && (
                  <span className="text-rose-600 font-medium text-[11px] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {parseError}
                  </span>
                )}
              </div>
              <textarea
                value={argsJson}
                onChange={(e) => {
                  setArgsJson(e.target.value);
                  try {
                    JSON.parse(e.target.value);
                    setParseError(null);
                  } catch (err: any) {
                    setParseError(err.message);
                  }
                }}
                rows={7}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none"
              />
            </div>

            <div className="mt-auto pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Executes via shared Domain UseCase
              </span>
              <button
                onClick={handleExecute}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Call MCP Tool</span>
              </button>
            </div>
          </div>

          {/* Right: Live Protocol Payload (Request & Response) */}
          <div className="p-5 flex flex-col min-h-0 bg-slate-950 text-slate-300 overflow-y-auto font-mono text-xs">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Outgoing JSON-RPC Request
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(jsonRpcRequest, null, 2));
                    setCopiedReq(true);
                    setTimeout(() => setCopiedReq(false), 2000);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copiedReq ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedReq ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 rounded-xl text-slate-300 overflow-x-auto text-[11px] border border-slate-800">
                {JSON.stringify(jsonRpcRequest, null, 2)}
              </pre>
            </div>

            <div className="flex-1 flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                MCP Server Response
              </span>
              {rpcResponse ? (
                <pre
                  className={`flex-1 p-3 rounded-xl overflow-auto text-[11px] border ${
                    rpcResponse.result?.success
                      ? 'bg-slate-900 border-emerald-900/50 text-emerald-300'
                      : 'bg-slate-900 border-rose-900/50 text-rose-300'
                  }`}
                >
                  {JSON.stringify(rpcResponse, null, 2)}
                </pre>
              ) : (
                <div className="flex-1 p-6 border border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-500 text-center">
                  Click "Call MCP Tool" to invoke this action and view the live response payload.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Note: All MCP actions update board state in real-time.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
