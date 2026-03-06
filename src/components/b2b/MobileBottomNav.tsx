import React, { useState } from 'react';
import { Home, Users, UserSearch, ClipboardList, Settings, Bell, BarChart3, Grid3x3, MoreHorizontal, X } from 'lucide-react';

interface Permissions {
  canViewOverview: boolean;
  canManageUsers: boolean;
  canManageCandidates: boolean;
  canViewAssessments: boolean;
  canManageReminders: boolean;
  canUseWorkMatrix: boolean;
  canManageSettings: boolean;
}

interface MobileBottomNavProps {
  activeTab: string;
  onChange: (tab: string) => void;
  permissions: Permissions;
}

export default function MobileBottomNav({ activeTab, onChange, permissions }: MobileBottomNavProps) {
  const [showMore, setShowMore] = useState(false);

  // All available tabs
  const allTabs = [
    permissions.canViewOverview && { key: 'overview', label: 'Overview', icon: Home },
    permissions.canManageUsers && { key: 'users', label: 'Users', icon: Users },
    permissions.canManageCandidates && { key: 'hiring', label: 'Hiring', icon: UserSearch },
    permissions.canViewAssessments && { key: 'assessments', label: 'Assessments', icon: ClipboardList },
    permissions.canManageReminders && { key: 'reminders', label: 'Reminders', icon: Bell },
    permissions.canUseWorkMatrix && { key: 'matrix', label: 'Work Matrix', icon: Grid3x3 },
    permissions.canViewOverview && { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    permissions.canManageSettings && { key: 'settings', label: 'Settings', icon: Settings },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: React.ComponentType<{ className?: string }> }>;

  // Show first 4 tabs in bottom nav, rest in "More" menu
  const mainTabs = allTabs.slice(0, 4);
  const moreTabs = allTabs.slice(4);

  const handleTabClick = (key: string) => {
    onChange(key);
    setShowMore(false);
  };

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 sm:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu panel */}
      {showMore && moreTabs.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-50 sm:hidden px-4 pb-2">
          <div className="bg-background rounded-lg border shadow-lg p-2">
            <div className="flex items-center justify-between px-2 pb-2 border-b mb-2">
              <span className="text-sm font-medium">More Options</span>
              <button onClick={() => setShowMore(false)} className="p-1 rounded hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {moreTabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => handleTabClick(key)}
                  className={
                    `flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-md transition-colors ` +
                    (activeTab === key 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground')
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 inset-x-0 z-50 sm:hidden">
        <div className="bg-background/95 backdrop-blur border-t">
          <div className="grid grid-cols-5 gap-1 px-2 py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
            {mainTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => handleTabClick(key)}
                className={
                  `flex flex-col items-center justify-center gap-0.5 py-1 rounded-md transition-colors ` +
                  (activeTab === key ? 'text-primary' : 'text-muted-foreground hover:text-foreground')
                }
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] leading-tight">{label}</span>
              </button>
            ))}
            {/* More button */}
            {moreTabs.length > 0 && (
              <button
                onClick={() => setShowMore(!showMore)}
                className={
                  `flex flex-col items-center justify-center gap-0.5 py-1 rounded-md transition-colors ` +
                  (showMore || moreTabs.some(t => t.key === activeTab) 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground')
                }
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] leading-tight">More</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
