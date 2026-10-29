import React, { useState } from 'react';
import { Card, User, BoardList, CardLabel, ActivityLog } from '../domain/types';
import { canUserEditBoard } from '../domain/rules';
import {
  X,
  Calendar,
  User as UserIcon,
  Tag,
  CheckSquare,
  Sparkles,
  Link2,
  Clock,
  Trash2,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface CardDetailModalProps {
  card: Card;
  allUsers: User[];
  allLists: BoardList[];
  allCards: Card[];
  currentUser: User;
  activityLogs: ActivityLog[];
  onClose: () => void;
  onUpdateCard: (updatedCard: Card) => void;
  onDeleteCard: (cardId: number) => void;
  onGenerateAiChecklist: (cardId: number) => void;
}

const availableLabels: CardLabel[] = [
  'Design',
  'Development',
  'Content',
  'DevOps',
  'QA',
  'Research',
  'Marketing',
  'Ops',
];

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  allUsers,
  allLists,
  allCards,
  currentUser,
  activityLogs,
  onClose,
  onUpdateCard,
  onDeleteCard,
  onGenerateAiChecklist,
}) => {
  const currentBoardLists = allLists.filter((l) => l.boardId === card.boardId);
  const board = { id: card.boardId, memberIds: allUsers.map((u) => u.id) } as any;
  const canEdit = canUserEditBoard(currentUser, board);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [listId, setListId] = useState(card.listId);
  const [assigneeId, setAssigneeId] = useState(card.assigneeId);
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [labels, setLabels] = useState<CardLabel[]>(card.labels || []);
  const [checklist, setChecklist] = useState(card.checklist || []);
  const [newChecklistText, setNewChecklistText] = useState('');
  const [blockedBy, setBlockedBy] = useState<number[]>(card.blockedBy || []);

  const cardActivities = activityLogs.filter((a) => a.cardId === card.id);
  const otherBoardCards = allCards.filter((c) => c.boardId === card.boardId && c.id !== card.id);

  const handleSave = () => {
    if (!canEdit) return;
    onUpdateCard({
      ...card,
      title,
      description,
      listId,
      assigneeId,
      dueDate,
      labels,
      checklist,
      blockedBy,
    });
  };

  const toggleChecklist = (id: string) => {
    if (!canEdit) return;
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklist(updated);
    onUpdateCard({ ...card, checklist: updated });
  };

  const addChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim() || !canEdit) return;
    const newItem = {
      id: `chk_${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistText('');
    onUpdateCard({ ...card, checklist: updated });
  };

  const toggleLabel = (label: CardLabel) => {
    if (!canEdit) return;
    const updated = labels.includes(label)
      ? labels.filter((l) => l !== label)
      : [...labels, label];
    setLabels(updated);
    onUpdateCard({ ...card, labels: updated });
  };

  const toggleBlocker = (blockerId: number) => {
    if (!canEdit) return;
    const updated = blockedBy.includes(blockerId)
      ? blockedBy.filter((id) => id !== blockerId)
      : [...blockedBy, blockerId];
    setBlockedBy(updated);
    onUpdateCard({ ...card, blockedBy: updated });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Card #{card.id}</span>
            {!canEdit && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-semibold">
                Read Only (Viewer)
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close card details"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Card Title</label>
            <input
              type="text"
              value={title}
              disabled={!canEdit}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="w-full text-base font-bold text-slate-900 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>

          {/* Quick meta grid: List, Assignee, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> List
              </label>
              <select
                value={listId}
                disabled={!canEdit}
                onChange={(e) => {
                  setListId(e.target.value);
                  onUpdateCard({ ...card, listId: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 disabled:bg-slate-100"
              >
                {currentBoardLists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" /> Assignee
              </label>
              <select
                value={assigneeId}
                disabled={!canEdit}
                onChange={(e) => {
                  setAssigneeId(e.target.value);
                  onUpdateCard({ ...card, assigneeId: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 disabled:bg-slate-100"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                disabled={!canEdit}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  onUpdateCard({ ...card, dueDate: e.target.value });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1.5">Labels</label>
            <div className="flex flex-wrap gap-1.5">
              {availableLabels.map((lbl) => {
                const isSelected = labels.includes(lbl);
                return (
                  <button
                    key={lbl}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleLabel(lbl)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              disabled={!canEdit}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              placeholder="Add more details about this task..."
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
            />
          </div>

          {/* Checklist with AI Extra */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800 text-sm">Checklist</span>
                <span className="text-slate-500 font-medium">
                  ({checklist.filter((i) => i.completed).length}/{checklist.length})
                </span>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onGenerateAiChecklist(card.id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors border border-indigo-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>AI: Turn into Checklist</span>
                </button>
              )}
            </div>

            {/* Checklist progress bar */}
            {checklist.length > 0 && (
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-3">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{
                    width: `${(checklist.filter((i) => i.completed).length / checklist.length) * 100}%`,
                  }}
                />
              </div>
            )}

            <div className="space-y-1.5">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled={!canEdit}
                    onChange={() => toggleChecklist(item.id)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span
                    className={`flex-1 text-xs ${
                      item.completed ? 'line-through text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {item.text}
                  </span>
                </label>
              ))}
            </div>

            {canEdit && (
              <form onSubmit={addChecklistItem} className="mt-2.5 flex gap-2">
                <input
                  type="text"
                  placeholder="Add an item..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={!newChecklistText.trim()}
                  className="px-2.5 py-1 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 disabled:opacity-40"
                >
                  Add
                </button>
              </form>
            )}
          </div>

          {/* Card Dependencies / Blockers (Contest Extra) */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-orange-600" />
              <span className="font-bold text-slate-800 text-sm">Dependencies (Blocked by)</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Mark tasks on this board that must be completed before this card can be worked on.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {otherBoardCards.map((c) => {
                const isBlockedByThis = blockedBy.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => toggleBlocker(c.id)}
                    className={`px-2 py-1 rounded text-xs border transition-colors ${
                      isBlockedByThis
                        ? 'bg-orange-100 border-orange-300 text-orange-800 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    #{c.id} {c.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Activity audit history on this card */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-slate-600 font-semibold">
              <Clock className="w-4 h-4" />
              <span>Card Activity Audit Trail</span>
            </div>
            <div className="space-y-2 border-l-2 border-slate-200 pl-3">
              {cardActivities.map((act) => (
                <div key={act.id} className="text-[11px]">
                  <span className="text-slate-800 font-medium">{act.details}</span>
                  <span className="text-slate-400 ml-2">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {cardActivities.length === 0 && (
                <p className="text-[11px] text-slate-400">No recent activity logged for this card.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {canEdit && (
            <button
              onClick={() => {
                onDeleteCard(card.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium p-1 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Card</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
            >
              Close
            </button>
            {canEdit && (
              <button
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
