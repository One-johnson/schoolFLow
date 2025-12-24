'use client'

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, ArrowRight } from "lucide-react";
import Link from "next/link";

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasShown, setHasShown] = useState<boolean>(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent): void => {
      if (e.clientY <= 0 && !hasShown) {
        setIsOpen(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-4">
              <Gift className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Wait! Don't Miss Out</DialogTitle>
          <DialogDescription className="text-center">
            Get our free School Management Guide and see how SchoolFlow can transform your institution
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="w-full"
            />
          </div>
          
          <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600">
            Download Free Guide
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Or start using SchoolFlow now:</p>
            <Link href="/register">
              <Button variant="outline" className="w-full">
                Start Free Trial
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
