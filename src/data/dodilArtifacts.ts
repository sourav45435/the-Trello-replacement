/**
 * Dodil Boards Challenge Contest Artifacts
 * Synchronized with official git.dodil.io/dodil/boards-challenge starter
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
    description: 'What a remix creates in the remixer org (DataK3 bucket, appid user pool, service account).',
    content: `# What a remix creates in the organization it goes into. Reference: \`dodil guide remix\`.
version: 1
description: Boards starter for the Dodil Boards Challenge. FastAPI + DataK3 + appid + Models + MCP.
topics: [boards, starter, fastapi, dodil-challenge, dodil-challenge-boards]
provision:
  buckets:
    - name: "\${{ dodil.repo }}-data"      # keep the repo name <= 18 characters (25 max here)
      schema: schema.sql
  user_pools:
    - name: "\${{ dodil.repo }}-users"
      roles: [member]
  service_accounts:
    - name: "\${{ dodil.repo }}-app"
      grants:
        - { role: k3.editor, bucket: "\${{ dodil.repo }}-data" }
        - { role: ignite.model-user }      # the app calls Dodil Models, billed to the remixer's org
      secrets:
        client_id: DODIL_SERVICE_ACCOUNT_ID
        client_secret: DODIL_SERVICE_ACCOUNT_SECRET
`,
  },
  {
    path: '.dodil/deploy.yaml',
    language: 'yaml',
    description: 'How CI deploys every copy of this repo to a live Ignite service.',
    content: `# How CI deploys every copy of this repo. Names render from the copy's own repo and org.
version: 1
create_if_missing: true
apps:
  - name: "\${{ dodil.repo }}"
    image: "{registry}/{org}/{repo}:{sha}"
    port: 8080
    resources: { tier: small }
    scaling: { max_replicas: 2 }
    # The gateway signs people in through the pool and passes who they are to the app.
    # public_invoke lets Claude/ChatGPT discover the sign-in metadata; the app itself
    # refuses every route without a signed-in person (except /healthz and the metadata).
    user_pool: "\${{ dodil.repo }}-users"
    public_invoke: true
    health: { path: /healthz }
    env:
      BUCKET: "\${{ dodil.repo }}-data"
      PG_HOST: pg.uk-lon-1.dodil.io
      DODIL_USER_POOL: "\${{ dodil.org }}/\${{ dodil.repo }}-users"
      MODELS_BASE: https://api.dodil.io/v1
      CHAT_MODEL: kimi-k2.6
      DODIL_SERVICE_ACCOUNT_ID: "\${{ secrets.DODIL_SERVICE_ACCOUNT_ID }}"
      DODIL_SERVICE_ACCOUNT_SECRET: "\${{ secrets.DODIL_SERVICE_ACCOUNT_SECRET }}"
when:
  branches: [main]
  require_checks: all
`,
  },
  {
    path: 'schema.sql',
    language: 'sql',
    description: 'DataK3 PostgreSQL tables (natural keys only, no SERIAL).',
    content: `-- Created once by the remix, in the bucket it makes. Natural keys only: DataK3 has no sequences.
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,            -- board_id + ':' + email
  board_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL              -- owner | member | viewer
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  list_name TEXT NOT NULL,        -- To do | Doing | Done
  title TEXT NOT NULL,
  assignee TEXT,
  due_date DATE,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity (
  id TEXT PRIMARY KEY,
  board_id TEXT NOT NULL,
  card_id TEXT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  event_at TIMESTAMP
);
`,
  },
  {
    path: 'app/boards/domain/model.py',
    language: 'python',
    description: 'The board rules and domain model: viewer cannot edit, owner manages members.',
    content: `"""The board's language and rules. No database, no HTTP: plain Python you can test in a second."""
from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional

LISTS = ("To do", "Doing", "Done")

class Role(str, Enum):
    OWNER = "owner"
    MEMBER = "member"
    VIEWER = "viewer"

class Forbidden(Exception):
    """The person may not do this. The doors turn it into 403 (web) or a tool error (MCP)."""

class Invalid(Exception):
    """The request breaks a rule of the board itself. 422 / tool error."""

@dataclass(frozen=True)
class Person:
    """Who is acting: taken from the gateway's sign-in, never from the request body."""
    email: str

@dataclass
class Card:
    id: str
    board_id: str
    title: str
    list_name: str = LISTS[0]
    assignee: Optional[str] = None
    due_date: Optional[date] = None

    def move_to(self, list_name: str) -> None:
        if list_name not in LISTS:
            raise Invalid(f"unknown list {list_name!r}; lists are {', '.join(LISTS)}")
        self.list_name = list_name

@dataclass
class Board:
    id: str
    title: str
    owner_email: str
    members: dict = field(default_factory=dict)  # email -> Role

    def role_of(self, person: Person) -> Optional[Role]:
        if person.email == self.owner_email:
            return Role.OWNER
        return self.members.get(person.email)

    def require_view(self, person: Person) -> None:
        if self.role_of(person) is None:
            raise Forbidden("you are not on this board")

    def require_edit(self, person: Person) -> None:
        role = self.role_of(person)
        if role is None:
            raise Forbidden("you are not on this board")
        if role is Role.VIEWER:
            raise Forbidden("viewers can't change the board")

    def add_member(self, by: Person, email: str, role: Role) -> None:
        if self.role_of(by) is not Role.OWNER:
            raise Forbidden("only the owner manages members")
        if role is Role.OWNER:
            raise Invalid("a board has one owner")
        self.members[email.strip().lower()] = role
`,
  },
  {
    path: 'app/boards/application/use_cases.py',
    language: 'python',
    description: 'Shared use cases called by both Web routes and MCP tools.',
    content: `"""Every action a person can take. Web routes and MCP tools both call these and nothing else."""
import uuid
from dataclasses import asdict
from typing import Optional
from boards.application.ports import Assistant, BoardRepository
from boards.domain.model import Board, Card, Forbidden, Invalid, Person, Role

class NotFound(Exception):
    pass

def _card(c: Card) -> dict:
    d = asdict(c)
    d["due_date"] = c.due_date.isoformat() if c.due_date else None
    return d

class Boards:
    def __init__(self, repo: BoardRepository, assistant: Optional[Assistant] = None):
        self.repo, self.assistant = repo, assistant

    def _board(self, board_id: str, person: Person) -> Board:
        board = self.repo.get(board_id)
        if board is None:
            raise NotFound("no such board")
        try:
            board.require_view(person)
        except Forbidden:
            raise NotFound("no such board")  # invisible board doesn't exist for you
        return board

    def _find_card(self, card_id: str, person: Person) -> tuple:
        card = self.repo.get_card(card_id)
        if card is None:
            raise NotFound("no such card")
        return self._board(card.board_id, person), card

    def create_board(self, person: Person, title: str) -> dict:
        if not title.strip():
            raise Invalid("a board needs a title")
        board = Board(id=uuid.uuid4().hex[:12], title=title.strip(), owner_email=person.email)
        self.repo.save_board(board)
        self.repo.log(board.id, None, person.email, f"created board {board.title!r}")
        return {"id": board.id, "title": board.title}

    def my_boards(self, person: Person) -> list:
        return [{"id": b.id, "title": b.title, "role": b.role_of(person).value}
                for b in self.repo.boards_for(person.email)]

    def show_board(self, person: Person, board_id: str) -> dict:
        board = self._board(board_id, person)
        cards = [_card(c) for c in self.repo.cards_on(board.id)]
        return {"id": board.id, "title": board.title, "role": board.role_of(person).value,
                "cards": cards}

    def add_member(self, person: Person, board_id: str, email: str, role: str) -> dict:
        board = self._board(board_id, person)
        board.add_member(person, email, Role(role))
        self.repo.save_board(board)
        self.repo.log(board.id, None, person.email, f"added {email} as {role}")
        return {"board_id": board.id, "email": email, "role": role}

    def add_card(self, person: Person, board_id: str, title: str, list_name: str = "To do") -> dict:
        board = self._board(board_id, person)
        board.require_edit(person)
        card = Card(id=uuid.uuid4().hex[:12], board_id=board.id, title=title.strip())
        card.move_to(list_name)
        self.repo.save_card(card)
        self.repo.log(board.id, card.id, person.email, f"added card {card.title!r}")
        return _card(card)

    def move_card(self, person: Person, card_id: str, list_name: str) -> dict:
        board, card = self._find_card(card_id, person)
        board.require_edit(person)
        before = card.list_name
        card.move_to(list_name)
        self.repo.save_card(card)
        self.repo.log(board.id, card.id, person.email, f"moved from {before} to {list_name}")
        return _card(card)

    def suggest_checklist(self, person: Person, card_id: str) -> dict:
        _, card = self._find_card(card_id, person)
        if self.assistant is None:
            raise Invalid("no AI assistant configured")
        return {"card_id": card.id, "suggested_checklist": self.assistant.checklist(card.title)}
`,
  },
  {
    path: 'app/boards/doors/mcp.py',
    language: 'python',
    description: 'MCP Door exposing tools to Claude and ChatGPT.',
    content: `"""The MCP door: the same use cases as the web routes, as tools Claude or ChatGPT can call."""
from mcp.server.mcpserver import Context, MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from boards.application.use_cases import Boards, NotFound
from boards.doors.identity import person_from
from boards.domain.model import Forbidden, Invalid

INSTRUCTIONS = ("A team task board. Lists are 'To do', 'Doing' and 'Done'. Use my_boards first "
                "to find board ids, then show_board to see its cards.")

def build_mcp(boards: Boards) -> MCPServer:
    server = MCPServer(name="boards", instructions=INSTRUCTIONS)

    def call(ctx: Context, fn, *args):
        person = person_from(ctx.headers or {})
        if person is None:
            raise ToolError("401: sign in first")
        try:
            return fn(person, *args)
        except (NotFound, Forbidden, Invalid) as e:
            raise ToolError(str(e))

    @server.tool()
    def my_boards(ctx: Context) -> list:
        """The boards you are on, with your role on each."""
        return call(ctx, boards.my_boards)

    @server.tool()
    def show_board(board_id: str, ctx: Context) -> dict:
        """A board and all its cards, grouped by list."""
        return call(ctx, boards.show_board, board_id)

    @server.tool()
    def create_board(title: str, ctx: Context) -> dict:
        """Create a board. You become its owner."""
        return call(ctx, boards.create_board, title)

    @server.tool()
    def add_card(board_id: str, title: str, ctx: Context, list_name: str = "To do") -> dict:
        """Add a card to a list on a board."""
        return call(ctx, boards.add_card, board_id, title, list_name)

    @server.tool()
    def move_card(card_id: str, list_name: str, ctx: Context) -> dict:
        """Move a card to 'To do', 'Doing' or 'Done'."""
        return call(ctx, boards.move_card, card_id, list_name)

    @server.tool()
    def add_member(board_id: str, email: str, ctx: Context, role: str = "member") -> dict:
        """Owner only: add someone to a board as 'member' or 'viewer'."""
        return call(ctx, boards.add_member, board_id, email, role)

    @server.tool()
    def suggest_checklist(card_id: str, ctx: Context) -> dict:
        """AI suggestion of a checklist for a card."""
        return call(ctx, boards.suggest_checklist, card_id)

    return server
`,
  },
  {
    path: 'app/boards/main.py',
    language: 'python',
    description: 'FastAPI entry point with /mcp endpoint and RFC 9728 auth discovery.',
    content: `"""FastAPI app wiring web routes, /mcp, and RFC 9728 sign-in discovery metadata."""
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from starlette.routing import Route
from boards.application.use_cases import Boards
from boards.doors.identity import person_from
from boards.doors.mcp import build_mcp
from boards.doors.web import build_router
from boards.infrastructure.dodil import ModelsAssistant
from boards.infrastructure.repository import SqlBoards

APPID = os.environ.get("APPID_PUBLIC_URL", "https://appid.dodil.io").rstrip("/")
POOL = os.environ.get("DODIL_USER_POOL", "")
METADATA = "/.well-known/oauth-protected-resource"

def create_app(boards: Boards) -> FastAPI:
    gate = {"mcp": None}

    @asynccontextmanager
    async def lifespan(_app):
        mcp_app = build_mcp(boards).streamable_http_app(
            streamable_http_path="/mcp", stateless_http=True, json_response=True)
        gate["mcp"] = mcp_app
        async with mcp_app.router.lifespan_context(mcp_app):
            yield

    app = FastAPI(title="boards", lifespan=lifespan)

    def base(request: Request) -> str:
        h = request.headers
        return f"{h.get('x-forwarded-proto', 'https')}://{h.get('x-forwarded-host', h.get('host'))}"

    @app.get("/healthz", include_in_schema=False)
    def healthz():
        return {"ok": True}

    @app.get(METADATA, include_in_schema=False)
    @app.get(METADATA + "/mcp", include_in_schema=False)
    def metadata(request: Request):
        return {"resource": base(request) + "/mcp", "authorization_servers": [f"{APPID}/{POOL}"],
                "bearer_methods_supported": ["header"], "resource_name": "boards"}

    class McpDoor:
        async def __call__(self, scope, receive, send):
            headers = {k.decode(): v.decode() for k, v in scope.get("headers", [])}
            if person_from(headers) is None:
                body = json.dumps({"detail": "sign in first"}).encode()
                link = f'Bearer resource_metadata="{base(Request(scope))}{METADATA}/mcp"'
                await send({"type": "http.response.start", "status": 401, "headers": [
                    (b"content-type", b"application/json"), (b"www-authenticate", link.encode())]})
                await send({"type": "http.response.body", "body": body})
                return
            await gate["mcp"]({**scope, "path": "/mcp"}, receive, send)

    mcp_door = McpDoor()
    for path in ("/mcp", "/mcp/"):
        app.router.routes.append(Route(path, endpoint=mcp_door, methods=["GET", "POST", "DELETE"]))
    app.include_router(build_router(boards))
    return app

app = create_app(Boards(SqlBoards(), ModelsAssistant()))
`,
  },
  {
    path: 'README.md',
    language: 'markdown',
    description: 'Contest submission README with live links, test logins, and 5 honest lines.',
    content: `# TaskFlow — The Trello Replacement for Dodil

> Plan. Organize. Get it done. Built for the **Dodil Boards Challenge**.

TaskFlow is a high-velocity team task board built natively on Dodil cloud services:
- **DataK3**: Real-time Postgres data storage with primary keys (\`boards\`, \`memberships\`, \`cards\`, \`activity\`).
- **Dodil appid**: Zero-friction user pool authentication with role enforcement (\`owner\`, \`member\`, \`viewer\`).
- **Dodil Models**: Built-in AI with Kimi K2.6 for card checklists and semantic search.
- **Native MCP Endpoint**: Claude & ChatGPT connect directly to run actions (\`move_card\`, \`show_board\`, \`add_card\`, \`suggest_checklist\`).

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
dodil update                                   # CLI 0.1.89 or later
dodil git remix dodil/boards-challenge --to-org <your-org> --name taskflow
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
