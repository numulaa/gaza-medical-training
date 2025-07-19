import { useState, useEffect } from 'react';
import { ConnectionStatus } from '../types';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    speed: 'fast',
    dataUsed: 0,
    batteryLevel: undefined
  });

  useEffect(() => {
    const updateOnlineStatus = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        speed: navigator.onLine ? 'fast' : 'offline'
      }));
    };

    const getBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          setConnectionStatus(prev => ({
            ...prev,
            batteryLevel: Math.round(battery.level * 100)
          }));
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    // Simulate data usage tracking
    const updateDataUsage = () => {
      setConnectionStatus(prev => ({
        ...prev,
        dataUsed: prev.dataUsed + 0.1
      }));
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    getBatteryInfo();
    const dataInterval = setInterval(updateDataUsage, 10000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(dataInterval);
    };
  }, []);

  return connectionStatus;
};