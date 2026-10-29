/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  initialUsers,
  initialBoards,
  initialLists,
  initialCards,
  initialActivityLogs,
} from './data/initialData';
import { User, Board, BoardList, Card, ActivityLog, Role, CardLabel } from './domain/types';
import {
  canUserEditBoard,
  canUserManageMembers,
  createActivityRecord,
  executeMCPTool,
  MCPAppState,
} from './domain/rules';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BoardView } from './components/BoardView';
import { HomeOverview } from './components/HomeOverview';
import { AiAssistantPanel } from './components/AiAssistantPanel';
import { BottomShowcaseCards, TaskFlowPromoCard } from './components/BottomShowcaseCards';
import { CardDetailModal } from './components/CardDetailModal';
import { NewCardModal } from './components/NewCardModal';
import { MembersModal } from './components/MembersModal';
import { ActivityView } from './components/ActivityView';
import { DodilRemixModal } from './components/DodilRemixModal';
import { MCPInspectorModal } from './components/MCPInspectorModal';
import { NewBoardModal } from './components/NewBoardModal';

export default function App() {
  // Application State
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User>(initialUsers[0]); // Alex Johnson (Owner)
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [activeBoardId, setActiveBoardId] = useState<string>('b_product');
  const [lists, setLists] = useState<BoardList[]>(initialLists);
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(initialActivityLogs);
  const [currentView, setCurrentView] = useState<'boards' | 'members' | 'activity' | 'home'>('boards');

  // Modals state
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newCardDefaultListId, setNewCardDefaultListId] = useState<string | undefined>();
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDodilPackageModalOpen, setIsDodilPackageModalOpen] = useState(false);
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Find active board
  const activeBoard = boards.find((b) => b.id === activeBoardId) || boards[0];

  // Role check helper
  const canEditCurrentBoard = canUserEditBoard(currentUser, activeBoard);

  // Switch persona (Owner, Member, Viewer)
  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    showNotification(`Switched active persona to ${user.name} (${user.role.toUpperCase()})`);
  };

  // Move Card between lists
  const handleMoveCard = (cardId: number, targetListId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    if (!canEditCurrentBoard) {
      showNotification(`Permission Denied: As a ${currentUser.role}, you cannot move cards.`);
      return;
    }

    const targetList = lists.find((l) => l.id === targetListId);
    const fromList = lists.find((l) => l.id === card.listId);
    if (!targetList) return;

    const updatedCard: Card = {
      ...card,
      listId: targetListId,
      order: cards.filter((c) => c.listId === targetListId).length,
    };

    const updatedCards = cards.map((c) => (c.id === cardId ? updatedCard : c));
    const activity = createActivityRecord(
      currentUser,
      card.boardId,
      'move_card',
      `${currentUser.name} moved card #${card.id} "${card.title}" to ${targetList.title}`,
      card.id,
      fromList?.title,
      targetList.title
    );

    setCards(updatedCards);
    setActivityLogs([activity, ...activityLogs]);
    if (selectedCard?.id === cardId) {
      setSelectedCard(updatedCard);
    }
    showNotification(`Moved "${card.title}" to ${targetList.title}`);
  };

  // Create Card
  const handleCreateCard = (cardData: {
    title: string;
    description: string;
    listId: string;
    assigneeId: string;
    dueDate: string;
    labels: CardLabel[];
  }) => {
    if (!canEditCurrentBoard) {
      showNotification(`Permission Denied: As a ${currentUser.role}, you cannot create cards.`);
      return;
    }

    const maxId = cards.reduce((max, c) => Math.max(max, c.id), 0);
    const newId = maxId + 1;
    const targetList = lists.find((l) => l.id === cardData.listId);

    const newCard: Card = {
      id: newId,
      boardId: activeBoard.id,
      listId: cardData.listId,
      title: cardData.title,
      description: cardData.description,
      assigneeId: cardData.assigneeId,
      dueDate: cardData.dueDate,
      labels: cardData.labels,
      order: cards.filter((c) => c.listId === cardData.listId).length,
      checklist: [],
    };

    const activity = createActivityRecord(
      currentUser,
      activeBoard.id,
      'create_card',
      `${currentUser.name} created card #${newId} "${newCard.title}" in ${targetList?.title || 'list'}`,
      newId
    );

    setCards([...cards, newCard]);
    setActivityLogs([activity, ...activityLogs]);
    showNotification(`Card #${newId} "${newCard.title}" created successfully!`);
  };

  // Update Card
  const handleUpdateCard = (updatedCard: Card) => {
    if (!canEditCurrentBoard) {
      showNotification(`Permission Denied: Viewers cannot edit cards.`);
      return;
    }

    setCards(cards.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
    setSelectedCard(updatedCard);

    const activity = createActivityRecord(
      currentUser,
      updatedCard.boardId,
      'update_description',
      `${currentUser.name} updated card #${updatedCard.id} "${updatedCard.title}"`,
      updatedCard.id
    );
    setActivityLogs([activity, ...activityLogs]);
  };

  // Delete Card
  const handleDeleteCard = (cardId: number) => {
    if (!canEditCurrentBoard) return;
    const card = cards.find((c) => c.id === cardId);
    setCards(cards.filter((c) => c.id !== cardId));
    if (card) {
      const activity = createActivityRecord(
        currentUser,
        card.boardId,
        'update_description',
        `${currentUser.name} deleted card #${cardId} "${card.title}"`,
        cardId
      );
      setActivityLogs([activity, ...activityLogs]);
      showNotification(`Card #${cardId} deleted`);
    }
  };

  // Add List
  const handleAddList = (title: string) => {
    if (!canEditCurrentBoard) return;
    const newList: BoardList = {
      id: `list_${Date.now()}`,
      boardId: activeBoard.id,
      title,
      order: lists.filter((l) => l.boardId === activeBoard.id).length,
    };
    setLists([...lists, newList]);
    showNotification(`Added list "${title}"`);
  };

  // Create Board
  const handleCreateBoard = (boardData: {
    name: string;
    description: string;
    color: string;
    memberIds: string[];
  }) => {
    const newBoard: Board = {
      id: `board_${Date.now()}`,
      name: boardData.name,
      description: boardData.description,
      color: boardData.color,
      memberIds: boardData.memberIds,
    };

    // Default lists for new board
    const defaultLists: BoardList[] = [
      { id: `l_${Date.now()}_1`, boardId: newBoard.id, title: 'To Do', order: 0 },
      { id: `l_${Date.now()}_2`, boardId: newBoard.id, title: 'Doing', order: 1 },
      { id: `l_${Date.now()}_3`, boardId: newBoard.id, title: 'Done', order: 2 },
    ];

    setBoards([...boards, newBoard]);
    setLists([...lists, ...defaultLists]);
    setActiveBoardId(newBoard.id);
    setCurrentView('boards');
    showNotification(`Created board "${newBoard.name}"`);
  };

  // AI checklist generator extra
  const handleGenerateAiChecklist = (cardId: number) => {
    const appState: MCPAppState = {
      boards,
      lists,
      cards,
      users: allUsers,
      activityLogs,
    };
    const result = executeMCPTool('turn_card_into_checklist', { card_id: cardId }, currentUser, appState);
    if (result.success && result.newState) {
      if (result.newState.cards) setCards(result.newState.cards);
      if (result.newState.activityLogs) setActivityLogs(result.newState.activityLogs);
      if (result.data && selectedCard?.id === cardId) {
        setSelectedCard(result.data);
      }
      showNotification(result.message);
    }
  };

  // Invite member (Owner only)
  const handleInviteMember = (newMember: { name: string; email: string; role: Role }) => {
    if (!canUserManageMembers(currentUser)) {
      showNotification('Only the Owner can invite members.');
      return;
    }
    const newUser: User = {
      id: `usr_${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      avatar: `https://images.unsplash.com/photo-${1534528741775 + allUsers.length * 1000}?w=150&auto=format&fit=crop&q=80`,
    };
    setAllUsers([...allUsers, newUser]);
  };

  // Change member role (Owner only)
  const handleChangeRole = (userId: string, newRole: Role) => {
    if (!canUserManageMembers(currentUser)) return;
    setAllUsers(allUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    showNotification(`Updated role for member to ${newRole.toUpperCase()}`);
  };

  // Remove member (Owner only)
  const handleRemoveMember = (userId: string) => {
    if (!canUserManageMembers(currentUser)) return;
    setAllUsers(allUsers.filter((u) => u.id !== userId));
    showNotification('Member removed');
  };

  // Direct state updates from AI Assistant or MCP Inspector
  const handleApplyStateUpdate = (updates: { cards?: Card[]; activityLogs?: ActivityLog[] }) => {
    if (updates.cards) setCards(updates.cards);
    if (updates.activityLogs) setActivityLogs(updates.activityLogs);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-blue-100">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
        onOpenDodilPackage={() => setIsDodilPackageModalOpen(true)}
        onOpenMCPModal={() => setIsMCPModalOpen(true)}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      {/* Main App Grid matching showcase reference */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Area (Sidebar + Center Content + Bottom 4 Feature Cards) */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Left Dark Sidebar */}
            <Sidebar
              boards={boards}
              activeBoardId={activeBoardId}
              onSelectBoard={(id) => {
                setActiveBoardId(id);
                setIsMobileSidebarOpen(false);
              }}
              currentUser={currentUser}
              onOpenMembers={() => {
                setIsMembersModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onOpenActivity={() => {
                setIsActivityModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              onNewBoard={() => {
                setIsNewBoardModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              currentView={currentView}
              setCurrentView={(v) => {
                setCurrentView(v);
                setIsMobileSidebarOpen(false);
              }}
              isMobileOpen={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />

            {/* Center Board View or Home Overview */}
            {currentView === 'home' ? (
              <HomeOverview
                boards={boards}
                cards={cards}
                lists={lists}
                allUsers={allUsers}
                currentUser={currentUser}
                activityLogs={activityLogs}
                onSelectBoard={(bId) => {
                  setActiveBoardId(bId);
                  setCurrentView('boards');
                }}
                onOpenCardDetails={setSelectedCard}
                onOpenMCPModal={() => setIsMCPModalOpen(true)}
              />
            ) : (
              <BoardView
                board={activeBoard}
                lists={lists}
                cards={cards}
                allUsers={allUsers}
                currentUser={currentUser}
                onOpenCardDetails={setSelectedCard}
                onOpenNewCardModal={(defaultListId) => {
                  setNewCardDefaultListId(defaultListId);
                  setIsNewCardModalOpen(true);
                }}
                onMoveCard={handleMoveCard}
                onAddList={handleAddList}
                onOpenBoardActivity={() => setIsActivityModalOpen(true)}
              />
            )}
          </div>

          {/* 4 Bottom Showcase Cards */}
          <BottomShowcaseCards
            activityLogs={activityLogs}
            onOpenMembers={() => setIsMembersModalOpen(true)}
            onOpenActivity={() => setIsActivityModalOpen(true)}
            onOpenMCPModal={() => setIsMCPModalOpen(true)}
            onOpenDodilPackage={() => setIsDodilPackageModalOpen(true)}
          />
        </div>

        {/* Right Column: AI Assistant + Promo Card */}
        <div className="w-full lg:w-88 xl:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 p-3 justify-between">
          <div className="flex-1 min-h-0 flex flex-col">
            <AiAssistantPanel
              currentUser={currentUser}
              boards={boards}
              lists={lists}
              cards={cards}
              allUsers={allUsers}
              activityLogs={activityLogs}
              onApplyStateUpdate={handleApplyStateUpdate}
              onOpenCardDetails={setSelectedCard}
            />
          </div>
          <TaskFlowPromoCard onOpenDodilPackage={() => setIsDodilPackageModalOpen(true)} />
        </div>
      </div>

      {/* Modals */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          allUsers={allUsers}
          allLists={lists}
          allCards={cards}
          currentUser={currentUser}
          activityLogs={activityLogs}
          onClose={() => setSelectedCard(null)}
          onUpdateCard={handleUpdateCard}
          onDeleteCard={handleDeleteCard}
          onGenerateAiChecklist={handleGenerateAiChecklist}
        />
      )}

      {isNewCardModalOpen && (
        <NewCardModal
          boardId={activeBoard.id}
          boardName={activeBoard.name}
          lists={lists}
          allUsers={allUsers}
          defaultListId={newCardDefaultListId}
          onClose={() => setIsNewCardModalOpen(false)}
          onCreateCard={handleCreateCard}
        />
      )}

      {isMembersModalOpen && (
        <MembersModal
          currentUser={currentUser}
          allUsers={allUsers}
          onClose={() => setIsMembersModalOpen(false)}
          onInviteMember={handleInviteMember}
          onChangeRole={handleChangeRole}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {isActivityModalOpen && (
        <ActivityView
          activityLogs={activityLogs}
          allUsers={allUsers}
          boards={boards}
          onClose={() => setIsActivityModalOpen(false)}
          filterBoardId={currentView === 'boards' ? activeBoard.id : undefined}
        />
      )}

      {isDodilPackageModalOpen && (
        <DodilRemixModal onClose={() => setIsDodilPackageModalOpen(false)} />
      )}

      {isMCPModalOpen && (
        <MCPInspectorModal
          currentUser={currentUser}
          boards={boards}
          lists={lists}
          cards={cards}
          allUsers={allUsers}
          activityLogs={activityLogs}
          onApplyStateUpdate={handleApplyStateUpdate}
          onClose={() => setIsMCPModalOpen(false)}
        />
      )}

      {isNewBoardModalOpen && (
        <NewBoardModal
          allUsers={allUsers}
          onClose={() => setIsNewBoardModalOpen(false)}
          onCreateBoard={handleCreateBoard}
        />
      )}
    </div>
  );
}
