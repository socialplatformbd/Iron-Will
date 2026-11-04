import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { db } from '@/database/db';
import { MS_DAY } from '@/data/constants';

type Message = { role: 'coach' | 'user'; text: string };

const REPLIES = [
  'Try making the next step very small. Drink a glass of water, change rooms, and give yourself five minutes before deciding what to do.',
  'A craving rises and falls. You do not need to solve your whole future right now. Focus on the next helpful choice.',
  'Look at what has helped you before. Could you repeat one of those actions today?',
  'Progress is built from repeated choices, not perfection. Treat yourself with patience and keep moving.',
  'If a situation is triggering you, change one part of it: your location, activity, or who you are with.',
];

const SAFETY_RE = /suicid|kill myself|end my life|want to die|self[- ]?harm|hurt myself|আত্মহত্যা|মরে যেতে|মরতে চাই|নিজেকে শেষ/i;
const SETBACK_RE = /\b(failed|relapsed|slipped|slip up|gave in|reset)\b|ভুল|ব্যর্থ/i;
const CRAVING_RE = /crav|urge|tempt|relapse|give in|ইচ্ছা|টান/i;
const PROGRESS_RE = /progress|streak|how am i doing|দিন/i;

const SAFETY_REPLY =
  'I am really sorry you are hurting. Your safety matters more than any streak. Please contact your local emergency number or a crisis line in your area right now, or reach out to someone you trust and stay with them. I am only a simple on-device tool and cannot give the help a real person can.';

export default function CoachPage() {
  const { startedAt, profile, achievements } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      text: 'Hi. I am your private, on-device motivation coach. Tell me what feels difficult, or choose one of the prompts below. Your messages stay on this device.',
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  const days = startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / MS_DAY)) : 0;
  const prompt = useMemo(() => `My current streak is ${days} ${days === 1 ? 'day' : 'days'}. My goal is ${profile.habitName || 'building a healthier habit'}.`, [days, profile.habitName]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(
    () => () => {
      timeoutsRef.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  const buildAnswer = async (clean: string): Promise<string> => {
    if (SAFETY_RE.test(clean)) return SAFETY_REPLY;
    let highIntensity = 0;
    try {
      const recent = await db.journal.orderBy('createdAt').reverse().limit(10).toArray();
      highIntensity = recent.filter((r) => Number(r.intensity) >= 4).length;
    } catch {
      /* the coach still works without journal data */
    }
    if (SETBACK_RE.test(clean)) {
      return 'A setback does not erase what you learned or the effort you made. Review what led up to it without judging yourself, choose one change, and begin again when you are ready.';
    }
    if (CRAVING_RE.test(clean)) {
      return `Pause for a moment. Move away from the trigger if you can, take a slow breath, and start Emergency Mode from the home screen. A strong urge is uncomfortable, but it does not make the decision for you. ${REPLIES[0]}`;
    }
    if (PROGRESS_RE.test(clean)) {
      return `You currently have ${days} ${days === 1 ? 'day' : 'days'} on this timer and ${achievements.length} ${achievements.length === 1 ? 'achievement' : 'achievements'} recorded. Notice what is working and keep the next step realistic.`;
    }
    let answer = REPLIES[(clean.length + days + messages.length) % REPLIES.length];
    if (highIntensity > 0) {
      answer += ` Your recent journal includes ${highIntensity} high-intensity craving ${highIntensity === 1 ? 'record' : 'records'}. Consider checking the triggers and planning support for those situations.`;
    }
    return answer;
  };

  const respond = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((m) => [...m, { role: 'user', text: clean }]);
    setInput('');
    const answer = await buildAnswer(clean);
    const t = window.setTimeout(() => setMessages((m) => [...m, { role: 'coach', text: answer }]), 250);
    timeoutsRef.current.push(t);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Motivation Coach" subtitle="Private, rule-based guidance that works offline. This is not a clinical or generative AI service." />
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent">
            <Bot />
          </div>
          <div>
            <h2 className="font-semibold">Your local coach</h2>
            <p className="text-xs text-muted">No API · No account · No data sent away</p>
          </div>
          <span className="ml-auto rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">On-device</span>
        </div>
        <div ref={listRef} className="mt-4 max-h-[52dvh] min-h-64 space-y-3 overflow-y-auto rounded-2xl bg-surface2 p-3" aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'ml-auto bg-accent text-onaccent' : 'bg-surface text-ink'}`}>
              {m.text}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className="field min-w-0 flex-1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) void respond(input);
            }}
            placeholder="What is on your mind?"
            aria-label="Message to your coach"
            maxLength={500}
          />
          <Button onClick={() => void respond(input)} disabled={!input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="min-h-10 rounded-full bg-surface2 px-3 py-2 text-xs" onClick={() => void respond('I am having a craving right now.')}>
            I have a craving
          </button>
          <button className="min-h-10 rounded-full bg-surface2 px-3 py-2 text-xs" onClick={() => void respond('Help me stay consistent.')}>
            Help me stay consistent
          </button>
          <button className="min-h-10 rounded-full bg-surface2 px-3 py-2 text-xs" onClick={() => void respond('How is my progress and streak?')}>
            Review my progress
          </button>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-accent" />
          Personal reminder
        </div>
        <p className="mt-2 text-sm text-muted">{prompt} Advice is generated locally from simple rules and your current app data. It is not medical advice.</p>
      </Card>
    </div>
  );
}
