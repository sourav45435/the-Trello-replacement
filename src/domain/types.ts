/**
 * TaskFlow Domain Types
 * Clean Domain-Driven Design definitions for Boards, Lists, Cards, Roles, and MCP tools
 */

export type Role = 'owner' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  initials?: string;
}

export type CardLabel = 
  | 'Design'
  | 'Development'
  | 'Content'
  | 'DevOps'
  | 'QA'
  | 'Research'
  | 'Marketing'
  | 'Ops';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Card {
  id: number;
  boardId: string;
  listId: string;
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string; // ISO format: YYYY-MM-DD
  labels: CardLabel[];
  order: number;
  checklist?: ChecklistItem[];
  blockedBy?: number[]; // Card IDs that must be completed first
}

export interface BoardList {
  id: string;
  boardId: string;
  title: string;
  order: number;
  color?: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  memberIds: string[];
}

export type ActivityAction = 
  | 'create_card'
  | 'move_card'
  | 'update_due_date'
  | 'change_label'
  | 'assign_card'
  | 'update_description'
  | 'add_checklist_item'
  | 'invite_member'
  | 'change_role';

export interface ActivityLog {
  id: string;
  cardId?: number;
  boardId: string;
  userId: string;
  action: ActivityAction;
  details: string;
  timestamp: string; // ISO string
  fromList?: string;
  toList?: string;
}

export interface MCPToolResult {
  success: boolean;
  message: string;
  data?: any;
  actionTaken?: string;
}
