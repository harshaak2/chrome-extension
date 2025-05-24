import React from 'react';

const AppTile = ({ action, onSelect }) => {
    // Extract app logo URL from the action data
    // For now, we'll use a placeholder or derive from appid
    const getAppLogo = (appid) => {
        // You can map specific app IDs to their logos here
        // For now, using a default placeholder
        return `/qb_icon.svg`; // Default to QB icon
    };

    const handleClick = () => {
        if (onSelect) {
            onSelect(action);
        }
    };

    return (
        <div
            className="app-tile cursor-pointer p-4 border rounded-lg hover:shadow-md transition-all duration-200 bg-white hover:bg-gray-50"
            onClick={handleClick}
            title={action.title || action.desc}
        >
            <div className="flex flex-col items-center justify-center">
                <img
                    src={getAppLogo(action.appid)}
                    alt={action.title || 'App'}
                    className="w-12 h-12 mb-2"
                    onError={(e) => {
                        // Fallback to default icon if image fails to load
                        e.target.src = '/qb_icon.svg';
                    }}
                />
                <div className="text-sm font-medium text-center text-gray-700">
                    {action.title}
                </div>
            </div>
        </div>
    );
};

export default AppTile;