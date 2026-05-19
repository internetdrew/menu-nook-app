import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download, QrCode } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ShareQRButtonDialogProps {
  activeMenuId: string;
  activeMenuName: string;
}

const TEXT_SWAP_DURATION_MS = 120;
const QR_REVEAL_TRANSITION = {
  type: "spring",
  visualDuration: 0.32,
  bounce: 0.18,
} as const;

const ShareQRButtonDialog = ({
  activeMenuId,
  activeMenuName,
}: ShareQRButtonDialogProps) => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Link");
  const [copyLabelClass, setCopyLabelClass] = useState("");
  const [isQrImageReady, setIsQrImageReady] = useState(false);
  const copyLabelRef = useRef<HTMLSpanElement>(null);
  const copyTimeoutRef = useRef<number | undefined>(undefined);
  const textSwapTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (textSwapTimeoutRef.current) {
        clearTimeout(textSwapTimeoutRef.current);
      }
    };
  }, []);

  const { data, isLoading } = useQuery(
    trpc.menuQRCode.getPublicUrlForMenu.queryOptions(
      { menuId: activeMenuId },
      { enabled: !!activeMenuId },
    ),
  );
  const publicUrl = data?.public_url;

  useEffect(() => {
    setIsQrImageReady(false);

    if (!publicUrl) return;

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) {
        setIsQrImageReady(true);
      }
    };
    image.onerror = () => {
      if (!cancelled) {
        setIsQrImageReady(false);
      }
    };
    image.src = publicUrl;

    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  const handleDownload = async () => {
    if (!publicUrl) return;

    setIsDownloading(true);
    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeMenuName || "menu"}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("QR code downloaded");
    } catch (error) {
      console.error("Failed to download QR code:", error);
      toast.error("Download failed", {
        description: "Unable to download the QR code. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const swapCopyLabel = (nextLabel: string) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setCopyLabel(nextLabel);
      setCopyLabelClass("");
      return;
    }

    if (textSwapTimeoutRef.current) {
      clearTimeout(textSwapTimeoutRef.current);
    }

    setCopyLabelClass("is-exit");
    textSwapTimeoutRef.current = window.setTimeout(() => {
      setCopyLabel(nextLabel);
      setCopyLabelClass("is-enter-start");

      requestAnimationFrame(() => {
        void copyLabelRef.current?.offsetHeight;
        setCopyLabelClass("");
      });
    }, TEXT_SWAP_DURATION_MS);
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/menu/${activeMenuId}`,
      );

      setCopied(true);
      swapCopyLabel("Link copied!");

      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
        swapCopyLabel("Copy Link");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Copy failed", {
        description: "Unable to copy the link. Please try again.",
      });
    }
  };

  const trigger = (
    <Button variant="ghost">
      <QrCode />
      Share
    </Button>
  );

  const qrCode = (
    <div className="overflow-hidden">
      <AnimatePresence initial={false}>
        {isQrImageReady && publicUrl ? (
          <motion.div
            key="qr-code"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={QR_REVEAL_TRANSITION}
            className="my-4 flex justify-center"
          >
            <motion.img
              src={publicUrl}
              alt="Menu QR Code"
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              transition={QR_REVEAL_TRANSITION}
              className="h-52 w-52"
            />
          </motion.div>
        ) : !isLoading && !publicUrl ? (
          <motion.p
            key="qr-error"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={QR_REVEAL_TRANSITION}
            className="text-muted-foreground my-4 text-center text-sm"
          >
            Unable to generate QR code.
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );

  const actionsDisabled = !publicUrl;

  const QRActions = (
    <div className="flex w-full flex-col gap-2">
      <Button
        variant="outline"
        className="flex-1"
        onClick={handleCopyLink}
        disabled={actionsDisabled || copied}
      >
        <Copy />
        <span className="inline-flex min-w-20 justify-center overflow-hidden">
          <span
            ref={copyLabelRef}
            className={`t-text-swap ${copyLabelClass}`.trim()}
          >
            {copyLabel}
          </span>
        </span>
      </Button>
      <Button
        className="flex-1"
        onClick={handleDownload}
        disabled={actionsDisabled || isDownloading}
      >
        <Download /> Download QR Code
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Share Your Menu</DrawerTitle>
            <DrawerDescription>
              Put your camera over the QR code to open your menu or copy the
              link and paste into your browser.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">{qrCode}</div>
          <DrawerFooter>{QRActions}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Share Your Menu</DialogTitle>
          <DialogDescription>
            Put your camera over the QR code to open your menu or copy the link
            and paste into your browser.
          </DialogDescription>
        </DialogHeader>
        {qrCode}
        <DialogFooter>{QRActions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareQRButtonDialog;
