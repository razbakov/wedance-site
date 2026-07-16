// Living-document comment → Linear Triage issue.
// POST { quote, section, comment, commenter } → creates an issue in team WED's
// Triage with the `objection` label. Uses LINEAR_API_KEY (Personal API key).
const TEAM_ID = '9fc5052b-a799-4b60-99b5-300512ddd275'; // Wedance (WED)

async function linear(query, variables) {
  const r = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: process.env.LINEAR_API_KEY },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(j.errors[0].message);
  return j.data;
}

async function ensureLabel() {
  // find or create the "objection" label on the team
  const q = `query($t:String!){ team(id:$t){ labels(filter:{name:{eq:"objection"}}){ nodes{ id } } } }`;
  const d = await linear(q, { t: TEAM_ID });
  const existing = d.team.labels.nodes[0];
  if (existing) return existing.id;
  const m = `mutation($t:String!){ issueLabelCreate(input:{name:"objection",color:"#f2994a",teamId:$t}){ issueLabel{ id } } }`;
  const c = await linear(m, { t: TEAM_ID });
  return c.issueLabelCreate.issueLabel.id;
}

async function triageStateId() {
  // prefer a Triage-type state if the team has one; else leave default
  const q = `query($t:String!){ team(id:$t){ states{ nodes{ id name type } } triageEnabled } }`;
  const d = await linear(q, { t: TEAM_ID });
  const s = d.team.states.nodes.find(x => x.type === 'triage');
  return s ? s.id : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.LINEAR_API_KEY) return res.status(500).json({ error: 'not configured' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const quote = (body.quote || '').toString().slice(0, 300).trim();
    const comment = (body.comment || '').toString().slice(0, 4000).trim();
    const section = (body.section || 'the document').toString().slice(0, 120);
    const commenter = (body.commenter || 'Anonymous').toString().slice(0, 120);
    if (!comment) return res.status(400).json({ error: 'comment required' });

    const title = `Comment: ${(quote || section).slice(0, 70)}${(quote || section).length > 70 ? '…' : ''}`;
    const description = [
      `**${commenter}** commented on the living org doc (§ ${section}):`,
      '', `> ${comment}`, '',
      quote ? `Passage:\n> ${quote}` : '',
      '', `---`, `Filed from org.wedance.vip · triage per Sociocracy 3.0 (raise → resolve objections).`,
    ].filter(Boolean).join('\n');

    const [labelId, stateId] = await Promise.all([ensureLabel().catch(() => null), triageStateId().catch(() => null)]);
    const input = { teamId: TEAM_ID, title, description, priority: 2 };
    if (labelId) input.labelIds = [labelId];
    if (stateId) input.stateId = stateId;

    const d = await linear(
      `mutation($i:IssueCreateInput!){ issueCreate(input:$i){ success issue{ identifier url } } }`,
      { i: input }
    );
    const issue = d.issueCreate.issue;
    return res.status(200).json({ ok: true, identifier: issue.identifier, url: issue.url });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'failed' });
  }
}
