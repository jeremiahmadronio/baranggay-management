/**
 * Offline Indicator
 *
 * A sleek, non-intrusive banner that appears when the app is offline
 * and shows sync progress when coming back online.
 */

import { useState, useEffect } from 'react';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Database,
} from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';
import { getAllPendingRequests, type PendingRequest } from '../service/offline/offlineDb';

export function OfflineIndicator() {
  const { isOnline, syncStatus, pendingCount, triggerSync } = useNetwork();
  const [expanded, setExpanded] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingRequest[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // Show banner logic
  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
      setJustSynced(false);
    } else if (syncStatus === 'success') {
      setShowBanner(true);
      setJustSynced(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
        setJustSynced(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else if (syncStatus === 'syncing') {
      setShowBanner(true);
    } else if (syncStatus === 'error') {
      setShowBanner(true);
    } else if (pendingCount > 0) {
      setShowBanner(true);
    } else if (wasOffline && isOnline && pendingCount === 0 && syncStatus === 'idle') {
      const timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, syncStatus, wasOffline]);

  // Load pending items when expanded
  useEffect(() => {
    if (expanded) {
      getAllPendingRequests().then(setPendingItems).catch(() => {});
    }
  }, [expanded, pendingCount]);

  if (!showBanner && pendingCount === 0) return null;

  const getBannerConfig = () => {
    if (!isOnline) {
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        icon: <WifiOff className="w-4 h-4" />,
        text: 'Working Offline',
        subtext: pendingCount > 0
          ? `${pendingCount} change${pendingCount > 1 ? 's' : ''} saved locally — will sync when back online`
          : 'Using cached data. Changes will be saved locally and synced later.',
        secondaryIcon: <Database className="w-3.5 h-3.5" />,
        secondaryText: 'Data from local cache',
      };
    }

    if (syncStatus === 'syncing') {
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: 'Syncing offline changes to server...',
        subtext: `${pendingCount} remaining`,
      };
    }

    if (syncStatus === 'error') {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-rose-500',
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'Some changes failed to sync',
        subtext: 'Click retry to try again',
      };
    }

    if (justSynced || syncStatus === 'success') {
      return {
        bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
        icon: <Check className="w-4 h-4" />,
        text: 'Back online — all changes synced to server!',
        subtext: 'Data is now up to date.',
      };
    }

    if (pendingCount > 0) {
      return {
        bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
        icon: <Database className="w-4 h-4" />,
        text: `${pendingCount} change${pendingCount > 1 ? 's' : ''} pending sync`,
        subtext: 'Click sync to push to server',
      };
    }

    if (wasOffline && isOnline) {
      return {
        bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
        icon: <Wifi className="w-4 h-4" />,
        text: 'Connection restored!',
        subtext: '',
      };
    }

    return null;
  };

  const config = getBannerConfig();
  if (!config) return null;

  return (
    <div
      className={`${config.bg} text-white shadow-lg transition-all duration-300 z-50`}
      style={{
        animation: 'slideDown 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Main Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm shrink-0">
            {config.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{config.text}</p>
            {config.subtext && (
              <p className="text-xs text-white/80 truncate">{config.subtext}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* Retry/Sync Button */}
          {isOnline && pendingCount > 0 && syncStatus !== 'syncing' && (
            <button
              onClick={triggerSync}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Now
            </button>
          )}

          {/* Expand/collapse pending details */}
          {pendingCount > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="View pending changes"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Expanded: pending items list */}
      {expanded && pendingItems.length > 0 && (
        <div className="border-t border-white/20">
          <div className="px-4 py-2 max-w-screen-2xl mx-auto space-y-1.5 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Pending Changes (saved locally)
            </p>
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-1.5 px-3 rounded-md bg-white/10 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-[10px] uppercase shrink-0">
                    {item.method}
                  </span>
                  <span className="font-medium truncate">{item.description}</span>
                </div>
                <div className="flex items-center gap-3 text-white/60 shrink-0 ml-2">
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  {item.retryCount > 0 && (
                    <span className="text-amber-200">
                      {item.retryCount} retries
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
