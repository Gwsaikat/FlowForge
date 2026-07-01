import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { toAlgoTasks } from '../algorithms/graphUtils.js';
import { detectDependencySmells } from '../algorithms/smellDetector.js';
import { runCPM } from '../algorithms/cpmEngine.js';
import {
  predictGhostCriticalPath,
  detectImpliedDependencies,
  rankDelayProphet,
} from '../algorithms/ghostCriticalPath.js';
import { safeGet, safeSetex } from '../config/redis.js';

/**
 * Check if OpenAI API key is configured.
 */
function isAIEnabled() {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Create LangChain chat model with low temperature for analysis.
 */
function createModel() {
  return new ChatOpenAI({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.3,
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Run a LangChain prompt chain, with graceful fallback.
 */
async function runChain(prompt, variables, fallback) {
  if (!isAIEnabled()) return fallback;
  try {
    const chain = prompt.pipe(createModel()).pipe(new StringOutputParser());
    return await chain.invoke(variables);
  } catch (err) {
    console.error('AI chain failed:', err.message);
    return fallback;
  }
}

const advisorPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are FlowForge AI — the world's first Critical Path Method intelligence engine.
Analyze project graph data and give actionable advice in markdown.
Be specific, reference task names, be concise (max 250 words).
Use emoji sparingly for section headers.`,
  ],
  [
    'human',
    `Project: {projectName}
Duration: {duration} days
Critical path: {criticalPath}
Tasks: {taskSummary}
Health score: {healthScore}/100
Ghost path risks: {ghostRisks}
Top slip risks: {slipRisks}

Give: 1) Executive summary 2) Top 3 actions 3) One insight nobody else would notice`,
  ],
]);

const standupPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'Generate a concise team standup brief from CPM graph data. Format: Yesterday/Today/Blockers/Risks. Max 200 words. Be specific with task names.',
  ],
  [
    'human',
    `Project: {projectName}
Active tasks: {activeTasks}
Blocked: {blockedTasks}
Critical path: {criticalPath}
Deadline pressure tasks: {highPressure}`,
  ],
]);

const blastNarratorPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'Explain a project cascade/block impact in plain English for non-technical stakeholders. 3 sentences max.',
  ],
  [
    'human',
    `Task "{taskTitle}" was marked {status}.
Deadline shift: {shift} days
Affected tasks: {affected}
Severity: {severity}`,
  ],
]);

/**
 * Build drift map for all assignees in project.
 */
async function getDriftMap(tasks) {
  const assigneeIds = [...new Set(tasks.map((t) => t.assignee).filter(Boolean))];
  const users = await User.find({ _id: { $in: assigneeIds } }).lean();
  return Object.fromEntries(users.map((u) => [String(u._id), u.velocityDrift || 1.0]));
}

/**
 * Full AI project advisor analysis.
 */
export async function getProjectAdvisor(projectId, project) {
  const cacheKey = `ai:advisor:${projectId}`;
  const cached = await safeGet(cacheKey);
  if (cached) return JSON.parse(cached);

  const tasks = await Task.find({ projectId }).populate('assignee', 'name email').lean();
  const algoTasks = toAlgoTasks(tasks);
  const driftMap = await getDriftMap(tasks);

  let cpm;
  try {
    cpm = runCPM(algoTasks);
  } catch {
    cpm = { criticalPath: [], projectDuration: 0, tasks: algoTasks };
  }

  const health = detectDependencySmells(algoTasks);
  const ghost = predictGhostCriticalPath(algoTasks, driftMap);
  const prophet = rankDelayProphet(
    cpm.tasks.map((t) => ({ ...t, assignee: tasks.find((x) => String(x._id) === String(t._id))?.assignee?._id })),
    driftMap
  );

  const criticalNames = cpm.criticalPath
    .map((id) => tasks.find((t) => String(t._id) === id)?.title)
    .filter(Boolean)
    .join(' → ');

  const taskSummary = tasks
    .map((t) => `${t.title} (${t.status}, ${t.duration}d, float:${t.float}d, critical:${t.isCritical})`)
    .join('; ');

  const fallbackAnalysis = buildFallbackAdvisor(project, cpm, health, ghost, prophet);

  const analysis = await runChain(
    advisorPrompt,
    {
      projectName: project.name,
      duration: cpm.projectDuration,
      criticalPath: criticalNames || 'None yet',
      taskSummary,
      healthScore: health.healthScore,
      ghostRisks: ghost.ghostTasks.map((g) => `${g.title} (${g.probability}%)`).join(', ') || 'None',
      slipRisks: prophet.map((p) => `${p.title} (${p.slipProbability}%)`).join(', ') || 'None',
    },
    fallbackAnalysis
  );

  const result = {
    analysis,
    health,
    ghostCriticalPath: ghost,
    delayProphet: prophet,
    aiEnabled: isAIEnabled(),
    generatedAt: new Date(),
  };

  await safeSetex(cacheKey, 120, JSON.stringify(result));
  return result;
}

function buildFallbackAdvisor(project, cpm, health, ghost, prophet) {
  let md = `## 📊 ${project.name} — Graph Intelligence\n\n`;
  md += `**${cpm.projectDuration} day** project with **${cpm.criticalPath.length}** critical tasks.\n\n`;
  md += `### ⚡ Top Actions\n`;
  if (ghost.ghostTasks[0]) md += `1. Watch **${ghost.ghostTasks[0].title}** — ${ghost.ghostTasks[0].probability}% chance of joining critical path\n`;
  if (prophet[0]) md += `2. **${prophet[0].title}** has ${prophet[0].slipProbability}% slip probability — assign buffer or swap assignee\n`;
  if (health.totalSmells > 0) md += `3. Fix ${health.totalSmells} graph health issues (score: ${health.healthScore}/100)\n`;
  else md += `3. Graph structure is healthy — focus on velocity on critical path\n`;
  md += `\n### 💡 Unique Insight\n`;
  md += ghost.shiftRisk > 50
    ? `Ghost Critical Path detected: the project's critical chain may **shift** even without new blockers — velocity drift is silently consuming float on parallel branches.`
    : `Your critical path is stable, but ${prophet.filter((p) => p.urgency !== 'watch').length} tasks show early slip signals before hitting the critical chain.`;
  return md;
}

/**
 * AI standup brief generator.
 */
export async function generateStandupBrief(projectId, project) {
  const tasks = await Task.find({ projectId }).populate('assignee', 'name').lean();
  const active = tasks.filter((t) => t.status === 'active').map((t) => t.title);
  const blocked = tasks.filter((t) => ['blocked', 'delayed'].includes(t.status)).map((t) => t.title);
  const critical = tasks.filter((t) => t.isCritical).map((t) => t.title);
  const highPressure = tasks.filter((t) => (t.dps ?? 100) < 30).map((t) => t.title);

  const fallback = `**Yesterday:** ${tasks.filter((t) => t.status === 'done').slice(-3).map((t) => t.title).join(', ') || 'No completions logged'}\n**Today:** Focus on ${critical.slice(0, 2).join(' and ') || 'planning'}\n**Blockers:** ${blocked.join(', ') || 'None 🟢'}\n**Risk:** ${highPressure[0] ? `${highPressure[0]} is under high deadline pressure` : 'On track'}`;

  const brief = await runChain(
    standupPrompt,
    {
      projectName: project.name,
      activeTasks: active.join(', ') || 'None',
      blockedTasks: blocked.join(', ') || 'None',
      criticalPath: critical.join(' → ') || 'Not computed',
      highPressure: highPressure.join(', ') || 'None',
    },
    fallback
  );

  return { brief, aiEnabled: isAIEnabled(), generatedAt: new Date() };
}

/**
 * Semantic dependency suggestions (AI-enhanced).
 */
export async function getSmartDependencies(projectId) {
  const tasks = await Task.find({ projectId }).lean();
  const algoTasks = toAlgoTasks(tasks);
  const ruleBased = detectImpliedDependencies(algoTasks);

  if (!isAIEnabled()) {
    return { suggestions: ruleBased, aiEnabled: false, method: 'semantic-rules' };
  }

  try {
    const taskList = tasks.map((t) => `ID:${t._id} "${t.title}" deps:[${(t.dependencies || []).join(',')}]`).join('\n');
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'Analyze tasks and suggest missing dependencies as JSON array: [{fromTaskId,toTaskId,confidence,reason}]. Only suggest logical dev workflow deps not already present. Return ONLY valid JSON array.'],
      ['human', 'Tasks:\n{tasks}'],
    ]);
    const chain = prompt.pipe(createModel()).pipe(new StringOutputParser());
    const raw = await chain.invoke({ tasks: taskList });
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const aiSuggestions = JSON.parse(jsonMatch[0]);
      const merged = [...ruleBased];
      for (const s of aiSuggestions) {
        if (!merged.some((m) => m.fromTaskId === s.fromTaskId && m.toTaskId === s.toTaskId)) {
          merged.push({ ...s, fromTitle: tasks.find((t) => String(t._id) === s.fromTaskId)?.title, toTitle: tasks.find((t) => String(t._id) === s.toTaskId)?.title });
        }
      }
      return { suggestions: merged.sort((a, b) => b.confidence - a.confidence).slice(0, 10), aiEnabled: true, method: 'langchain+rules' };
    }
  } catch (err) {
    console.error('Smart deps AI failed:', err.message);
  }

  return { suggestions: ruleBased, aiEnabled: false, method: 'semantic-rules' };
}

/**
 * Ghost critical path with AI narrative.
 */
export async function getGhostCriticalPathAnalysis(projectId) {
  const tasks = await Task.find({ projectId }).lean();
  const driftMap = await getDriftMap(tasks);
  const ghost = predictGhostCriticalPath(toAlgoTasks(tasks), driftMap);

  const fallback = ghost.ghostTasks.length
    ? `⚠️ ${ghost.ghostTasks.length} task(s) may silently join the critical path. Highest risk: "${ghost.ghostTasks[0].title}" at ${ghost.ghostTasks[0].probability}% probability. This happens when team velocity drift consumes float before anyone notices.`
    : '✅ Critical path is stable — no ghost path shifts predicted based on current velocity data.';

  let narrative = fallback;
  if (isAIEnabled() && ghost.ghostTasks.length) {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'Explain ghost critical path prediction to a project manager in 2 sentences. Be alarming but actionable.'],
      ['human', 'Ghost tasks: {ghostTasks}. Shift risk: {shiftRisk}%'],
    ]);
    narrative = await runChain(prompt, {
      ghostTasks: ghost.ghostTasks.map((g) => `${g.title}(${g.probability}%)`).join(', '),
      shiftRisk: ghost.shiftRisk,
    }, fallback);
  }

  return { ...ghost, narrative, aiEnabled: isAIEnabled() };
}

/**
 * Narrate blast radius / cascade impact.
 */
export async function narrateBlastRadius(taskTitle, status, cascadeResult) {
  const fallback = cascadeResult.deadlineShift > 0
    ? `Blocking "${taskTitle}" pushes the project deadline back by ${cascadeResult.deadlineShift} day(s). ${cascadeResult.affectedTaskIds?.length || 0} downstream tasks are impacted.`
    : `"${taskTitle}" is blocked but the project deadline holds — affected tasks have enough float to absorb the delay.`;

  const narrative = await runChain(
    blastNarratorPrompt,
    {
      taskTitle,
      status,
      shift: cascadeResult.deadlineShift,
      affected: cascadeResult.affectedTaskIds?.length || 0,
      severity: cascadeResult.severity,
    },
    fallback
  );

  return { narrative, aiEnabled: isAIEnabled() };
}

export { rankDelayProphet, isAIEnabled };
