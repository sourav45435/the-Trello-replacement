/**
 * TaskFlow Domain Rules
 * Pure business logic decoupled from UI components.
 */

import { User, Role, Card, Board, BoardList, ActivityLog } from './types';

/**
 * Role Permission Rules:
 * - Owner: full access, manage boards, cards, and team members.
 * - Member: can create and edit cards, move cards, manage checklists. Cannot manage members or delete boards.
 * - Viewer: read-only access. Cannot create, edit, move, or delete cards, cannot manage members.
 */

export function canUserManageMembers(user: User): boolean {
  return user.role === 'owner';
}

export function canUserEditBoard(user: User, board: Board): boolean {
  if (user.role === 'viewer') return false;
  // User must be a member of the board (or owner)
  if (user.role === 'owner') return true;
  return board.memberIds.includes(user.id);
}

export function canUserMoveCard(user: User, board: Board): boolean {
  return canUserEditBoard(user, board);
}

export function canUserCreateCard(user: User, board: Board): boolean {
  return canUserEditBoard(user, board);
}

export function canUserViewBoard(user: User, board: Board): boolean {
  if (user.role === 'owner') return true;
  return board.memberIds.includes(user.id);
}

/**
 * Card Due Date & Urgency Checks
 */

export function isCardOverdue(card: Card, referenceDate: Date = new Date()): boolean {
  if (!card.dueDate) return false;
  const due = new Date(card.dueDate);
  // Compare by calendar day: overdue if due date is strictly before start of reference date
  const refStartOfDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const dueStartOfDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueStartOfDay.getTime() < refStartOfDay.getTime();
}

export function isCardDueThisWeek(card: Card, referenceDate: Date = new Date()): boolean {
  if (!card.dueDate) return false;
  const due = new Date(card.dueDate);
  const refStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  
  // Calculate end of next 7 days
  const sevenDaysLater = new Date(refStart);
  sevenDaysLater.setDate(refStart.getDate() + 7);

  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  return dueStart.getTime() >= refStart.getTime() && dueStart.getTime() <= sevenDaysLater.getTime();
}

/**
 * Card Dependencies & Blockers
 */
export function getCardBlockers(card: Card, allCards: Card[], lists: BoardList[]): Card[] {
  if (!card.blockedBy || card.blockedBy.length === 0) return [];
  
  const doneList = lists.find(l => l.title.toLowerCase() === 'done');
  const doneListId = doneList?.id;

  return card.blockedBy
    .map(blockerId => allCards.find(c => c.id === blockerId))
    .filter((c): c is Card => c !== undefined && c.listId !== doneListId);
}

export function isCardBlocked(card: Card, allCards: Card[], lists: BoardList[]): boolean {
  return getCardBlockers(card, allCards, lists).length > 0;
}

/**
 * Activity Log Generator Helper
 */
export function createActivityRecord(
  user: User,
  boardId: string,
  action: ActivityLog['action'],
  details: string,
  cardId?: number,
  fromList?: string,
  toList?: string
): ActivityLog {
  return {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    cardId,
    boardId,
    userId: user.id,
    action,
    details,
    timestamp: new Date().toISOString(),
    fromList,
    toList,
  };
}

/**
 * Card Reordering logic
 */
export function reorderCardsInList(
  cards: Card[],
  listId: string,
  sourceIndex: number,
  destinationIndex: number
): Card[] {
  const listCards = cards.filter(c => c.listId === listId).sort((a, b) => a.order - b.order);
  const otherCards = cards.filter(c => c.listId !== listId);

  const [movedCard] = listCards.splice(sourceIndex, 1);
  if (!movedCard) return cards;

  listCards.splice(destinationIndex, 0, movedCard);

  // Re-assign continuous order indices
  const updatedListCards = listCards.map((card, idx) => ({
    ...card,
    order: idx,
  }));

  return [...otherCards, ...updatedListCards];
}

/**
 * MCP Tool Execution Engine
 * Maps natural actions to domain state updates while strictly enforcing:
 * 1. User sees ONLY accessible boards.
 * 2. User role permissions (viewers cannot edit/move/create).
 */
export interface MCPAppState {
  boards: Board[];
  lists: BoardList[];
  cards: Card[];
  users: User[];
  activityLogs: ActivityLog[];
}

export interface MCPExecutionResponse {
  success: boolean;
  message: string;
  newState?: Partial<MCPAppState>;
  actionTaken?: string;
  data?: any;
}

export function executeMCPTool(
  toolName: string,
  args: Record<string, any>,
  currentUser: User,
  state: MCPAppState
): MCPExecutionResponse {
  // Filter boards visible to current user
  const visibleBoards = state.boards.filter(b => canUserViewBoard(currentUser, b));
  const visibleBoardIds = new Set(visibleBoards.map(b => b.id));
  const visibleCards = state.cards.filter(c => visibleBoardIds.has(c.boardId));

  switch (toolName) {
    case 'list_my_cards': {
      const myCards = visibleCards.filter(c => c.assigneeId === currentUser.id);
      const formatted = myCards.map(c => {
        const board = visibleBoards.find(b => b.id === c.boardId);
        const list = state.lists.find(l => l.id === c.listId);
        return {
          id: c.id,
          title: c.title,
          board: board?.name || 'Unknown',
          list: list?.title || 'Unknown',
          dueDate: c.dueDate,
          labels: c.labels,
        };
      });

      return {
        success: true,
        message: `Found ${myCards.length} tasks assigned to you.`,
        data: formatted,
        actionTaken: 'list_my_cards',
      };
    }

    case 'list_overdue': {
      const overdueCards = visibleCards.filter(c => {
        const list = state.lists.find(l => l.id === c.listId);
        if (list && list.title.toLowerCase() === 'done') return false;
        return isCardOverdue(c);
      });

      const formatted = overdueCards.map(c => {
        const board = visibleBoards.find(b => b.id === c.boardId);
        const assignee = state.users.find(u => u.id === c.assigneeId);
        return {
          id: c.id,
          title: c.title,
          board: board?.name,
          dueDate: c.dueDate,
          assignee: assignee?.name || 'Unassigned',
        };
      });

      return {
        success: true,
        message: overdueCards.length === 0
          ? 'No overdue tasks found across your boards!'
          : `You have ${overdueCards.length} overdue card(s).`,
        data: formatted,
        actionTaken: 'list_overdue',
      };
    }

    case 'move_card': {
      const { card_id, target_list_title, target_list_id } = args;
      const cardIdNum = Number(card_id);
      const card = state.cards.find(c => c.id === cardIdNum);

      if (!card) {
        return {
          success: false,
          message: `Card #${card_id} not found or you don't have access to it.`,
        };
      }

      const board = state.boards.find(b => b.id === card.boardId);
      if (!board || !canUserViewBoard(currentUser, board)) {
        return {
          success: false,
          message: `You do not have access to board for Card #${card_id}.`,
        };
      }

      if (!canUserMoveCard(currentUser, board)) {
        return {
          success: false,
          message: `Permission denied: As a ${currentUser.role}, you cannot move cards.`,
        };
      }

      // Find target list
      let targetList: BoardList | undefined;
      if (target_list_id) {
        targetList = state.lists.find(l => l.id === target_list_id && l.boardId === board.id);
      } else if (target_list_title) {
        targetList = state.lists.find(
          l => l.boardId === board.id && l.title.toLowerCase() === String(target_list_title).toLowerCase()
        );
      }

      if (!targetList) {
        return {
          success: false,
          message: `Target list '${target_list_title || target_list_id}' not found on board '${board.name}'.`,
        };
      }

      const fromList = state.lists.find(l => l.id === card.listId);
      const updatedCard: Card = {
        ...card,
        listId: targetList.id,
        order: state.cards.filter(c => c.listId === targetList!.id).length,
      };

      const updatedCards = state.cards.map(c => (c.id === card.id ? updatedCard : c));
      const activity = createActivityRecord(
        currentUser,
        board.id,
        'move_card',
        `${currentUser.name} moved card #${card.id} "${card.title}" to ${targetList.title}`,
        card.id,
        fromList?.title,
        targetList.title
      );

      return {
        success: true,
        message: `Card #${card.id} "${card.title}" moved to ${targetList.title}.`,
        actionTaken: 'move_card',
        data: updatedCard,
        newState: {
          cards: updatedCards,
          activityLogs: [activity, ...state.activityLogs],
        },
      };
    }

    case 'add_card': {
      const { title, board_name, list_title, description, due_date, label, assignee_name } = args;

      if (!title) {
        return { success: false, message: 'Card title is required.' };
      }

      // Find board
      let targetBoard = visibleBoards[0];
      if (board_name) {
        const found = visibleBoards.find(b => b.name.toLowerCase().includes(String(board_name).toLowerCase()));
        if (!found) {
          return { success: false, message: `Board '${board_name}' was not found or is not accessible to you.` };
        }
        targetBoard = found;
      }

      if (!targetBoard) {
        return { success: false, message: 'No accessible board found.' };
      }

      if (!canUserCreateCard(currentUser, targetBoard)) {
        return {
          success: false,
          message: `Permission denied: As a ${currentUser.role}, you cannot create cards on board '${targetBoard.name}'.`,
        };
      }

      // Find target list
      const boardLists = state.lists.filter(l => l.boardId === targetBoard.id);
      let targetList = boardLists[0];
      if (list_title) {
        const foundList = boardLists.find(l => l.title.toLowerCase().includes(String(list_title).toLowerCase()));
        if (foundList) targetList = foundList;
      }

      if (!targetList) {
        return { success: false, message: `No list found on board '${targetBoard.name}'.` };
      }

      // Find assignee
      let assigneeId = currentUser.id;
      if (assignee_name) {
        const foundUser = state.users.find(u => u.name.toLowerCase().includes(String(assignee_name).toLowerCase()));
        if (foundUser) assigneeId = foundUser.id;
      }

      // Generate next integer ID
      const maxId = state.cards.reduce((max, c) => Math.max(max, c.id), 0);
      const newId = maxId + 1;

      const newCard: Card = {
        id: newId,
        boardId: targetBoard.id,
        listId: targetList.id,
        title: String(title),
        description: description ? String(description) : '',
        assigneeId,
        dueDate: due_date || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        labels: label ? [label] : ['Ops'],
        order: state.cards.filter(c => c.listId === targetList.id).length,
        checklist: [],
      };

      const activity = createActivityRecord(
        currentUser,
        targetBoard.id,
        'create_card',
        `${currentUser.name} created card #${newId} "${newCard.title}" in ${targetList.title}`,
        newId
      );

      return {
        success: true,
        message: `Card #${newId} "${newCard.title}" has been added to the ${targetList.title} list on the ${targetBoard.name} board.`,
        actionTaken: 'add_card',
        data: newCard,
        newState: {
          cards: [...state.cards, newCard],
          activityLogs: [activity, ...state.activityLogs],
        },
      };
    }

    case 'turn_card_into_checklist': {
      const { card_id } = args;
      const card = state.cards.find(c => c.id === Number(card_id));
      if (!card) return { success: false, message: `Card #${card_id} not found.` };

      const board = state.boards.find(b => b.id === card.boardId);
      if (!board || !canUserEditBoard(currentUser, board)) {
        return { success: false, message: 'Permission denied to edit this card.' };
      }

      const generatedChecklist = [
        { id: `chk_${Date.now()}_1`, text: 'Review scope and project requirements', completed: false },
        { id: `chk_${Date.now()}_2`, text: 'Draft implementation plan and architecture', completed: false },
        { id: `chk_${Date.now()}_3`, text: 'Execute core deliverables & tests', completed: false },
        { id: `chk_${Date.now()}_4`, text: 'Peer review and QA sign-off', completed: false },
      ];

      const updatedCard = {
        ...card,
        checklist: [...(card.checklist || []), ...generatedChecklist],
      };

      const activity = createActivityRecord(
        currentUser,
        board.id,
        'add_checklist_item',
        `${currentUser.name} generated an AI checklist with ${generatedChecklist.length} subtasks for card #${card.id}`,
        card.id
      );

      return {
        success: true,
        message: `Generated ${generatedChecklist.length} checklist items for Card #${card.id} "${card.title}".`,
        actionTaken: 'turn_card_into_checklist',
        data: updatedCard,
        newState: {
          cards: state.cards.map(c => (c.id === card.id ? updatedCard : c)),
          activityLogs: [activity, ...state.activityLogs],
        },
      };
    }

    case 'get_board_summary': {
      const { board_name } = args;
      const targetBoard = board_name 
        ? visibleBoards.find(b => b.name.toLowerCase().includes(String(board_name).toLowerCase())) 
        : visibleBoards[0];

      if (!targetBoard) return { success: false, message: 'Board not found.' };

      const boardCards = visibleCards.filter(c => c.boardId === targetBoard.id);
      const boardLists = state.lists.filter(l => l.boardId === targetBoard.id);
      const listCounts = boardLists.map(l => `${l.title}: ${boardCards.filter(c => c.listId === l.id).length}`);

      return {
        success: true,
        message: `Daily Summary for ${targetBoard.name}: Total ${boardCards.length} cards (${listCounts.join(', ')}).`,
        actionTaken: 'get_board_summary',
        data: {
          board: targetBoard.name,
          totalCards: boardCards.length,
          breakdown: listCounts,
        },
      };
    }

    default:
      return {
        success: false,
        message: `Unknown tool: ${toolName}. Available actions: list_my_cards, add_card, move_card, list_overdue, turn_card_into_checklist, get_board_summary.`,
      };
  }
}
