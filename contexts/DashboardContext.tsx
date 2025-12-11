import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface TabDefinition {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface DashboardContextType {
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    tabs: TabDefinition[];
    setTabs: (tabs: TabDefinition[]) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    const [tabs, setTabs] = useState<TabDefinition[]>([]);

    return (
        <DashboardContext.Provider value={{ activeTab, setActiveTab, tabs, setTabs }}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};
