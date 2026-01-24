import React, { useState, useEffect, useRef } from 'react';
import { useCommands } from '../renderer/contexts/ActionsContext';

interface MenuItem {
    label: string;
    action?: string;
    shortcut?: string;
    type?: 'separator' | 'item';
}

interface MenuSection {
    label: string;
    items: MenuItem[];
}

const MENU_STRUCTURE: MenuSection[] = [
    {
        label: 'File',
        items: [
            { label: 'New File', action: 'new', shortcut: 'Ctrl+N' },
            { label: 'Open File...', action: 'open', shortcut: 'Ctrl+O' },
            { label: 'separator', type: 'separator' },
            { label: 'Save', action: 'save', shortcut: 'Ctrl+S' },
            { label: 'separator', type: 'separator' },
            { label: 'Exit', action: 'exit' }
        ]
    },
    {
        label: 'Edit',
        items: [
            { label: 'Undo', action: 'undo', shortcut: 'Ctrl+Z' },
            { label: 'Redo', action: 'redo', shortcut: 'Ctrl+Y' },
            { label: 'separator', type: 'separator' },
            { label: 'Cut', action: 'cut', shortcut: 'Ctrl+X' },
            { label: 'Copy', action: 'copy', shortcut: 'Ctrl+C' },
            { label: 'Paste', action: 'paste', shortcut: 'Ctrl+V' }
        ]
    },
    {
        label: 'View',
        items: [
            { label: 'Toggle Sidebar', action: 'toggle-sidebar', shortcut: 'Ctrl+B' },
            { label: 'Zoom In', action: 'zoom-in', shortcut: 'Ctrl=+' },
            { label: 'Zoom Out', action: 'zoom-out', shortcut: 'Ctrl+-' }
        ]
    }
];

export const MenuBar: React.FC = () => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { dispatch } = useCommands();

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = (label: string) => {
        if (activeMenu === label) {
            setActiveMenu(null);
        } else {
            setActiveMenu(label);
        }
    };

    const handleItemClick = (action?: string) => {
        if(action) {
            dispatch(action); // we broadcast the action to listeners
        }
        setActiveMenu(null);
    };

    const handleMouseEnter = (label: string) => {
        if (activeMenu) {
            setActiveMenu(label);
        }
    };

    return (
        <nav ref={menuRef} className="flex items-center text-sm bg-ink-black border-b border-prussian-blue select-none sticky top-0 z-50">
           {/* Deep Sea Theme Application Title/Icon could go here. TODO: Get an application icon and put it here.*/}
           <div className="px-4 py-1 font-bold text-dusk-blue mr-2">
               PLERO
           </div>

            {MENU_STRUCTURE.map((menu) => (
                <div key={menu.label} className="relative">
                    <div
                        className={`px-3 py-1 cursor-pointer transition-colors duration-150 ${
                            activeMenu === menu.label 
                            ? 'bg-dusk-blue text-alabaster-grey' 
                            : 'text-lavender-grey hover:bg-prussian-blue hover:text-alabaster-grey'
                        }`}
                        onClick={() => handleMenuClick(menu.label)}
                        onMouseEnter={() => handleMouseEnter(menu.label)}
                    >
                        {menu.label}
                    </div>

                    {activeMenu === menu.label && (
                        <div className="absolute left-0 top-full min-w-[200px] bg-prussian-blue border border-dusk-blue shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {menu.items.map((item, index) => {
                                if (item.type === 'separator') {
                                    return <div key={index} className="h-px bg-dusk-blue my-1 mx-2 opacity-50" />;
                                }
                                return (
                                    <div
                                        key={index}
                                        className="px-4 py-1.5 hover:bg-dusk-blue text-alabaster-grey flex justify-between items-center cursor-pointer group"
                                        onClick={() => handleItemClick(item.action)}
                                    >
                                        <span>{item.label}</span>
                                        {item.shortcut && (
                                            <span className="text-lavender-grey text-xs group-hover:text-alabaster-grey ml-4 opacity-70">
                                                {item.shortcut}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </nav>
    );
};
