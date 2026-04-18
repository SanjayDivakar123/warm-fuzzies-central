import { sendEmail } from './gmail_sender.js';
import { withAgentErrorHandling } from '../../lib/agents.js';
import { getServiceSupabase } from '../../lib/supabase.js';

const WARMUP_TEMPLATES = [
  {
    subject: 'Quick question about the Q3 review',
    body: 'Hey, did you get a chance to look at the Q3 numbers? Let me know what you think when you get a moment.'
  },
  {
    subject: 'Following up on our conversation',
    body: "Just circling back. Wanted to make sure we're aligned on next steps before end of week."
  },
  {
    subject: 'Re: Team meeting notes',
    body: 'Thanks for sharing these. The approach makes sense to me. Happy to jump on a call if useful.'
  },
  {
    subject: 'Checking in',
    body: 'Hope things are going well on your end. Let me know if you need anything from me this week.'
  },
  {
    subject: 'Quick update',
    body: "Wanted to keep you in the loop. Things are moving forward well on our end. More details soon."
  },
  {
    subject: 'Thoughts on the proposal?',
    body: 'Just wanted to see if you had a chance to review what I sent over. No rush, just want to make sure it landed.'
  },
  {
    subject: 'Re: Action items from yesterday',
    body: "Got it. I'll take care of the first two items. Can you handle the third by Thursday?"
  },
  {
    subject: 'One quick thing',
    body: 'Sorry to bother you. Just wanted to flag something minor before it becomes a bigger issue. Can we chat briefly?'
  },
  {
    subject: 'Good news',
    body: "Heard back from the team and it looks like we're good to move forward. Exciting stuff. More soon."
  },
  {
    subject: 'Availability this week?',
    body: 'Are you free for a quick 15-minute sync sometime Thursday or Friday? Just want to align before the end of the month.'
  },
  {
    subject: 'Following up',
    body: "I know things have been hectic. Just wanted to make sure this didn't get lost in the shuffle."
  },
  {
    subject: 'Re: Your last message',
    body: "Makes total sense. I think that's the right call. Let's move forward with that approach."
  },
  {
    subject: 'Heads up',
    body: "Just a heads up. There's a slight change to the timeline but nothing major. I'll send details shortly."
  },
  {
    subject: 'Looping you in',
    body: 'Wanted to make sure you were in the loop on this before it moves forward. Let me know if you have questions.'
  },
  {
    subject: 'Quick win to share',
    body: 'Good news. The numbers from last week came back stronger than expected. Worth celebrating.'
  }
];

const REPLY_TEMPLATES = [
  'Thanks for the heads up. Appreciate you keeping me in the loop.',
  "Got it, that makes sense. I'll follow up on my end.",
  'Perfect, thanks for circling back on this.',
  "Sounds good. Let's connect later this week.",
  "Appreciate the update. I'll take a look and get back to you.",
  'Great, that works for me. Talk soon.',
  'Thanks. Will review and come back with thoughts by EOD.',
  'Makes sense. Happy to move forward on that basis.'
];

const PHASE_LIMITS = {
  1: { warmupPerDay: 20, coldPerDay: 0 },
  2: { warmupPerDay: 30, coldPerDay: 15 },
  3: { warmupPerDay: 40, coldPerDay: 30 },
  4: { warmupPerDay: 40, coldPerDay: 50 }
};

function randomBusinessHourDelay() {
  const minDelay = 30 * 60 * 1000;
  const maxDelay = 4 * 60 * 60 * 1000;
  return Math.floor(minDelay + Math.random() * (maxDelay - minDelay));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function getInboxLimits(warmupPhase) {
  const normalizedPhase = Math.max(1, Math.min(Number(warmupPhase) || 1, 4));
  return PHASE_LIMITS[normalizedPhase];
}

export const getWarmupCountToday = withAgentErrorHandling(
  {
    agentName: 'Dot',
    action: 'warmup_count_failed'
  },
  async (inboxEmail) => {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const { count, error } = await supabase
    .from('agent_log')
    .select('*', { count: 'exact', head: true })
    .eq('agent_name', 'Dot')
    .eq('action', 'warmup_email_sent')
    .like('result', `%${inboxEmail}%`)
    .gte('created_at', today);

  if (error) {
    throw error;
  }

  return count || 0;
  }
);

async function logWarmupEvent(payload) {
  const supabase = getServiceSupabase();
  await supabase.from('agent_log').insert(payload);
}

export const runWarmupCycle = withAgentErrorHandling(
  {
    agentName: 'Dot',
    action: 'warmup_cycle_failed'
  },
  async (inboxes) => {
  const activeInboxes = (inboxes || []).filter(
    (inbox) => inbox?.active && inbox?.email && inbox?.credentials
  );
  const results = [];

  for (const sender of activeInboxes) {
    const limits = getInboxLimits(sender.warmup_phase);
    const alreadySentToday = await getWarmupCountToday(sender.email);
    const remainingCapacity = Math.max(0, limits.warmupPerDay - alreadySentToday);

    if (remainingCapacity === 0) {
      await logWarmupEvent({
        agent_name: 'Dot',
        action: 'warmup_cycle_skipped',
        result: `${sender.email}: no warmup capacity remaining today`
      });
      continue;
    }

    const recipients = shuffle(
      activeInboxes.filter((inbox) => inbox.email !== sender.email)
    ).slice(0, Math.min(remainingCapacity, activeInboxes.length - 1, 5));

    let sentCount = 0;

    for (const recipient of recipients) {
      const template = randomItem(WARMUP_TEMPLATES);
      const sent = await sendEmail({
        to: recipient.email,
        subject: template.subject,
        body: template.body,
        senderCredentials: sender.credentials,
        agentName: 'Dot (Warmup)'
      });

      if (!sent.ok) {
        continue;
      }

      sentCount += 1;

      await logWarmupEvent({
        agent_name: 'Dot',
        action: 'warmup_email_sent',
        result: `${sender.email} -> ${recipient.email} | ${template.subject}`
      });

      const delay = randomBusinessHourDelay();

      // This works in a long-lived worker, but serverless runtimes may exit
      // before the timer fires. Keep this as a scaffold until a durable queue
      // or scheduled job runner is added for warmup replies.
      setTimeout(async () => {
        try {
          const reply = await sendEmail({
            to: sender.email,
            subject: `Re: ${template.subject}`,
            body: randomItem(REPLY_TEMPLATES),
            senderCredentials: recipient.credentials,
            agentName: 'Dot (Warmup Reply)'
          });

          await logWarmupEvent({
            agent_name: 'Dot',
            action: reply.ok ? 'warmup_reply_sent' : 'warmup_reply_failed',
            result: `${recipient.email} -> ${sender.email} | Re: ${template.subject}`,
            error: reply.ok ? null : reply.error
          });
        } catch (error) {
          await logWarmupEvent({
            agent_name: 'Dot',
            action: 'warmup_reply_failed',
            result: `${recipient.email} -> ${sender.email} | Re: ${template.subject}`,
            error: error.message
          });
        }
      }, delay);

      results.push({
        from: sender.email,
        to: recipient.email,
        subject: template.subject,
        reply_in_minutes: Math.round(delay / 60000),
        phase: Number(sender.warmup_phase) || 1,
        daily_cold_limit: limits.coldPerDay
      });
    }

    await logWarmupEvent({
      agent_name: 'Dot',
      action: 'warmup_cycle_complete',
      result: `${sender.email}: sent ${sentCount} warmup emails`
    });
  }

  return results;
  }
);
