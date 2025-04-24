'use strict';

/**
 * Enum for ATT&CK object workflow states
 * @readonly
 * @enum {string}
 */
const WorkflowStates = {
  /** Initial state for objects being developed */
  WORK_IN_PROGRESS: 'work-in-progress',

  /** State for objects ready for review by leads */
  AWAITING_REVIEW: 'awaiting-review',

  /** State for objects that have been reviewed and approved */
  REVIEWED: 'reviewed',

  /** State for objects that should not be modified (typically imported/system objects) */
  STATIC: 'static',
};

/**
 * Check if a state transition is valid
 * @param {string} fromState - Current workflow state
 * @param {string} toState - Target workflow state
 * @returns {boolean} - Whether the transition is valid
 */
const isValidStateTransition = (fromState, toState) => {
  // If states are the same, it's not a transition
  if (fromState === toState) {
    return false;
  }

  // Define allowed transitions
  const allowedTransitions = {
    [WorkflowStates.WORK_IN_PROGRESS]: [WorkflowStates.AWAITING_REVIEW],
    [WorkflowStates.AWAITING_REVIEW]: [
      WorkflowStates.WORK_IN_PROGRESS, // Return to work-in-progress if changes needed
      WorkflowStates.REVIEWED, // Approve after review
    ],
    [WorkflowStates.REVIEWED]: [
      WorkflowStates.WORK_IN_PROGRESS, // Reopen for edits if needed
    ],
    [WorkflowStates.STATIC]: [], // Static objects cannot transition to other states
  };

  // Check if the transition is allowed
  return allowedTransitions[fromState]?.includes(toState) || false;
};

/**
 * Check if an object is transitioning from work-in-progress to awaiting-review
 * @param {Object} newObject - The updated object state
 * @param {Object} oldObject - The previous object state
 * @returns {boolean} - True if the object is transitioning to awaiting-review
 */
const isTransitioningToReview = (newObject, oldObject) => {
  const newState = newObject?.workspace?.workflow?.state;
  const oldState = oldObject?.workspace?.workflow?.state;

  return (
    newState === WorkflowStates.AWAITING_REVIEW && oldState === WorkflowStates.WORK_IN_PROGRESS
  );
};

module.exports = {
  WorkflowStates,
  isValidStateTransition,
  isTransitioningToReview,
};
