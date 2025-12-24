import React, { useState } from 'react';
import { AppProvider } from '@/lib/store';
import { Sidebar, MobileSidebar } from '@/components/Sidebar';
import { ToolDetails } from '@/components/ToolDetails';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

export default function Home() {
  const [sidebarWidth, setSidebarWidth] = useState(20);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Desktop Layout */}
      <div className="hidden md:flex flex-1 h-full">
         <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="min-w-[250px]">
               <Sidebar className="h-full w-full border-r-0" />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
               <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                  <ToolDetails />
               </main>
            </ResizablePanel>
         </ResizablePanelGroup>
      </div>

      {/* Mobile Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative md:hidden">
         <ToolDetails />
      </main>
    </div>
  );
}
