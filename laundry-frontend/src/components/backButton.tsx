"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Glow from "@/components/ui/glow";

export default function BackButton({ href = "/" }: { href?: string }) {
  return (
    <div className="fixed top-4 left-4 z-50">
      <div className="relative group isolate inline-block">
        <Glow roundedClass="rounded-full" />
        <Button asChild variant="outline" size="icon" className="relative z-10 rounded-full shadow-sm">
          <Link href={href} aria-label="Back to home">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
