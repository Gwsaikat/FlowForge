import { memo, useCallback } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import TaskNode from './TaskNode.jsx';
import { useGraphStore } from '../store/useGraphStore.js';

const nodeTypes = { taskNode: TaskNode };

function GraphCanvas({ onTaskClick, sandboxMode = false }) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);

  const onNodeClick = useCallback(
    (_event, node) => {
      const task = useGraphStore.getState().tasks.find((t) => t._id === node.id);
      if (task) onTaskClick?.(task);
    },
    [onTaskClick]
  );

  return (
    <div style={{ width: '100%', height: '100%', opacity: sandboxMode ? 0.7 : 1, transition: 'opacity 0.3s ease' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Controls />
        <MiniMap
          nodeColor={(n) => (n.data?.task?.isCritical ? '#EF4444' : '#818CF8')}
          maskColor="rgba(0,0,0,0.7)"
          style={{ background: '#0e0e16', border: '1px solid rgba(255,255,255,0.06)' }}
        />
        <Background gap={24} size={1} color="rgba(255,255,255,0.08)" />
      </ReactFlow>
    </div>
  );
}

export default memo(GraphCanvas);
