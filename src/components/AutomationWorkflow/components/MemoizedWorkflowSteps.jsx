import React, { memo } from 'react';
import WorkflowStep from '../ui/WorkflowStep';

const WorkflowSteps = ({ workflowSteps, selectedNodeId, animatingNodes, ...handlers }) => {
  return workflowSteps.map(step => (
    <WorkflowStep
      key={step.id}
      id={step.id}
      type={step.type}
      title={step.title}
      subtitle={step.subtitle}
      position={step.position}
      isSelected={selectedNodeId === step.id}
      isNew={step.isNew || animatingNodes.includes(step.id)}
      // ...other props
      {...handlers}
    />
  ));
};

export const MemoizedWorkflowSteps = memo(WorkflowSteps, (prevProps, nextProps) => {
  // Implement proper comparison logic
  return (
    JSON.stringify(prevProps.workflowSteps) === JSON.stringify(nextProps.workflowSteps) &&
    prevProps.selectedNodeId === nextProps.selectedNodeId &&
    JSON.stringify(prevProps.animatingNodes) === JSON.stringify(nextProps.animatingNodes)
  );
});
