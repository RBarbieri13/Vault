import React, { useState } from 'react';
import { Sidebar, MobileSidebar } from '@/components/Sidebar';
import { ToolTable } from '@/components/ToolTable';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile Sidebar */}
      <div className="md:hidden absolute top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[280px]">
            <Sidebar className="h-full border-none w-full" />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Layout - Fixed Sidebar as requested */}
      <div className="hidden md:flex h-full flex-shrink-0">
         <Sidebar className="h-full w-[280px]" />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
         <ToolTable />
      </main>
    </div>
  );
}
