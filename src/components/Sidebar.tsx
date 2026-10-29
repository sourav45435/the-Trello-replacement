import React from 'react';
import { Board, User } from '../domain/types';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Activity,
  Plus,
  ChevronDown,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  boards: Board[];
  activeBoardId: string;
  onSelectBoard: (boardId: string) => void;
  currentUser: User;
  onOpenMembers: () => void;
  onOpenActivity: () => void;
  onNewBoard: () => void;
  currentView: 'boards' | 'members' | 'activity' | 'home';
  setCurrentView: (view: 'boards' | 'members' | 'activity' | 'home') => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  boards,
  activeBoardId,
  onSelectBoard,
  currentUser,
  onOpenMembers,
  onOpenActivity,
  onNewBoard,
  currentView,
  setCurrentView,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`w-60 bg-[#0f172a] text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 min-h-[480px] ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 z-50 shadow-2xl flex'
            : 'hidden md:flex'
        }`}
      >
      <div>
        {/* Window controls decoration & internal brand badge */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-1.5 mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
          </div>

          <div className="flex items-center gap-2 text-white">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">TaskFlow</span>
          </div>
        </div>

        {/* Workspace Dropdown */}
        <div className="p-3">
          <button
            type="button"
            className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition-colors border border-slate-700/50 text-left text-xs"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded bg-slate-700 text-blue-400 font-bold flex items-center justify-center text-xs">
                A
              </div>
              <span className="font-medium text-slate-200">Acme Workspace</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Primary Navigation */}
        <nav className="px-3 py-1 space-y-1">
          <button
            onClick={() => setCurrentView('home')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'home'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Home</span>
          </button>

          <button
            onClick={() => setCurrentView('boards')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'boards'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <KanbanSquare className="w-4 h-4" />
            <span>Boards</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('members');
              onOpenMembers();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'members'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('activity');
              onOpenActivity();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              currentView === 'activity'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Activity</span>
          </button>
        </nav>

        {/* Boards Section */}
        <div className="mt-5 px-3">
          <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
            <span>My Boards</span>
            {currentUser.role !== 'viewer' && (
              <button
                onClick={onNewBoard}
                title="Create Board"
                aria-label="Create Board"
                className="hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="mt-1 space-y-0.5">
            {boards.map((b) => {
              const isActive = b.id === activeBoardId && currentView === 'boards';
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    onSelectBoard(b.id);
                    setCurrentView('boards');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-white font-medium border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="truncate">{b.name}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                <span>{currentUser.role}</span>
                {currentUser.role === 'owner' && <ShieldCheck className="w-3 h-3 text-purple-400" />}
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        </div>
      </div>
    </aside>
    </>
  );
};
