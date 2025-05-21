export default function AgentButton({ agent, onClick }) {
    return (
        <div
            key={agent.id}
            className="flex items-center bg-white border border-gray-300 rounded-full px-3 py-1 text-sm transition-colors hover:bg-[#4123d8] hover:text-white cursor-pointer"
            onClick={onClick}
        >
            {agent.name}
        </div>
    );
}
