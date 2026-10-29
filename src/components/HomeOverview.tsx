import React from 'react';
import { Board, Card, User, ActivityLog, BoardList } from '../domain/types';
import { isCardOverdue } from '../domain/rules';
import {
  KanbanSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  Shield,
  Layers,
} from 'lucide-react';

interface HomeOverviewProps {
  boards: Board[];
  cards: Card[];
  lists: BoardList[];
  allUsers: User[];
  currentUser: User;
  activityLogs: ActivityLog[];
  onSelectBoard: (boardId: string) => void;
  onOpenCardDetails: (card: Card) => void;
  onOpenMCPModal: () => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  boards,
  cards,
  lists,
  allUsers,
  currentUser,
  activityLogs,
  onSelectBoard,
  onOpenCardDetails,
  onOpenMCPModal,
}) => {
  const doneListIds = new Set(
    lists.filter((l) => l.title.toLowerCase() === 'done').map((l) => l.id)
  );

  const totalCards = cards.length;
  const completedCards = cards.filter((c) => doneListIds.has(c.listId)).length;
  const overdueCards = cards.filter(
    (c) => !doneListIds.has(c.listId) && isCardOverdue(c)
  );
  const myCards = cards.filter((c) => c.assigneeId === currentUser.id);

  return (
    <div className="flex-1 bg-[#f8fafc] overflow-y-auto p-6 space-y-6">
      {/* Welcome Hero */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Welcome back
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-semibold">{currentUser.role.toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentUser.name}'s Workspace Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            TaskFlow is tracking your team's sprints across {boards.length} boards. Connect with Claude or ChatGPT via MCP to manage cards with natural language.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMCPModal}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open MCP Terminal</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Cards</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalCards}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across all lists</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Assigned To You</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{myCards.length}</div>
          <div className="text-[10px] text-blue-500/80 mt-0.5">Active tasks</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Completed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedCards}</div>
          <div className="text-[10px] text-emerald-600/80 mt-0.5">Done list</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Overdue</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{overdueCards.length}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Needs immediate attention</div>
        </div>
      </div>

      {/* Two columns: Boards List + My Plate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Boards */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <KanbanSquare className="w-4 h-4 text-blue-600" />
              <span>Active Boards</span>
            </h2>
            <span className="text-xs text-slate-400">{boards.length} Boards</span>
          </div>

          <div className="space-y-3">
            {boards.map((b) => {
              const boardCards = cards.filter((c) => c.boardId === b.id);
              const boardLists = lists.filter((l) => l.boardId === b.id);

              return (
                <div
                  key={b.id}
                  onClick={() => onSelectBoard(b.id)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 truncate">
                        {b.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        {b.description || 'Team kanban board'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {boardCards.length} cards
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What's On My Plate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>On Your Plate</span>
              </h2>
              <span className="text-xs text-indigo-600 font-semibold">
                {myCards.length} tasks assigned
              </span>
            </div>

            <div className="space-y-2">
              {myCards.slice(0, 5).map((c) => {
                const overdue = isCardOverdue(c);
                return (
                  <div
                    key={c.id}
                    onClick={() => onOpenCardDetails(c)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-mono text-slate-400 text-[11px]">#{c.id}</span>
                      <span className="font-semibold text-slate-800 truncate">{c.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          overdue
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {overdue ? 'Overdue' : c.dueDate}
                      </span>
                    </div>
                  </div>
                );
              })}

              {myCards.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  You have no tasks assigned to you.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Ask Claude or ChatGPT: "What's on my plate?"</span>
            <span className="text-blue-600 font-semibold cursor-pointer" onClick={onOpenMCPModal}>
              Try in MCP →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
