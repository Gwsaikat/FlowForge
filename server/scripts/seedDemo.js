import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Project from '../src/models/Project.js';
import Task from '../src/models/Task.js';
import { connectDB } from '../src/config/db.js';
import { recalculateGraph } from '../src/services/graphService.js';

const DEMO_EMAIL = 'demo@flowforge.dev';
const DEMO_PASSWORD = 'demo12345';

async function seed() {
  await connectDB();

  let user = await User.findByEmail(DEMO_EMAIL);
  if (!user) {
    user = new User({
      name: 'Demo User',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
      role: 'admin',
      velocityDrift: 1.0,
    });
    await user.save();
    console.log('Created demo user:', DEMO_EMAIL, '/', DEMO_PASSWORD);
  } else {
    console.log('Demo user exists:', DEMO_EMAIL);
  }

  await Project.deleteMany({ owner: user._id });
  await Task.deleteMany({});

  const project = await Project.create({
    name: 'FlowForge Launch 🚀',
    description: 'Live demo project — explore CPM, AI advisor, and ghost critical path',
    owner: user._id,
    members: [user._id],
    deadline: new Date(Date.now() + 45 * 86400000),
    status: 'active',
  });

  const taskDefs = [
    { title: 'Research & Requirements', duration: 3, deps: [] },
    { title: 'System Architecture', duration: 4, deps: [0] },
    { title: 'UI/UX Design', duration: 5, deps: [0] },
    { title: 'Backend API', duration: 6, deps: [1] },
    { title: 'CPM Algorithm Engine', duration: 5, deps: [1] },
    { title: 'Frontend Dashboard', duration: 4, deps: [2, 3] },
    { title: 'Graph Visualization', duration: 3, deps: [2, 4] },
    { title: 'AI Integration (LangChain)', duration: 4, deps: [3, 4] },
    { title: 'WebSocket Real-time', duration: 2, deps: [3] },
    { title: 'Integration Testing', duration: 3, deps: [5, 6, 7, 8] },
    { title: 'Deploy to Production', duration: 2, deps: [9] },
  ];

  const created = [];
  for (let i = 0; i < taskDefs.length; i++) {
    const def = taskDefs[i];
    const task = await Task.create({
      projectId: project._id,
      title: def.title,
      duration: def.duration,
      estimatedDuration: def.duration,
      assignee: user._id,
      dependencies: def.deps.map((idx) => created[idx]._id),
      status: i < 2 ? 'done' : i < 4 ? 'active' : 'pending',
      actualStart: i < 4 ? new Date(Date.now() - (4 - i) * 86400000) : null,
      actualEnd: i < 2 ? new Date(Date.now() - (2 - i) * 86400000) : null,
    });
    created.push(task);
  }

  await recalculateGraph(project._id);
  console.log('\n✅ Demo seeded!');
  console.log('   Login: demo@flowforge.dev / demo12345');
  console.log('   Project ID:', project._id);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
