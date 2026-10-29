import React, { useState } from 'react';
import { User, Role } from '../domain/types';
import { canUserManageMembers } from '../domain/rules';
import {
  X,
  UserPlus,
  Shield,
  UserCheck,
  Eye,
  Trash2,
  Lock,
  Mail,
  Check,
} from 'lucide-react';

interface MembersModalProps {
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
  onInviteMember: (newMember: { name: string; email: string; role: Role }) => void;
  onChangeRole: (userId: string, newRole: Role) => void;
  onRemoveMember: (userId: string) => void;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  currentUser,
  allUsers,
  onClose,
  onInviteMember,
  onChangeRole,
  onRemoveMember,
}) => {
  const isOwner = canUserManageMembers(currentUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [successToast, setSuccessToast] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !isOwner) return;

    onInviteMember({
      name: name.trim(),
      email: email.trim(),
      role,
    });

    setSuccessToast(`Invited ${name.trim()} as ${role}!`);
    setName('');
    setEmail('');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Workspace & People</h2>
              <p className="text-[11px] text-slate-500">
                Manage roles: Owner, Member, and Viewer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close members modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Permission notice banner if not Owner */}
          {!isOwner && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Member Management Restricted: </span>
                <span>
                  You are signed in as a <span className="font-semibold uppercase">{currentUser.role}</span>. Under Dodil rules, only the <span className="font-semibold">Owner</span> can invite members or update workspace roles. Switch your persona above to test Owner actions!
                </span>
              </div>
            </div>
          )}

          {/* Success toast */}
          {successToast && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-2.5 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold">{successToast}</span>
            </div>
          )}

          {/* Invite form - only enabled for Owner */}
          {isOwner && (
            <form onSubmit={handleInvite} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-xs">Invite New Team Member</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="jordan@acmeworkspace.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-slate-500 font-medium">Role:</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700"
                  >
                    <option value="member">Member (Can edit)</option>
                    <option value="viewer">Viewer (Read-only)</option>
                    <option value="owner">Owner (Full Admin)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Send Invite</span>
                </button>
              </div>
            </form>
          )}

          {/* Members list */}
          <div>
            <div className="text-slate-500 font-semibold mb-2 flex items-center justify-between">
              <span>Active Members ({allUsers.length})</span>
              <span className="text-[11px] text-slate-400">Owner invites members</span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {allUsers.map((u) => {
                const isCurrentUserRow = u.id === currentUser.id;
                return (
                  <div
                    key={u.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="truncate">{u.name}</span>
                          {isCurrentUserRow && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOwner && !isCurrentUserRow ? (
                        <select
                          value={u.role}
                          onChange={(e) => onChangeRole(u.id, e.target.value as Role)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="owner">Owner</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.role === 'owner'
                              ? 'bg-purple-100 text-purple-700'
                              : u.role === 'member'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {u.role === 'owner' && <Shield className="w-3 h-3" />}
                          {u.role === 'member' && <UserCheck className="w-3 h-3" />}
                          {u.role === 'viewer' && <Eye className="w-3 h-3" />}
                          {u.role}
                        </span>
                      )}

                      {isOwner && !isCurrentUserRow && (
                        <button
                          onClick={() => onRemoveMember(u.id)}
                          aria-label={`Remove ${u.name}`}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Role definitions reference card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/50">
              <div className="flex items-center gap-1.5 font-bold text-purple-900 text-xs mb-1">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Owner</span>
              </div>
              <p className="text-[11px] text-purple-800">
                Full workspace access. Only the owner can invite and manage members.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50">
              <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs mb-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Member</span>
              </div>
              <p className="text-[11px] text-blue-800">
                Can create, edit, and move cards across assigned boards.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs mb-1">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                <span>Viewer</span>
              </div>
              <p className="text-[11px] text-amber-800">
                Read-only access. Cannot edit cards, move cards, or manage members.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
