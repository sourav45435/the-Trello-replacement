import React from 'react';
import { Card, User, BoardList, CardLabel } from '../domain/types';
import { isCardOverdue, isCardBlocked } from '../domain/rules';
import { Calendar, CheckSquare, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

interface CardItemProps {
  card: Card;
  allUsers: User[];
  allCards: Card[];
  allLists: BoardList[];
  canEdit: boolean;
  onOpenDetails: (card: Card) => void;
  onQuickMove: (cardId: number, targetListId: string) => void;
  onDragStart: (e: React.DragEvent, cardId: number) => void;
}

// Pastel label styles matching the showcase aesthetic
const labelStyles: Record<CardLabel, { bg: string; text: string; border: string }> = {
  Design: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Development: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Content: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  DevOps: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  QA: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  Research: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  Marketing: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Ops: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  allUsers,
  allCards,
  allLists,
  canEdit,
  onOpenDetails,
  onQuickMove,
  onDragStart,
}) => {
  const assignee = allUsers.find((u) => u.id === card.assigneeId);
  const overdue = isCardOverdue(card);
  const blocked = isCardBlocked(card, allCards, allLists);
  const currentList = allLists.find(l => l.id === card.listId);
  const isDone = currentList?.title.toLowerCase() === 'done';

  const completedChecklist = card.checklist?.filter((c) => c.completed).length || 0;
  const totalChecklist = card.checklist?.length || 0;

  // Other lists on same board for quick move
  const targetLists = allLists.filter((l) => l.boardId === card.boardId && l.id !== card.listId);

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => onDragStart(e, card.id)}
      onClick={() => onOpenDetails(card)}
      tabIndex={0}
      role="button"
      aria-label={`Card: ${card.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetails(card);
        }
      }}
      className={`group relative bg-white rounded-xl p-3.5 border transition-all duration-150 cursor-pointer select-none ${
        canEdit ? 'hover:shadow-md hover:border-blue-300' : 'cursor-default'
      } ${
        overdue && !isDone
          ? 'border-amber-300/80 bg-amber-50/10'
          : blocked
          ? 'border-orange-300 bg-orange-50/20'
          : 'border-slate-200/90 shadow-2xs'
      }`}
    >
      {/* Title */}
      <h3 className="text-[13px] font-semibold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
        {card.title}
      </h3>

      {/* Dependency blocker alert if applicable */}
      {blocked && !isDone && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-100/70 border border-orange-200 px-2 py-0.5 rounded">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>Blocked by #{card.blockedBy?.join(', #')}</span>
        </div>
      )}

      {/* Middle row: Assignee Avatar + Primary Label Tag matching screenshot */}
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {assignee ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              title={`Assigned to ${assignee.name}`}
              className="w-5 h-5 rounded-full object-cover border border-slate-300"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-500 text-[10px] flex items-center justify-center font-bold">
              ?
            </div>
          )}

          {card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.labels.map((lbl) => {
                const style = labelStyles[lbl] || {
                  bg: 'bg-slate-100',
                  text: 'text-slate-700',
                  border: 'border-slate-200',
                };
                return (
                  <span
                    key={lbl}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}
                  >
                    {lbl}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick move dropdown for accessibility / mobile */}
        {canEdit && targetLists.length > 0 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <select
              aria-label={`Quick move ${card.title}`}
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  onQuickMove(card.id, e.target.value);
                  e.target.value = '';
                }
              }}
              className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5 cursor-pointer focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>
                Move...
              </option>
              {targetLists.map((l) => (
                <option key={l.id} value={l.id}>
                  → {l.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Footer row: Due date badge + Checklist count */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div
          className={`flex items-center gap-1 font-medium ${
            overdue && !isDone
              ? 'text-rose-600 font-semibold'
              : 'text-slate-500'
          }`}
          title={overdue && !isDone ? 'Overdue task' : 'Due date'}
        >
          {overdue && !isDone ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          ) : (
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span>{formatDisplayDate(card.dueDate)}</span>
          {overdue && !isDone && (
            <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold ml-0.5">
              OVERDUE
            </span>
          )}
        </div>

        {totalChecklist > 0 && (
          <div
            className={`flex items-center gap-1 text-[11px] ${
              completedChecklist === totalChecklist
                ? 'text-emerald-600 font-semibold'
                : 'text-slate-500'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>
              {completedChecklist}/{totalChecklist}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
