export default function AgentButton({ agent, onClick, children, loading }) {
    const displayName = children || (agent && agent.agent_name);
    
    return (
        <div
            key={agent?.id}
            className={`inline-flex items-center bg-white border border-[#4123d8] rounded-full px-3 py-1 text-sm transition-colors hover:bg-[#4123d8] hover:text-white cursor-pointer min-w-fit whitespace-nowrap w-auto ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={loading ? undefined : onClick}
        >
            {loading ? (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                </div>
            ) : (
                displayName
            )}
        </div>
    );
}
