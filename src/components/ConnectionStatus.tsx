import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { ConnectionStatus as ConnectionStatusType } from '../types';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status }) => {
  const getConnectionIcon = () => {
    if (!status.isOnline) return <WifiOff className="text-red-400" size={20} />;
    if (status.speed === 'slow') return <Wifi className="text-yellow-400" size={20} />;
    return <Wifi className="text-green-400" size={20} />;
  };

  const getConnectionText = () => {
    if (!status.isOnline) return 'Offline';
    if (status.speed === 'slow') return 'Low';
    return 'Good';
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <div className="flex items-center gap-2">
        {getConnectionIcon()}
        <span>{getConnectionText()}</span>
      </div>
    </div>
  );
};