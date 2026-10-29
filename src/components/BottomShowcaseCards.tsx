import React from 'react';
import {
  Users,
  CreditCard,
  History,
  Sparkles,
  Shield,
  UserCheck,
  Eye,
  CheckCircle2,
  Calendar,
  Cloud,
  Lock,
  Zap,
  Layers,
} from 'lucide-react';
import { ActivityLog } from '../domain/types';

interface BottomShowcaseCardsProps {
  activityLogs: ActivityLog[];
  onOpenMembers: () => void;
  onOpenActivity: () => void;
  onOpenMCPModal: () => void;
  onOpenDodilPackage: () => void;
}

export const BottomShowcaseCards: React.FC<BottomShowcaseCardsProps> = ({
  activityLogs,
  onOpenMembers,
  onOpenActivity,
  onOpenMCPModal,
}) => {
  const recentActivities = activityLogs.slice(0, 5);

  return (
    <div className="p-4 border-t border-slate-200 bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Workspace & People */}
        <div
          onClick={onOpenMembers}
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-xs">Workspace & People</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 leading-tight">
              Invite your team, set roles, and get started in seconds.
            </p>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-purple-50/70 border border-purple-100">
                <div className="w-5 h-5 rounded bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Shield className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-purple-900 text-[10px]">Owner</div>
                  <div className="text-[9px] text-purple-700 truncate">Full access, manage members</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-50/70 border border-blue-100">
                <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <UserCheck className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-blue-900 text-[10px]">Member</div>
                  <div className="text-[9px] text-blue-700 truncate">Can edit boards and cards</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-100 border border-slate-200">
                <div className="w-5 h-5 rounded bg-slate-600 text-white flex items-center justify-center shrink-0">
                  <Eye className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-[10px]">Viewer</div>
                  <div className="text-[9px] text-slate-600 truncate">Read only, can't edit</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[10px] text-blue-600 font-semibold flex items-center justify-between">
            <span>Manage permissions</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 2: Card Details Preview matching screenshot */}
        <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-xs">Card Details</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-2 leading-tight">
              Keep everything in one place.
            </p>

            {/* Embedded Mini Card Preview */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 text-[11px]">Design landing page</div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-full font-medium">
                  Design
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-300 text-[8px] flex items-center justify-center font-bold">
                  SC
                </div>
                <span className="truncate">Sarah Chen</span>
                <span className="text-slate-300">•</span>
                <Calendar className="w-2.5 h-2.5 text-slate-400" />
                <span>Nov 5, 2026</span>
              </div>
              <p className="text-[9px] text-slate-500 line-clamp-2 leading-normal">
                Create a modern, responsive landing page for the product launch. Include key features, pricing and a clear CTA.
              </p>
              <div className="flex gap-1 pt-0.5">
                <span className="text-[8px] bg-white border border-slate-200 px-1 py-0.2 rounded text-slate-600">
                  Design
                </span>
                <span className="text-[8px] bg-white border border-slate-200 px-1 py-0.2 rounded text-slate-600">
                  Web
                </span>
                <span className="text-[8px] bg-white border border-slate-200 px-1 py-0.2 rounded text-slate-600">
                  Launch
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 text-[10px] text-slate-400">
            Checklists • Dependencies
          </div>
        </div>

        {/* Card 3: Activity Log */}
        <div
          onClick={onOpenActivity}
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-xs">Activity Log</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-2 leading-tight">
              Track every change, automatically.
            </p>

            <div className="space-y-1.5 text-xs">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-1.5 text-[10px] leading-tight">
                  <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold shrink-0 mt-0.5 text-[8px]">
                    {act.details.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 line-clamp-1">
                      <span className="font-semibold">{act.details}</span>
                    </p>
                    <span className="text-[9px] text-slate-400">
                      {new Date(act.timestamp).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-100 text-[10px] text-blue-600 font-semibold flex items-center justify-between">
            <span>View full audit log</span>
            <span>→</span>
          </div>
        </div>

        {/* Card 4: Use it from Claude or ChatGPT */}
        <div
          onClick={onOpenMCPModal}
          className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-xs">Use it from Claude or ChatGPT</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-2 leading-tight">
              Real actions. Real results.
            </p>

            {/* Badges for ChatGPT & Claude */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg mb-2">
              <div className="flex items-center gap-1 font-bold text-slate-800 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>ChatGPT</span>
              </div>
              <div className="h-3 w-px bg-slate-300" />
              <div className="flex items-center gap-1 font-bold text-slate-800 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Claude</span>
              </div>
            </div>

            <ul className="space-y-1 text-[10px] text-slate-700">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Ask about your tasks</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Add, move, assign cards</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Check what's overdue</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Only sees accessible boards</span>
              </li>
            </ul>
          </div>

          <div className="mt-2.5 inline-flex items-center justify-center gap-1 py-1 px-2 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
            <span>⚡ Connected via MCP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TaskFlowPromoCard: React.FC<{ onOpenDodilPackage: () => void }> = ({
  onOpenDodilPackage,
}) => {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white border border-slate-800 shadow-md flex flex-col justify-between mt-3">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
            <Layers className="w-3 h-3" />
          </div>
          <span className="font-bold text-xs tracking-tight text-white">TaskFlow</span>
        </div>
        <h3 className="text-sm font-bold tracking-tight text-white leading-tight">
          Your team's work, just a click away.
        </h3>
      </div>

      <div className="mt-3">
        <button
          onClick={onOpenDodilPackage}
          className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Get started →</span>
        </button>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-amber-400" />
            <span>Fast setup</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-emerald-400" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1">
            <Cloud className="w-2.5 h-2.5 text-sky-400" />
            <span>Built on Dodil</span>
          </div>
        </div>
      </div>
    </div>
  );
};
