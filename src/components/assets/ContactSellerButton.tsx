"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactSellerButtonProps {
  assetTitle: string;
  sellerName: string;
}

/**
 * Dialog shell for the inquiry flow — the message form itself
 * is scope of Task 05.
 */
export function ContactSellerButton({
  assetTitle,
  sellerName,
}: ContactSellerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Contact seller</Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact seller</DialogTitle>
          <DialogDescription>
            Send an inquiry about “{assetTitle}” to {sellerName}.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          The inquiry form (message + sending) arrives in the next task — this
          dialog already knows the asset and the seller.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
