// Fact checks, one line each. Each message is checked against stored facts
// (findClosestFact in server.js); the score is the match score the server sent.
const FactChecker = ({ factChecks = [], connected = false }) => {
    if (factChecks.length === 0) {
        return (
            <p className="section-note">
                {connected
                    ? 'No fact checks yet. Each message is checked against stored facts as it is recorded.'
                    : 'Not connected, so nothing is being checked.'}
            </p>
        );
    }
    return (
        <>
            <p className="section-note">Each message is checked against stored facts. The score is the match the server reported.</p>
            <ul className="fact-list">
                {factChecks.slice(-5).map((check) => (
                    <li key={check.id}>
                        <span className="fact-score">
                            {typeof check.score === 'number' ? `${(check.score * 100).toFixed(0)}%` : 'No score'}
                        </span>
                        <span>{check.fact}</span>
                    </li>
                ))}
            </ul>
        </>
    );
};

export default FactChecker;
