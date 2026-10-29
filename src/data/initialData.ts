import { User, Board, BoardList, Card, ActivityLog } from '../domain/types';

export const initialUsers: User[] = [
  {
    id: 'usr_alex',
    name: 'Alex Johnson',
    email: 'alex@acmeworkspace.io',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'owner',
    initials: 'AJ',
  },
  {
    id: 'usr_sarah',
    name: 'Sarah Chen',
    email: 'sarah@acmeworkspace.io',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    initials: 'SC',
  },
  {
    id: 'usr_mike',
    name: 'Mike Davis',
    email: 'mike@acmeworkspace.io',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    initials: 'MD',
  },
  {
    id: 'usr_lisa',
    name: 'Lisa Ray',
    email: 'lisa@acmeworkspace.io',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    initials: 'LR',
  },
  {
    id: 'usr_tom',
    name: 'Tom Wilson',
    email: 'tom@acmeworkspace.io',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'viewer',
    initials: 'TW',
  },
];

export const initialBoards: Board[] = [
  {
    id: 'b_product',
    name: 'Product Launch',
    description: 'Quarterly milestone launch for TaskFlow v2 core engine and AI capabilities.',
    color: '#3b82f6', // blue
    memberIds: ['usr_alex', 'usr_sarah', 'usr_mike', 'usr_lisa', 'usr_tom'],
  },
  {
    id: 'b_marketing',
    name: 'Marketing',
    description: 'Content calendar, brand collateral, and acquisition campaigns.',
    color: '#06b6d4', // cyan
    memberIds: ['usr_alex', 'usr_sarah', 'usr_lisa'],
  },
  {
    id: 'b_ops',
    name: 'Ops',
    description: 'Cloud infrastructure, CI/CD, billing, and system reliability.',
    color: '#10b981', // emerald
    memberIds: ['usr_alex', 'usr_mike'],
  },
  {
    id: 'b_design',
    name: 'Design',
    description: 'Design system tokens, user experience studies, and marketing mockups.',
    color: '#8b5cf6', // violet
    memberIds: ['usr_alex', 'usr_sarah'],
  },
];

export const initialLists: BoardList[] = [
  // Product Launch lists
  { id: 'l_todo', boardId: 'b_product', title: 'To Do', order: 0 },
  { id: 'l_doing', boardId: 'b_product', title: 'Doing', order: 1 },
  { id: 'l_review', boardId: 'b_product', title: 'Review', order: 2 },
  { id: 'l_done', boardId: 'b_product', title: 'Done', order: 3 },

  // Marketing lists
  { id: 'l_mkt_ideas', boardId: 'b_marketing', title: 'Ideas', order: 0 },
  { id: 'l_mkt_draft', boardId: 'b_marketing', title: 'Drafting', order: 1 },
  { id: 'l_mkt_live', boardId: 'b_marketing', title: 'Published', order: 2 },

  // Ops lists
  { id: 'l_ops_backlog', boardId: 'b_ops', title: 'Backlog', order: 0 },
  { id: 'l_ops_doing', boardId: 'b_ops', title: 'Doing', order: 1 },
  { id: 'l_ops_done', boardId: 'b_ops', title: 'Done', order: 2 },

  // Design lists
  { id: 'l_des_req', boardId: 'b_design', title: 'Requests', order: 0 },
  { id: 'l_des_prog', boardId: 'b_design', title: 'In Progress', order: 1 },
  { id: 'l_des_rev', boardId: 'b_design', title: 'Review', order: 2 },
];

export const initialCards: Card[] = [
  // To Do
  {
    id: 1,
    boardId: 'b_product',
    listId: 'l_todo',
    title: 'Design landing page',
    description: 'Create a modern, responsive landing page for the product launch. Include key features, pricing and a clear CTA.',
    assigneeId: 'usr_sarah',
    dueDate: '2026-11-05',
    labels: ['Design'],
    order: 0,
    checklist: [
      { id: 'chk_1_1', text: 'Wireframe hero and pricing cards', completed: true },
      { id: 'chk_1_2', text: 'Mobile responsive reflow check', completed: false },
      { id: 'chk_1_3', text: 'Export SVG icon pack', completed: false },
    ],
  },
  {
    id: 2,
    boardId: 'b_product',
    listId: 'l_todo',
    title: 'Write product docs',
    description: 'Draft API reference guide, quickstart tutorials, and SDK integration documentation.',
    assigneeId: 'usr_alex',
    dueDate: '2026-10-25', // Overdue for demo
    labels: ['Content'],
    order: 1,
  },
  {
    id: 3,
    boardId: 'b_product',
    listId: 'l_todo',
    title: 'Set up analytics',
    description: 'Integrate event tracking for card creations, moves, and MCP tool invocations.',
    assigneeId: 'usr_mike',
    dueDate: '2026-11-06',
    labels: ['DevOps'],
    order: 2,
  },
  {
    id: 4,
    boardId: 'b_product',
    listId: 'l_todo',
    title: 'Competitor research',
    description: 'Benchmark feature sets against traditional board tools and compile speed comparisons.',
    assigneeId: 'usr_lisa',
    dueDate: '2026-10-27', // Overdue for demo
    labels: ['Research'],
    order: 3,
  },
  {
    id: 5,
    boardId: 'b_product',
    listId: 'l_todo',
    title: 'Plan launch event',
    description: 'Coordinate webinar dates, keynote speaker invitations, and product demo flow.',
    assigneeId: 'usr_sarah',
    dueDate: '2026-11-12',
    labels: ['Marketing'],
    order: 4,
  },

  // Doing
  {
    id: 11,
    boardId: 'b_product',
    listId: 'l_doing',
    title: 'Build authentication flow',
    description: 'Implement Dodil appid session validation and role assignment synchronization.',
    assigneeId: 'usr_mike',
    dueDate: '2026-11-04',
    labels: ['Development'],
    order: 0,
    checklist: [
      { id: 'chk_11_1', text: 'Verify appid JWT headers', completed: true },
      { id: 'chk_11_2', text: 'Map user pool claims to workspace role', completed: true },
    ],
  },
  {
    id: 12,
    boardId: 'b_product',
    listId: 'l_doing',
    title: 'API integration',
    description: 'Expose fast JSON-RPC endpoint for MCP tools and link directly to application use-cases.',
    assigneeId: 'usr_alex',
    dueDate: '2026-11-06',
    labels: ['Development'],
    order: 1,
    blockedBy: [11], // blocked by auth flow
  },
  {
    id: 13,
    boardId: 'b_product',
    listId: 'l_doing',
    title: 'Create user onboarding',
    description: 'Interactive checklist modal that teaches new members how to organize cards and invoke AI actions.',
    assigneeId: 'usr_sarah',
    dueDate: '2026-11-09',
    labels: ['Design'],
    order: 2,
  },

  // Review
  {
    id: 21,
    boardId: 'b_product',
    listId: 'l_review',
    title: 'UI/UX polish',
    description: 'Inspect typography hierarchy, focus states, and board drag-and-drop animations.',
    assigneeId: 'usr_alex',
    dueDate: '2026-11-05',
    labels: ['Design'],
    order: 0,
  },
  {
    id: 22,
    boardId: 'b_product',
    listId: 'l_review',
    title: 'Performance testing',
    description: 'Stress test DataK3 query latency under simultaneous card reordering and MCP calls.',
    assigneeId: 'usr_lisa',
    dueDate: '2026-11-07',
    labels: ['QA'],
    order: 1,
  },

  // Done
  {
    id: 31,
    boardId: 'b_product',
    listId: 'l_done',
    title: 'Project setup',
    description: 'Initialize repository structure, TypeScript bundler, and domain model declarations.',
    assigneeId: 'usr_alex',
    dueDate: '2026-11-01',
    labels: ['Ops'],
    order: 0,
  },
  {
    id: 32,
    boardId: 'b_product',
    listId: 'l_done',
    title: 'Database schema',
    description: 'Draft DataK3 tables for workspaces, boards, lists, cards, and activity logs with primary keys.',
    assigneeId: 'usr_mike',
    dueDate: '2026-11-02',
    labels: ['Development'],
    order: 1,
  },
  {
    id: 33,
    boardId: 'b_product',
    listId: 'l_done',
    title: 'Brand assets',
    description: 'Produce high resolution geometric TaskFlow logo, icons, and theme gradients.',
    assigneeId: 'usr_sarah',
    dueDate: '2026-11-03',
    labels: ['Marketing'],
    order: 2,
  },
  {
    id: 34,
    boardId: 'b_product',
    listId: 'l_done',
    title: 'Initial wireframes',
    description: 'Architect multi-column kanban board layout, AI assistant panel, and bottom feature cards.',
    assigneeId: 'usr_alex',
    dueDate: '2026-11-04',
    labels: ['Design'],
    order: 3,
  },

  // Ops board cards
  {
    id: 41,
    boardId: 'b_ops',
    listId: 'l_ops_doing',
    title: 'Send invoice #8493',
    description: 'Monthly cloud hosting invoice for Acme Corp.',
    assigneeId: 'usr_alex',
    dueDate: '2026-11-10',
    labels: ['Ops'],
    order: 0,
  },
];

export const initialActivityLogs: ActivityLog[] = [
  {
    id: 'act_1',
    cardId: 31,
    boardId: 'b_product',
    userId: 'usr_alex',
    action: 'move_card',
    details: 'Alex Johnson moved card to Done',
    timestamp: '2026-11-03T10:24:00Z',
    fromList: 'Review',
    toList: 'Done',
  },
  {
    id: 'act_2',
    cardId: 1,
    boardId: 'b_product',
    userId: 'usr_sarah',
    action: 'update_due_date',
    details: 'Sarah Chen updated due date to Nov 5, 2026',
    timestamp: '2026-11-03T09:15:00Z',
  },
  {
    id: 'act_3',
    cardId: 5,
    boardId: 'b_product',
    userId: 'usr_mike',
    action: 'change_label',
    details: 'Mike Davis changed label to Marketing',
    timestamp: '2026-11-02T14:43:00Z',
  },
  {
    id: 'act_4',
    cardId: 13,
    boardId: 'b_product',
    userId: 'usr_lisa',
    action: 'assign_card',
    details: 'Lisa Ray assigned to Sarah Chen',
    timestamp: '2026-11-01T11:12:00Z',
  },
  {
    id: 'act_5',
    cardId: 34,
    boardId: 'b_product',
    userId: 'usr_tom',
    action: 'create_card',
    details: 'Tom Wilson created the card Initial wireframes',
    timestamp: '2026-11-01T09:07:00Z',
  },
];
