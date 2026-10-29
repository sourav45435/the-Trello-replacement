import React, { useState, useRef, useEffect } from 'react';
import { User, Board, BoardList, Card, ActivityLog } from '../domain/types';
import { executeMCPTool, MCPAppState } from '../domain/rules';
import {
  Sparkles,
  Send,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Bot,
  Zap,
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolCall?: {
    tool: string;
    args: Record<string, any>;
    result: any;
  };
  cardItems?: Array<{
    id: number;
    title: string;
    dueDate?: string;
    board?: string;
    list?: string;
  }>;
  overdueItems?: Array<{
    id: number;
    title: string;
    dueDate?: string;
  }>;
  successAction?: string;
}

interface AiAssistantPanelProps {
  currentUser: User;
  boards: Board[];
  lists: BoardList[];
  cards: Card[];
  allUsers: User[];
  activityLogs: ActivityLog[];
  onApplyStateUpdate: (updates: { cards?: Card[]; activityLogs?: ActivityLog[] }) => void;
  onOpenCardDetails: (card: Card) => void;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  currentUser,
  boards,
  lists,
  cards,
  allUsers,
  activityLogs,
  onApplyStateUpdate,
  onOpenCardDetails,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'user',
      text: "What's on my plate this week?",
    },
    {
      id: 'm2',
      sender: 'assistant',
      text: "Here's your work for this week:",
      cardItems: [
        { id: 1, title: 'Design landing page', dueDate: 'Nov 5' },
        { id: 12, title: 'API integration', dueDate: 'Nov 6' },
        { id: 13, title: 'Create user onboarding', dueDate: 'Nov 9' },
        { id: 2, title: 'Write product docs', dueDate: 'Nov 7' },
      ],
    },
    {
      id: 'm3',
      sender: 'user',
      text: 'Add a card "Send invoice" to Doing on the Ops board.',
    },
    {
      id: 'm4',
      sender: 'assistant',
      text: 'Card "Send invoice" has been added to the Doing list on the Ops board.',
      successAction: 'Card "Send invoice" has been added to the Doing list on the Ops board.',
    },
    {
      id: 'm5',
      sender: 'user',
      text: 'Move card 12 to Done.',
    },
    {
      id: 'm6',
      sender: 'assistant',
      text: 'Card 12 has been moved to the Done list.',
      successAction: 'Card 12 has been moved to the Done list.',
    },
    {
      id: 'm7',
      sender: 'user',
      text: "What's overdue?",
    },
    {
      id: 'm8',
      sender: 'assistant',
      text: 'You have 2 overdue cards:',
      overdueItems: [
        { id: 2, title: 'Write product docs', dueDate: 'Nov 7' },
        { id: 4, title: 'Competitor research', dueDate: 'Nov 8' },
      ],
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSendCommand = (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt) return;

    const userMessage: Message = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsProcessing(true);

    setTimeout(() => {
      // Natural language tool router matching Dodil MCP actions
      const lower = prompt.toLowerCase();
      const appState: MCPAppState = {
        boards,
        lists,
        cards,
        users: allUsers,
        activityLogs,
      };

      let responseMessage: Message;

      if (lower.includes("what's on my plate") || lower.includes('my tasks') || lower.includes('my cards') || lower.includes('assigned to me')) {
        const result = executeMCPTool('list_my_cards', {}, currentUser, appState);
        const cardItems = (result.data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          dueDate: c.dueDate,
          board: c.board,
          list: c.list,
        }));

        responseMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: result.message,
          cardItems: cardItems.length > 0 ? cardItems : undefined,
          toolCall: { tool: 'list_my_cards', args: {}, result: result.data },
        };
      } else if (lower.includes('what is overdue') || lower.includes("what's overdue") || lower.includes('overdue')) {
        const result = executeMCPTool('list_overdue', {}, currentUser, appState);
        const overdue = (result.data || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          dueDate: c.dueDate,
        }));

        responseMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: result.message,
          overdueItems: overdue.length > 0 ? overdue : undefined,
          toolCall: { tool: 'list_overdue', args: {}, result: result.data },
        };
      } else if (lower.includes('move card')) {
        // Parse "move card 12 to Done" or "move card #12 to Done"
        const cardMatch = lower.match(/card\s*#?(\d+)/);
        const toMatch = lower.match(/to\s+([a-zA-Z\s]+)/);

        const cardId = cardMatch ? Number(cardMatch[1]) : 12;
        const targetListTitle = toMatch ? toMatch[1].trim() : 'Done';

        const result = executeMCPTool(
          'move_card',
          { card_id: cardId, target_list_title: targetListTitle },
          currentUser,
          appState
        );

        if (result.success && result.newState) {
          onApplyStateUpdate(result.newState);
          responseMessage = {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: result.message,
            successAction: result.message,
            toolCall: {
              tool: 'move_card',
              args: { card_id: cardId, target_list_title: targetListTitle },
              result: result.data,
            },
          };
        } else {
          responseMessage = {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: result.message,
          };
        }
      } else if (lower.includes('add a card') || lower.includes('create a card') || lower.includes('add card')) {
        // e.g. Add a card 'Send invoice' to Doing on the Ops board
        const titleMatch = prompt.match(/['"]([^'"]+)['"]/);
        const title = titleMatch ? titleMatch[1] : 'New Task';
        const boardMatch = prompt.match(/on\s+(?:the\s+)?([a-zA-Z\s]+?)\s+board/i);
        const boardName = boardMatch ? boardMatch[1].trim() : 'Ops';
        const listMatch = prompt.match(/to\s+([a-zA-Z\s]+?)\s+on/i);
        const listTitle = listMatch ? listMatch[1].trim() : 'Doing';

        const result = executeMCPTool(
          'add_card',
          { title, board_name: boardName, list_title: listTitle },
          currentUser,
          appState
        );

        if (result.success && result.newState) {
          onApplyStateUpdate(result.newState);
          responseMessage = {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: result.message,
            successAction: result.message,
            toolCall: {
              tool: 'add_card',
              args: { title, board_name: boardName, list_title: listTitle },
              result: result.data,
            },
          };
        } else {
          responseMessage = {
            id: `asst_${Date.now()}`,
            sender: 'assistant',
            text: result.message,
          };
        }
      } else if (lower.includes('summary') || lower.includes('daily summary')) {
        const result = executeMCPTool('get_board_summary', {}, currentUser, appState);
        responseMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: result.message,
          toolCall: { tool: 'get_board_summary', args: {}, result: result.data },
        };
      } else {
        // General conversational response with MCP actions
        responseMessage = {
          id: `asst_${Date.now()}`,
          sender: 'assistant',
          text: `I understood: "${prompt}". I can query tasks, move cards between lists, report overdue items, or summarize boards. Try one of the suggested commands!`,
        };
      }

      setMessages((prev) => [...prev, responseMessage]);
      setIsProcessing(false);
    }, 400);
  };

  const samplePrompts = [
    "What's on my plate this week?",
    'Add a card "Send invoice" to Doing on the Ops board.',
    'Move card 12 to Done.',
    "What's overdue?",
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
      {/* Header matching screenshot */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Ask your AI assistant</h2>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 leading-normal">
          Get things done using natural language. Your AI only sees the boards you can access.
        </p>

        {/* Quick prompt pills */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendCommand(p)}
              className="text-[11px] bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 px-2 py-1 rounded-full text-left transition-colors flex items-center gap-1 group"
            >
              <span className="truncate max-w-[200px]">{p}</span>
              <ArrowRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 text-blue-600 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((m) => {
          if (m.sender === 'user') {
            return (
              <div key={m.id} className="flex items-start gap-2 justify-end">
                <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-tr-xs px-3.5 py-2 max-w-[85%] font-medium">
                  {m.text}
                </div>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200"
                />
              </div>
            );
          }

          return (
            <div key={m.id} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                <Layers className="w-3.5 h-3.5" />
              </div>

              <div className="space-y-2 max-w-[88%]">
                {/* Standard response or Success card */}
                {m.successAction ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 text-emerald-900 rounded-xl p-3 flex items-start gap-2 shadow-2xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium text-emerald-800 leading-relaxed">
                      {m.successAction}
                    </span>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                    <p className="text-slate-800 leading-relaxed font-medium">{m.text}</p>

                    {/* Task list items */}
                    {m.cardItems && (
                      <ul className="mt-2 space-y-1.5 pl-1">
                        {m.cardItems.map((c) => (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-2 text-slate-700 bg-slate-50 hover:bg-blue-50/50 p-1.5 rounded border border-slate-100 cursor-pointer transition-colors"
                            onClick={() => {
                              const found = cards.find((card) => card.id === c.id);
                              if (found) onOpenCardDetails(found);
                            }}
                          >
                            <span className="font-medium truncate">• {c.title}</span>
                            {c.dueDate && (
                              <span className="text-[10px] text-slate-500 font-semibold shrink-0 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                Due {c.dueDate}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Overdue alert items */}
                    {m.overdueItems && (
                      <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px] mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Overdue Tasks Attention Required</span>
                        </div>
                        <ul className="space-y-1 pl-1">
                          {m.overdueItems.map((c) => (
                            <li key={c.id} className="text-amber-900 font-medium">
                              • {c.title}{' '}
                              <span className="text-amber-700 text-[10px] font-normal">
                                (Due {c.dueDate})
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-slate-400 italic text-[11px]">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-600" />
            <span>AI analyzing request across accessible boards...</span>
          </div>
        )}
      </div>

      {/* Input bar matching screenshot */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCommand();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder="Ask a question or give a command..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            aria-label="Send AI command"
            className="absolute right-1.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
