// Turn bookkeeping for the per-turn debate:stance_update broadcast.
// actualTurn is the zero-based count of turns already completed.
export function stanceTurnInfo(actualTurn, agentCount) {
  return {
    currentTurn: actualTurn + 1,
    currentRound: Math.floor(actualTurn / agentCount) + 1,
    agentIndex: actualTurn % agentCount,
  };
}
