import React from 'react';
import { User } from '../domain/types';
import { Layers, Sparkles, Shield, UserCheck, Eye, Terminal } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  onOpenDodilPackage: () => void;
  onOpenMCPModal: () => void;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  allUsers,
  onOpenDodilPackage,
  onOpenMCPModal,
  onToggleMobileSidebar,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
      {/* Brand logo & tagline matching reference showcase */}
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex items-center gap-3">
          {onToggleMobileSidebar && (
            <button
              onClick={onToggleMobileSidebar}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              <Layers className="w-4 h-4 text-blue-600" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">TaskFlow</span>
          </div>
          <div className="h-4 w-px bg-slate-300 hidden md:block" />
          <span className="text-slate-500 font-medium text-xs hidden md:inline">
            Plan. Organize. Get it done.
          </span>
        </div>
      </div>

      {/* Right controls: quick persona switcher to test Owner/Member/Viewer rules + Dodil package button */}
      <div className="flex items-center flex-wrap gap-2.5 w-full md:w-auto justify-end">
        {/* Current user & Role selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Role Test:</span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = allUsers.find(u => u.id === e.target.value);
              if (selected) onSwitchUser(selected);
            }}
            aria-label="Switch active test role"
            className="bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role.toUpperCase()})
              </option>
            ))}
          </select>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              currentUser.role === 'owner'
                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                : currentUser.role === 'member'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}
          >
            {currentUser.role === 'owner' && <Shield className="w-3 h-3" />}
            {currentUser.role === 'member' && <UserCheck className="w-3 h-3" />}
            {currentUser.role === 'viewer' && <Eye className="w-3 h-3" />}
            {currentUser.role}
          </span>
        </div>

        {/* MCP protocol button */}
        <button
          onClick={onOpenMCPModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="Open MCP JSON-RPC Inspector"
        >
          <Terminal className="w-3.5 h-3.5 text-slate-600" />
          <span>MCP Inspector</span>
        </button>

        {/* Dodil Remix & Challenge Package */}
        <button
          onClick={onOpenDodilPackage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dodil Remix Package</span>
        </button>
      </div>
    </header>
  );
};
