# TaskFlow — The Trello Replacement for Dodil

> **Plan. Organize. Get it done.** Built for the **Dodil Boards Challenge**.
> Contest submission repo: https://git.dodil.io/acme-org/taskflow
> Live Ignite preview: https://ais-dev-fm52v2fur2cwcidwmf4viv-751226244528.asia-southeast1.run.app

TaskFlow is a production-grade team task board built natively on Dodil cloud services:
- **DataK3**: Real-time Postgres data storage with natural primary keys (`boards`, `memberships`, `cards`, `activity`).
- **Dodil appid**: Zero-friction user pool authentication with role enforcement (`owner`, `member`, `viewer`).
- **Dodil Models**: Built-in AI with Kimi K2.6 for card checklists and semantic search.
- **Native MCP Endpoint**: Claude & ChatGPT connect directly to run actions (`my_boards`, `show_board`, `add_card`, `move_card`, `add_member`, `suggest_checklist`).

---

## 1-Click Remix into your Dodil Organization

Run in your terminal:
```bash
dodil update                                   # CLI 0.1.89 or later
dodil git remix dodil/boards-challenge --to-org <your-org> --name taskflow
```

The remix automatically creates in your organization:
1. The repository on Dodil Git (`git.dodil.io/<your-org>/taskflow`).
2. A DataK3 bucket `taskflow-data` with all tables from `schema.sql`.
3. An appid user pool `taskflow-users`.
4. A service account `taskflow-app` with access to DataK3 and Dodil Models.
5. Deploys via Dodil Git CI to a live Ignite URL.

### Required Post-Remix Sign-in Step:
As documented in `dodil guide remix` ("After the remix: let people sign in"):
1. Go to your Dodil Console -> **appid** -> select `taskflow-users`.
2. Add your Ignite application callback URL: `https://<your-service>.ignite.dodil.io/auth/callback`.
3. Sign in and start organizing tasks!

---

## Test Accounts & Roles

| Role | Test Email | Capabilities |
|---|---|---|
| **Owner** | `alex@acmeworkspace.io` | Full administrative power, create boards, invite members, change member roles, edit cards |
| **Member** | `sarah@acmeworkspace.io` | Create, edit, and move cards across boards. Cannot invite or modify members |
| **Viewer** | `tom@acmeworkspace.io` | Read-only. Cannot edit, drag, move cards, or manage members |

---

## What's Inside

```
app/
  Dockerfile                 container spec running uvicorn on port 8080 (non-root UID 10001)
  dist/                      compiled modern TaskFlow React + Tailwind UI
  boards/
    domain/model.py          Board, Card, Person, Role and business rules (viewer cannot edit, owner manages members)
    application/use_cases.py every action: create_board, add_card, move_card, add_member, show_board, suggest_checklist
    application/ports.py     repository and AI assistant contracts
    infrastructure/dodil.py  service-account token, DataK3 connection, Dodil Models client
    infrastructure/repository.py DataK3 tables persistence
    doors/web.py             FastAPI JSON routes + TaskFlow SPA mounting
    doors/mcp.py             MCP tools for Claude/ChatGPT -> call the exact same use cases
    doors/identity.py        extracts Person from X-Dodil-User gateway header
    main.py                  wires web, /mcp, and RFC 9728 sign-in discovery metadata
tests/test_boards.py         unit tests validating rules through use cases and both doors
schema.sql                   DataK3 tables (boards, memberships, cards, activity)
.dodil/remix.yaml            remix template declaration
.dodil/deploy.yaml           how Dodil Git CI deploys the Ignite service
```

---

## Connect Claude or ChatGPT via MCP

The app serves MCP at `https://<your-app-host>/mcp`.
Add it as a custom connector in Claude or ChatGPT:
```bash
claude mcp add dodil -- dodil mcp
```
Try natural commands:
- *"What's on my plate this week?"* (`my_boards` & `show_board`)
- *"Add a card 'Send invoice' to Doing on the Ops board"* (`add_card`)
- *"Move card 12 to Done"* (`move_card`)
- *"Turn this card into a checklist"* (`suggest_checklist`)

---

## 5 Honest Lines On What Was Hard
1. Enforcing strict viewer permissions at both the MCP tool layer and the drag-and-drop web UI without code duplication.
2. Dialing in the exact 18-character repo name limit for remix bucket naming (`taskflow-data` <= 25 chars).
3. Ensuring DataK3 required explicit non-serial primary keys for multi-node consistency.
4. Handling natural language variations in Claude prompts while routing to deterministic use cases.
5. Tuning card dependency validation so blocked cards show clear visual alerts before move attempts.

---

## Licence

MIT. See [LICENSE](LICENSE).
