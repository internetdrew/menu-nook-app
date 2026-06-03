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
import { Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

interface ShareQRButtonDialogProps {
  activeMenuId: string;
  activeMenuName: string;
  mode?: "share" | "launch-success";
  openOnMount?: boolean;
  onLaunchSuccessComplete?: () => void;
}

const SHARE_TITLE = "Share menu";
const SHARE_DESCRIPTION = "Scan the QR code or copy the menu link.";
const LAUNCH_SUCCESS_TITLE = "Your menu is live";
const LAUNCH_SUCCESS_DESCRIPTION =
  "Customers can now view it from this link or scan the QR code.";
const TEXT_SWAP_DURATION_MS = 120;
const QR_HEIGHT_TRANSITION = {
  duration: 0.27,
  ease: [0.25, 1, 0.5, 1],
} as const;
const QR_CONTENT_TRANSITION = {
  duration: 0.27,
  ease: [0.26, 0.08, 0.25, 1],
} as const;
const QR_REVEAL_DELAY_MS = 180;

const ShareQRButtonDialog = ({
  activeMenuId,
  activeMenuName,
  mode = "share",
  openOnMount = false,
  onLaunchSuccessComplete,
}: ShareQRButtonDialogProps) => {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy Link");
  const [copyLabelClass, setCopyLabelClass] = useState("");
  const [isQrImageReady, setIsQrImageReady] = useState(false);
  const [shouldRevealQr, setShouldRevealQr] = useState(false);
  const copyLabelRef = useRef<HTMLSpanElement>(null);
  const copyTimeoutRef = useRef<number | undefined>(undefined);
  const textSwapTimeoutRef = useRef<number | undefined>(undefined);
  const qrRevealTimeoutRef = useRef<number | undefined>(undefined);
  const autoOpenedMenuIdRef = useRef<string | null>(null);
  const title = mode === "launch-success" ? LAUNCH_SUCCESS_TITLE : SHARE_TITLE;
  const description =
    mode === "launch-success" ? LAUNCH_SUCCESS_DESCRIPTION : SHARE_DESCRIPTION;
  const menuUrl = `/menu/${activeMenuId}`;

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (textSwapTimeoutRef.current) {
        clearTimeout(textSwapTimeoutRef.current);
      }
      if (qrRevealTimeoutRef.current) {
        clearTimeout(qrRevealTimeoutRef.current);
      }
    };
  }, []);

  const openShareSurface = () => {
    if (qrRevealTimeoutRef.current) {
      clearTimeout(qrRevealTimeoutRef.current);
    }

    setShouldRevealQr(false);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (prefersReducedMotion) {
      setShouldRevealQr(true);
      return;
    }

    if (qrRevealTimeoutRef.current) {
      clearTimeout(qrRevealTimeoutRef.current);
    }

    qrRevealTimeoutRef.current = window.setTimeout(() => {
      setShouldRevealQr(true);
    }, QR_REVEAL_DELAY_MS);

    return () => {
      if (qrRevealTimeoutRef.current) {
        clearTimeout(qrRevealTimeoutRef.current);
      }
    };
  }, [open, prefersReducedMotion]);

  useEffect(() => {
    if (!openOnMount || autoOpenedMenuIdRef.current === activeMenuId) {
      return;
    }

    autoOpenedMenuIdRef.current = activeMenuId;
    openShareSurface();
  }, [activeMenuId, openOnMount]);

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
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${menuUrl}`,
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
    <Button
      variant="ghost"
      className="hover:bg-[#eee7dc]/80 focus-visible:bg-[#eee7dc]/80"
    >
      <QrCode />
      Share
    </Button>
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      openShareSurface();
      return;
    }

    if (qrRevealTimeoutRef.current) {
      clearTimeout(qrRevealTimeoutRef.current);
    }

    setShouldRevealQr(false);
    setOpen(false);

    if (!nextOpen && mode === "launch-success") {
      onLaunchSuccessComplete?.();
    }
  };

  const qrCode = (
    <div className="overflow-hidden">
      <AnimatePresence initial={false}>
        {open && shouldRevealQr && isQrImageReady && publicUrl ? (
          <motion.div
            key="qr-code"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{
              height: prefersReducedMotion
                ? { duration: 0 }
                : QR_HEIGHT_TRANSITION,
              opacity: prefersReducedMotion
                ? { duration: 0 }
                : QR_CONTENT_TRANSITION,
            }}
            className="my-3 flex justify-center"
          >
            <div className="bg-muted/40 rounded-md p-3">
              <motion.img
                src={publicUrl}
                alt="Menu QR Code"
                initial={
                  prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }
                }
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 0, scale: 0.96 }
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : QR_CONTENT_TRANSITION
                }
                className="h-52 w-52"
              />
            </div>
          </motion.div>
        ) : !isLoading && !publicUrl ? (
          <motion.p
            key="qr-error"
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{
              height: prefersReducedMotion
                ? { duration: 0 }
                : QR_HEIGHT_TRANSITION,
              opacity: prefersReducedMotion
                ? { duration: 0 }
                : QR_CONTENT_TRANSITION,
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
  const descriptionClassName =
    mode === "launch-success" ? undefined : "sr-only";

  const QRActions = (
    <div className="flex w-full flex-col gap-2">
      <Button className="flex-1" onClick={handleCopyLink} disabled={copied}>
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
      {mode === "launch-success" && (
        <Button asChild variant="outline" className="flex-1">
          <Link to={menuUrl}>
            <ExternalLink /> View Live Menu
          </Link>
        </Button>
      )}
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
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="px-6 pt-6 pb-2 text-left">
            <DrawerTitle className="text-base">{title}</DrawerTitle>
            <DrawerDescription className={descriptionClassName}>
              {description}
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6">{qrCode}</div>
          <DrawerFooter className="px-6 pt-2 pb-6">{QRActions}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription className={`${descriptionClassName} text-sm`}>
            {description}
          </DialogDescription>
        </DialogHeader>
        {qrCode}
        <DialogFooter>{QRActions}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareQRButtonDialog;
