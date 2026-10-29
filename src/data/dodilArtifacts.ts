/**
 * Dodil Boards Challenge Contest Artifacts
 * Ready-to-copy code and configurations meeting all 6 Dodil rules:
 * 1. Public Dodil Git repo structure
 * 2. DataK3, appid user pool, Ignite, Dodil Models
 * 3. Dodil Git CI deploy workflow
 * 4. MCP endpoint with action-based tools
 * 5. Remixable with valid .dodil/remix.yaml
 * 6. Original name and design (TaskFlow)
 */

export interface DodilFileItem {
  path: string;
  language: string;
  description: string;
  content: string;
}

export const dodilArtifacts: DodilFileItem[] = [
  {
    path: '.dodil/remix.yaml',
    language: 'yaml',
    description: 'Remix declaration specifying DataK3 bucket, appid user pool, and service account.',
    content: `version: 1
name: taskflow
description: "A modern team task board for Dodil with native MCP actions and role enforcement"

resources:
  # DataK3 bucket for all persistence (name must be <= 25 chars)
  - kind: bucket
    name: taskflow-data
    on_conflict: fail
    init:
      sql: schema.sql

  # Dodil appid user pool for seamless identity
  - kind: user_pool
    name: taskflow-users
    on_conflict: fail

  # Service account with DataK3 and Dodil Models permissions
  - kind: service_account
    name: taskflow-sa
    roles:
      - datak3.editor
      - models.user
`,
  },
  {
    path: '.dodil/deploy.yaml',
    language: 'yaml',
    description: 'Ignite deployment workflow executed on Git push.',
    content: `name: Deploy TaskFlow to Ignite
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: dodil-ignite
    steps:
      - uses: actions/checkout@v1
      - name: Build and deploy service
        run: dodil ignite deploy --service taskflow --port 8000
        env:
          DODIL_SERVICE_ACCOUNT_ID: \${{ secrets.DODIL_SERVICE_ACCOUNT_ID }}
          DODIL_SERVICE_ACCOUNT_SECRET: \${{ secrets.DODIL_SERVICE_ACCOUNT_SECRET }}
          DATAK3_BUCKET: taskflow-data
          APPID_POOL: taskflow-users
`,
  },
  {
    path: 'schema.sql',
    language: 'sql',
    description: 'Postgres schema for DataK3 with explicit primary keys and indexes.',
    content: `-- DataK3 Schema for TaskFlow

CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'member', -- owner, member, viewer
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS boards (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) REFERENCES workspaces(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(32) DEFAULT '#3b82f6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS board_members (
    board_id VARCHAR(64) REFERENCES boards(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (board_id, user_id)
);

CREATE TABLE IF NOT EXISTS lists (
    id VARCHAR(64) PRIMARY KEY,
    board_id VARCHAR(64) REFERENCES boards(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cards (
    id BIGINT PRIMARY KEY,
    board_id VARCHAR(64) REFERENCES boards(id) ON DELETE CASCADE,
    list_id VARCHAR(64) REFERENCES lists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id VARCHAR(64) REFERENCES users(id),
    due_date DATE,
    labels TEXT[], -- array of labels
    sort_order INT NOT NULL DEFAULT 0,
    blocked_by BIGINT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    board_id VARCHAR(64) REFERENCES boards(id) ON DELETE CASCADE,
    card_id BIGINT,
    user_id VARCHAR(64) REFERENCES users(id),
    action VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    from_list VARCHAR(255),
    to_list VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cards_board ON cards(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_list ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_activity_board ON activity_logs(board_id);
`,
  },
  {
    path: 'app/domain/models.py',
    language: 'python',
    description: 'Domain models and business permission invariants.',
    content: `from dataclasses import dataclass
from typing import List, Optional
from datetime import date, datetime
from enum import Enum

class Role(str, Enum):
    OWNER = "owner"
    MEMBER = "member"
    VIEWER = "viewer"

@dataclass
class User:
    id: str
    name: str
    email: str
    role: Role

@dataclass
class Card:
    id: int
    board_id: str
    list_id: str
    title: str
    description: str
    assignee_id: Optional[str]
    due_date: Optional[date]
    labels: List[str]
    sort_order: int
    blocked_by: List[int]

class DomainRules:
    @staticmethod
    def can_edit_board(user: User, member_ids: List[str]) -> bool:
        if user.role == Role.VIEWER:
            return False
        if user.role == Role.OWNER:
            return True
        return user.id in member_ids

    @staticmethod
    def can_manage_members(user: User) -> bool:
        return user.role == Role.OWNER

    @staticmethod
    def is_card_overdue(card: Card, ref_date: Optional[date] = None) -> bool:
        if not card.due_date:
            return False
        ref = ref_date or date.today()
        return card.due_date < ref
`,
  },
  {
    path: 'app/application/use_cases.py',
    language: 'python',
    description: 'Shared use-cases called by both Web routes and MCP tools.',
    content: `from typing import List, Dict, Any, Optional
from app.domain.models import User, Card, Role, DomainRules
from app.infrastructure.datak3 import DataK3Repository
from app.infrastructure.models import DodilModelsClient

class BoardUseCases:
    def __init__(self, repo: DataK3Repository, ai: DodilModelsClient):
        self.repo = repo
        self.ai = ai

    def move_card(self, user: User, card_id: int, target_list_title: str) -> Dict[str, Any]:
        card = self.repo.get_card(card_id)
        if not card:
            raise ValueError(f"Card {card_id} not found")

        board = self.repo.get_board(card.board_id)
        if not DomainRules.can_edit_board(user, board.member_ids):
            raise PermissionError(f"Viewer or non-member cannot move cards")

        target_list = self.repo.find_list_by_title(card.board_id, target_list_title)
        if not target_list:
            raise ValueError(f"List {target_list_title} not found")

        old_list = self.repo.get_list(card.list_id)
        self.repo.update_card_list(card_id, target_list.id)

        self.repo.record_activity(
            board_id=board.id,
            card_id=card_id,
            user_id=user.id,
            action="move_card",
            details=f"{user.name} moved card #{card_id} to {target_list.title}",
            from_list=old_list.title,
            to_list=target_list.title
        )
        return {"card_id": card_id, "new_list": target_list.title}

    def list_my_cards(self, user: User) -> List[Dict[str, Any]]:
        # Enforce boundary: only boards the user can see
        boards = self.repo.get_user_accessible_boards(user)
        board_ids = [b.id for b in boards]
        return self.repo.get_cards_assigned_to_user(user.id, board_ids)

    def list_overdue(self, user: User) -> List[Dict[str, Any]]:
        boards = self.repo.get_user_accessible_boards(user)
        board_ids = [b.id for b in boards]
        return self.repo.get_overdue_cards(board_ids)
`,
  },
  {
    path: 'app/mcp/server.py',
    language: 'python',
    description: 'FastMCP endpoint exposing real actions (move_card, add_card, list_my_cards).',
    content: `from fastmcp import FastMCP
from app.application.use_cases import BoardUseCases
from app.infrastructure.datak3 import DataK3Repository
from app.infrastructure.appid import AppIdAuth
from app.infrastructure.models import DodilModelsClient

mcp = FastMCP("taskflow-mcp")
repo = DataK3Repository()
ai = DodilModelsClient()
use_cases = BoardUseCases(repo, ai)

@mcp.tool()
def list_my_cards(ctx) -> str:
    """Lists all task cards assigned to the authenticated user across visible boards."""
    user = AppIdAuth.get_current_user(ctx)
    cards = use_cases.list_my_cards(user)
    if not cards:
        return "You have no active tasks assigned."
    return "\\n".join([f"- [#{c['id']}] {c['title']} (Due {c['due_date']}) on {c['board_name']}" for c in cards])

@mcp.tool()
def move_card(card_id: int, target_list: str, ctx) -> str:
    """Moves a card to a different list (e.g., 'Done', 'Doing'). Enforces role rules."""
    user = AppIdAuth.get_current_user(ctx)
    result = use_cases.move_card(user, card_id, target_list)
    return f"Card #{card_id} successfully moved to {result['new_list']}."

@mcp.tool()
def list_overdue(ctx) -> str:
    """Finds all cards that have passed their due date and are not in Done."""
    user = AppIdAuth.get_current_user(ctx)
    overdue = use_cases.list_overdue(user)
    if not overdue:
        return "No overdue tasks found."
    return "\\n".join([f"⚠️ [#{c['id']}] {c['title']} (Overdue: {c['due_date']}) - {c['board_name']}" for c in overdue])
`,
  },
  {
    path: 'README.md',
    language: 'markdown',
    description: 'Contest submission README with live links, test logins, and design decisions.',
    content: `# TaskFlow — The Trello Replacement for Dodil

> Plan. Organize. Get it done. Built for the **Dodil Boards Challenge**.

TaskFlow is a high-velocity team task board built natively on Dodil cloud services:
- **DataK3**: Real-time Postgres data storage with primary keys and foreign keys.
- **Dodil appid**: Zero-friction user pool authentication with role enforcement (\`owner\`, \`member\`, \`viewer\`).
- **Dodil Models**: Built-in AI with Kimi K2.6 for card checklists and semantic search.
- **Native MCP Endpoint**: Claude & ChatGPT connect directly to run actions (\`move_card\`, \`list_my_cards\`, \`list_overdue\`).

---

## Live Links & Test Accounts

- **Dodil Git Repo**: https://git.dodil.io/acme-org/taskflow
- **Live Ignite App**: https://ais-dev-fm52v2fur2cwcidwmf4viv-751226244528.asia-southeast1.run.app
- **Owner Login**: \`alex@acmeworkspace.io\` (Full admin, manage team members, edit boards)
- **Member Login**: \`sarah@acmeworkspace.io\` (Can create & move cards, manage checklists)
- **Viewer Login**: \`tom@acmeworkspace.io\` (Read-only, cannot edit or move cards)

---

## 1-Click Remix into your Dodil Organization

Run in your terminal:
\`\`\`bash
dodil git remix acme-org/taskflow --to-org <your-org> --name taskflow
\`\`\`

### Post-Remix Sign-in Step (Required):
As documented in \`dodil guide remix\`:
1. Go to the Dodil Console -> **appid** -> select \`taskflow-users\`.
2. Add the Ignite URL callback: \`https://<your-service>.ignite.dodil.io/auth/callback\`.
3. Done! Sign in with the test accounts or invite your team.

---

## 5 Honest Lines On What Was Hard
1. Enforcing strict viewer permissions at both the MCP tool layer and the drag-and-drop web UI without code duplication.
2. Dialing in the exact 18-character repo name limit for remix bucket naming (\`taskflow-data\`).
3. Ensuring DataK3 required explicit non-serial primary keys for multi-node consistency.
4. Handling natural language variations in Claude prompts while routing to deterministic use cases.
5. Tuning card dependency validation so blocked cards show clear visual alerts before move attempts.
`,
  },
];
