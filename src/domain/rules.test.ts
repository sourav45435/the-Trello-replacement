import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canUserManageMembers,
  canUserEditBoard,
  canUserMoveCard,
  canUserCreateCard,
  isCardOverdue,
  executeMCPTool,
  MCPAppState,
} from './rules';
import { User, Board, Card, BoardList } from './types';

const ownerUser: User = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex@acme.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
  role: 'owner',
};

const memberUser: User = {
  id: 'u2',
  name: 'Sarah Chen',
  email: 'sarah@acme.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
  role: 'member',
};

const viewerUser: User = {
  id: 'u3',
  name: 'Tom Wilson',
  email: 'tom@acme.com',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
  role: 'viewer',
};

const sampleBoard: Board = {
  id: 'board_product',
  name: 'Product Launch',
  color: '#3b82f6',
  memberIds: ['u1', 'u2', 'u3'],
};

const sampleLists: BoardList[] = [
  { id: 'l_todo', boardId: 'board_product', title: 'To Do', order: 0 },
  { id: 'l_doing', boardId: 'board_product', title: 'Doing', order: 1 },
  { id: 'l_review', boardId: 'board_product', title: 'Review', order: 2 },
  { id: 'l_done', boardId: 'board_product', title: 'Done', order: 3 },
];

const sampleCards: Card[] = [
  {
    id: 12,
    boardId: 'board_product',
    listId: 'l_doing',
    title: 'API integration',
    description: 'Connect to external endpoints',
    assigneeId: 'u2',
    dueDate: '2027-11-06',
    labels: ['Development'],
    order: 0,
  },
  {
    id: 15,
    boardId: 'board_product',
    listId: 'l_todo',
    title: 'Write product docs',
    description: 'Finish release notes',
    assigneeId: 'u1',
    dueDate: '2024-01-01', // definitely overdue
    labels: ['Content'],
    order: 0,
  },
];

const initialState: MCPAppState = {
  boards: [sampleBoard],
  lists: sampleLists,
  cards: sampleCards,
  users: [ownerUser, memberUser, viewerUser],
  activityLogs: [],
};

test('role permissions: owner has full administrative power', () => {
  assert.equal(canUserManageMembers(ownerUser), true);
  assert.equal(canUserEditBoard(ownerUser, sampleBoard), true);
  assert.equal(canUserMoveCard(ownerUser, sampleBoard), true);
});

test('role permissions: member can edit and move cards but cannot manage members', () => {
  assert.equal(canUserManageMembers(memberUser), false);
  assert.equal(canUserEditBoard(memberUser, sampleBoard), true);
  assert.equal(canUserMoveCard(memberUser, sampleBoard), true);
  assert.equal(canUserCreateCard(memberUser, sampleBoard), true);
});

test('role permissions: viewer is read-only', () => {
  assert.equal(canUserManageMembers(viewerUser), false);
  assert.equal(canUserEditBoard(viewerUser, sampleBoard), false);
  assert.equal(canUserMoveCard(viewerUser, sampleBoard), false);
  assert.equal(canUserCreateCard(viewerUser, sampleBoard), false);
});

test('overdue rule correctly detects past due dates', () => {
  const futureCard: Card = {
    ...sampleCards[0],
    dueDate: '2099-01-01',
  };
  const pastCard: Card = {
    ...sampleCards[1],
    dueDate: '2020-01-01',
  };

  assert.equal(isCardOverdue(futureCard), false);
  assert.equal(isCardOverdue(pastCard), true);
});

test('mcp tool: list_my_cards returns only current user tasks', () => {
  const result = executeMCPTool('list_my_cards', {}, memberUser, initialState);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, 12);
});

test('mcp tool: viewer cannot move cards (permission check)', () => {
  const result = executeMCPTool(
    'move_card',
    { card_id: 12, target_list_title: 'Done' },
    viewerUser,
    initialState
  );
  assert.equal(result.success, false);
  assert.match(result.message, /permission denied/i);
});

test('mcp tool: member can move card 12 to Done and activity is logged', () => {
  const result = executeMCPTool(
    'move_card',
    { card_id: 12, target_list_title: 'Done' },
    memberUser,
    initialState
  );
  assert.equal(result.success, true);
  assert.equal(result.data.listId, 'l_done');
  assert.equal(result.newState?.activityLogs?.length, 1);
  assert.match(result.newState!.activityLogs![0].details, /moved card #12/i);
});

test('mcp tool: add_card adds card and increments id', () => {
  const result = executeMCPTool(
    'add_card',
    {
      title: 'Send invoice',
      board_name: 'Product Launch',
      list_title: 'Doing',
      description: 'Invoice #8493',
    },
    ownerUser,
    initialState
  );
  assert.equal(result.success, true);
  assert.equal(result.data.id, 16);
  assert.equal(result.data.title, 'Send invoice');
});

test('mcp tool: list_overdue finds cards past due date', () => {
  const result = executeMCPTool('list_overdue', {}, ownerUser, initialState);
  assert.equal(result.success, true);
  assert.ok(result.data.length >= 1);
  assert.equal(result.data[0].id, 15);
});
