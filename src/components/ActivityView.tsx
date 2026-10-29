import React, { useState } from 'react';
import { ActivityLog, User, Board } from '../domain/types';
import {
  X,
  History,
  Filter,
  ArrowRight,
  Calendar,
  Layers,
  User as UserIcon,
} from 'lucide-react';

interface ActivityViewProps {
  activityLogs: ActivityLog[];
  allUsers: User[];
  boards: Board[];
  onClose: () => void;
  filterBoardId?: string;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activityLogs,
  allUsers,
  boards,
  onClose,
  filterBoardId,
}) => {
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>(
    filterBoardId || 'all'
  );

  const filtered = activityLogs.filter((act) => {
    if (selectedBoardFilter !== 'all' && act.boardId !== selectedBoardFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workspace Activity Log</h2>
              <p className="text-[11px] text-slate-500">
                Immutable audit trail of all card moves, assignments, and board edits
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close activity log"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Board filter bar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-semibold">Filter Board:</span>
            <select
              value={selectedBoardFilter}
              onChange={(e) => setSelectedBoardFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
            >
              <option value="all">All Boards</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 text-[11px]">
            {filtered.length} recorded events
          </span>
        </div>

        {/* Audit list */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {filtered.map((act) => {
            const user = allUsers.find((u) => u.id === act.userId);
            const board = boards.find((b) => b.id === act.boardId);

            return (
              <div
                key={act.id}
                className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/60 transition-colors flex items-start gap-3"
              >
                {user ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">
                      {user?.name || 'System / MCP'}
                    </span>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(act.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium text-xs mt-0.5 leading-relaxed">
                    {act.details}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
                    {board && (
                      <span className="flex items-center gap-1 font-semibold text-slate-500">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: board.color }}
                        />
                        {board.name}
                      </span>
                    )}

                    {act.fromList && act.toList && (
                      <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                        <span>{act.fromList}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span>{act.toList}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No activity logs recorded yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
