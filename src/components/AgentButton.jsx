export default function AgentButton({ agent, onClick, children }) {
    const displayName = children || (agent && agent.agent_name);
    
    return (
        <div
            key={agent?.id}
            className="inline-flex items-center bg-white border border-gray-300 rounded-full px-3 py-1 text-sm transition-colors hover:bg-[#4123d8] hover:text-white cursor-pointer min-w-fit whitespace-nowrap w-auto"
            onClick={onClick}
        >
            {displayName}
        </div>
    );
}
