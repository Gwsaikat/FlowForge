import api from './api.js';
import { isInDemoMode, demoApi, demoDelay } from '../demo/demoApi.js';

export async function getProjects() {
  if (isInDemoMode()) return demoApi.getProjects();
  const { data } = await api.get('/projects');
  return data.data.projects;
}

export async function createProject(payload) {
  if (isInDemoMode()) {
    await demoDelay();
    throw new Error('Demo mode — sign up to create projects');
  }
  const { data } = await api.post('/projects', payload);
  return data.data.project;
}

export async function getProject(projectId) {
  if (isInDemoMode()) return demoApi.getProject();
  const { data } = await api.get(`/projects/${projectId}`);
  return data.data.project;
}

export async function createTask(projectId, payload) {
  if (isInDemoMode()) {
    await demoDelay();
    throw new Error('Demo mode — sign up to add tasks');
  }
  const { data } = await api.post(`/projects/${projectId}/tasks`, payload);
  return data.data.task;
}

export async function updateTask(projectId, taskId, payload) {
  if (isInDemoMode()) {
    await demoDelay();
    throw new Error('Demo mode — sign up to edit tasks');
  }
  const { data } = await api.put(`/projects/${projectId}/tasks/${taskId}`, payload);
  return data.data.task;
}

export async function updateTaskStatus(projectId, taskId, status) {
  if (isInDemoMode()) {
    await demoDelay();
    const tasks = await demoApi.getTasks();
    const task = tasks.find((t) => t._id === taskId);
    return { task: { ...task, status }, cascadeResult: null };
  }
  const { data } = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });
  return data.data;
}

export async function deleteTask(projectId, taskId) {
  if (isInDemoMode()) throw new Error('Demo mode — sign up to delete tasks');
  const { data } = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return data.data;
}

export async function addDependency(projectId, taskId, dependsOnTaskId) {
  if (isInDemoMode()) throw new Error('Demo mode — sign up to edit dependencies');
  const { data } = await api.post(`/projects/${projectId}/tasks/${taskId}/dependencies`, {
    dependsOnTaskId,
  });
  return data.data.task;
}

export async function removeDependency(projectId, taskId, depId) {
  if (isInDemoMode()) throw new Error('Demo mode — sign up to edit dependencies');
  const { data } = await api.delete(
    `/projects/${projectId}/tasks/${taskId}/dependencies/${depId}`
  );
  return data.data.task;
}

export async function runSandbox(projectId, taskOverrides) {
  if (isInDemoMode()) {
    await demoDelay(800);
    return {
      original: { projectDuration: 28, criticalPath: ['t1', 't2', 't4', 't8', 't10', 't11'] },
      simulated: { projectDuration: 32, criticalPath: ['t1', 't2', 't4', 't8', 't10', 't11'] },
      impact: { deadlineShift: 4, criticalPathChanged: false, newCriticalTasks: [], freedCriticalTasks: [] },
    };
  }
  const { data } = await api.post(`/projects/${projectId}/sandbox`, { taskOverrides });
  return data.data;
}

export async function getProjectDeadline(projectId) {
  if (isInDemoMode()) return demoApi.getDeadline();
  const { data } = await api.get(`/projects/${projectId}/deadline`);
  return data.data;
}

export async function getProjectHealth(projectId) {
  if (isInDemoMode()) return demoApi.getHealth();
  const { data } = await api.get(`/projects/${projectId}/health`);
  return data.data;
}

export async function getParallelOpportunities(projectId) {
  if (isInDemoMode()) return (await demoApi.getOpportunities()).opportunities;
  const { data } = await api.get(`/projects/${projectId}/opportunities`);
  return data.data.opportunities;
}

export async function getHandoffReport(projectId) {
  if (isInDemoMode()) return demoApi.getHandoffReport();
  const { data } = await api.get(`/projects/${projectId}/handoff-report`);
  return data.data;
}
