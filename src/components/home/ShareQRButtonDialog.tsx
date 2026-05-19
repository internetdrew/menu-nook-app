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

const SHARE_TITLE = "Share menu";
const SHARE_DESCRIPTION = "Scan the QR code or copy the menu link.";
const TEXT_SWAP_DURATION_MS = 120;
const QR_HEIGHT_TRANSITION = {
  duration: 0.27,
  ease: [0.25, 1, 0.5, 1],
} as const;
const QR_CONTENT_TRANSITION = {
  duration: 0.27,
  ease: [0.26, 0.08, 0.25, 1],
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
            transition={{
              height: QR_HEIGHT_TRANSITION,
              opacity: QR_CONTENT_TRANSITION,
            }}
            className="my-3 flex justify-center"
          >
            <div className="bg-muted/40 rounded-md p-3">
              <motion.img
                src={publicUrl}
                alt="Menu QR Code"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={QR_CONTENT_TRANSITION}
                className="h-52 w-52"
              />
            </div>
          </motion.div>
        ) : !isLoading && !publicUrl ? (
          <motion.p
            key="qr-error"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: QR_HEIGHT_TRANSITION,
              opacity: QR_CONTENT_TRANSITION,
            }}
            className="text-muted-foreground my-3 text-center text-sm"
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
        className="flex-1"
        onClick={handleCopyLink}
        disabled={actionsDisabled || copied}
      >
        <Copy />
        <span className="inline-flex min-w-20 overflow-hidden">
          <span
            ref={copyLabelRef}
            className={`t-text-swap ${copyLabelClass}`.trim()}
          >
            {copyLabel}
          </span>
        </span>
      </Button>
      <Button
        variant="outline"
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
          <DrawerHeader className="px-6 pt-6 pb-2 text-left">
            <DrawerTitle>{SHARE_TITLE}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {SHARE_DESCRIPTION}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6">{qrCode}</div>
          <DrawerFooter className="px-6 pt-2 pb-6">{QRActions}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{SHARE_TITLE}</DialogTitle>
          <DialogDescription className="sr-only">
            {SHARE_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        {qrCode}
        <DialogFooter>{QRActions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareQRButtonDialog;
