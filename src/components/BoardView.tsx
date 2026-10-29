import React, { useState } from 'react';
import { Board, BoardList, Card, User } from '../domain/types';
import { canUserEditBoard } from '../domain/rules';
import { CardItem } from './CardItem';
import {
  KanbanSquare,
  Search,
  Plus,
  Activity,
  Settings,
  X,
  Filter,
  Lock,
} from 'lucide-react';

interface BoardViewProps {
  board: Board;
  lists: BoardList[];
  cards: Card[];
  allUsers: User[];
  currentUser: User;
  onOpenCardDetails: (card: Card) => void;
  onOpenNewCardModal: (defaultListId?: string) => void;
  onMoveCard: (cardId: number, targetListId: string) => void;
  onAddList: (title: string) => void;
  onOpenBoardActivity: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  board,
  lists,
  cards,
  allUsers,
  currentUser,
  onOpenCardDetails,
  onOpenNewCardModal,
  onMoveCard,
  onAddList,
  onOpenBoardActivity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [isAddingList, setIsAddingList] = useState(false);
  const [activeTab, setActiveTab] = useState<'board' | 'activity' | 'settings'>('board');

  const canEdit = canUserEditBoard(currentUser, board);

  // Filter cards by search and label
  const filteredCards = cards.filter((card) => {
    if (card.boardId !== board.id) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = card.title.toLowerCase().includes(q);
      const matchDesc = card.description?.toLowerCase().includes(q);
      const matchLabel = card.labels.some((l) => l.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchLabel) return false;
    }
    if (filterLabel !== 'all') {
      if (!card.labels.includes(filterLabel as any)) return false;
    }
    return true;
  });

  // Filter lists belonging to this board
  const boardLists = lists
    .filter((l) => l.boardId === board.id)
    .sort((a, b) => a.order - b.order);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, cardId: number) => {
    e.dataTransfer.setData('text/plain', String(cardId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, listId: string) => {
    if (!canEdit) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverListId !== listId) {
      setDragOverListId(listId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, listId: string) => {
    if (dragOverListId === listId) {
      setDragOverListId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetListId: string) => {
    e.preventDefault();
    setDragOverListId(null);
    if (!canEdit) return;
    const cardIdStr = e.dataTransfer.getData('text/plain');
    if (cardIdStr) {
      const cardId = Number(cardIdStr);
      onMoveCard(cardId, targetListId);
    }
  };

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListTitle.trim()) {
      onAddList(newListTitle.trim());
      setNewListTitle('');
      setIsAddingList(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
      {/* Board Top Header matching screenshot */}
      <div className="bg-white border-b border-slate-200 px-5 py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0"
              style={{ backgroundColor: board.color }}
            >
              <KanbanSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                {board.name}
                {!canEdit && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> Viewer (Read Only)
                  </span>
                )}
              </h1>
            </div>
          </div>

          {/* Search cards input & New Card button */}
          <div className="flex items-center gap-2">
            <div className="relative w-40 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7.5 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => onOpenNewCardModal(boardLists[0]?.id)}
              disabled={!canEdit}
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-white shadow-xs transition-colors shrink-0 ${
                canEdit
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed text-slate-500'
              }`}
              title={canEdit ? 'Add a new card' : 'Viewers cannot create cards'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Card</span>
            </button>
          </div>
        </div>

        {/* Sub-nav tabs: Board, Activity, Settings */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-1.5 pb-1 font-medium border-b-2 transition-colors ${
                activeTab === 'board'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('activity');
                onOpenBoardActivity();
              }}
              className={`flex items-center gap-1.5 pb-1 font-medium border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Activity</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 pb-1 font-medium border-b-2 transition-colors ${
                activeTab === 'settings'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>

          {/* Quick label filter */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              aria-label="Filter cards by label"
              className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none"
            >
              <option value="all">All labels</option>
              <option value="Design">Design</option>
              <option value="Development">Development</option>
              <option value="Content">Content</option>
              <option value="DevOps">DevOps</option>
              <option value="QA">QA</option>
              <option value="Research">Research</option>
              <option value="Marketing">Marketing</option>
              <option value="Ops">Ops</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Lists Canvas: Grid so all 4 columns (To Do, Doing, Review, Done) fit beautifully */}
      <div className="p-4 overflow-x-auto flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 min-w-[760px]">
          {boardLists.map((list) => {
            const listCards = filteredCards
              .filter((c) => c.listId === list.id)
              .sort((a, b) => a.order - b.order);

            const isOver = dragOverListId === list.id;

            return (
              <div
                key={list.id}
                onDragOver={(e) => handleDragOver(e, list.id)}
                onDragLeave={(e) => handleDragLeave(e, list.id)}
                onDrop={(e) => handleDrop(e, list.id)}
                className={`rounded-xl flex flex-col transition-colors border ${
                  isOver
                    ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-300'
                    : 'bg-slate-100/70 border-slate-200/90'
                }`}
              >
                {/* List header */}
                <div className="px-3.5 py-2.5 flex items-center justify-between border-b border-slate-200/50">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-bold text-slate-800">{list.title}</h2>
                    <span className="w-4.5 h-4.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      {listCards.length}
                    </span>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => onOpenNewCardModal(list.id)}
                      title={`Add card to ${list.title}`}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Cards Container */}
                <div className="p-2.5 space-y-2 overflow-y-auto max-h-[480px]">
                  {listCards.map((card) => (
                    <CardItem
                      key={card.id}
                      card={card}
                      allUsers={allUsers}
                      allCards={cards}
                      allLists={lists}
                      canEdit={canEdit}
                      onOpenDetails={onOpenCardDetails}
                      onQuickMove={onMoveCard}
                      onDragStart={handleDragStart}
                    />
                  ))}

                  {listCards.length === 0 && (
                    <div className="py-6 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No cards
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add list button if needed */}
        {canEdit && (
          <div className="mt-3">
            {isAddingList ? (
              <form
                onSubmit={handleCreateListSubmit}
                className="bg-white p-2.5 rounded-xl border border-slate-300 shadow-xs max-w-xs flex gap-2"
              >
                <input
                  type="text"
                  placeholder="New list title..."
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  autoFocus
                  className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingList(false)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingList(true)}
                className="py-1 px-3 rounded-lg border border-dashed border-slate-300 text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add another list</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
