import api from './api.js';
import { isInDemoMode, demoApi } from '../demo/demoApi.js';

export async function getAIAdvisor(projectId) {
  if (isInDemoMode()) return demoApi.getAIAdvisor();
  const { data } = await api.get(`/projects/${projectId}/ai/advisor`);
  return data.data;
}

export async function getAIStandup(projectId) {
  if (isInDemoMode()) return demoApi.getStandup();
  const { data } = await api.get(`/projects/${projectId}/ai/standup`);
  return data.data;
}

export async function getAISmartDeps(projectId) {
  if (isInDemoMode()) return demoApi.getSmartDeps();
  const { data } = await api.get(`/projects/${projectId}/ai/smart-dependencies`);
  return data.data;
}

export async function getAIGhostPath(projectId) {
  if (isInDemoMode()) return demoApi.getGhostPath();
  const { data } = await api.get(`/projects/${projectId}/ai/ghost-path`);
  return data.data;
}
