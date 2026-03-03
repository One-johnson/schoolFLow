"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MessageCircle, Phone, Mail } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/23355301044";
const PHONE_URL = "tel:+23355301044";

export function ContactFAB(): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon-lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
            aria-label="Contact options"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="top"
          sideOffset={12}
          className="w-48 p-2"
        >
          <div className="flex flex-col gap-1">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-green-600 dark:text-green-400"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </a>
            <a
              href={PHONE_URL}
              onClick={() => setOpen(false)}
            >
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Phone className="h-4 w-4" />
                Call
              </Button>
            </a>
            <Link href="/contact" onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
              >
                <Mail className="h-4 w-4" />
                Message
              </Button>
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
