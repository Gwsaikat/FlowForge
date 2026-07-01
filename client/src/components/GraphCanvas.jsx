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
    <div style={{ width: '100%', height: '100%', opacity: sandboxMode ? 0.7 : 1 }}>
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
          nodeColor={(n) => (n.data?.task?.isCritical ? '#FF4D6D' : '#4F8EF7')}
          maskColor="rgba(0,0,0,0.6)"
        />
        <Background gap={16} color="#2E3446" />
      </ReactFlow>
    </div>
  );
}

export default memo(GraphCanvas);
