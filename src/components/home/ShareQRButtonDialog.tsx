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
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";

interface ShareQRButtonDialogProps {
  activeMenuId: string;
  activeMenuName: string;
}

const TEXT_SWAP_DURATION_MS = 120;

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

  const handleDownload = async () => {
    if (!data?.public_url) return;

    setIsDownloading(true);
    try {
      const response = await fetch(data.public_url);
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
    if (!data?.public_url) return;

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

  if (isLoading) {
    return <Skeleton className="ml-auto h-10 w-28" />;
  }

  const trigger = (
    <Button variant="ghost">
      <QrCode />
      Share
    </Button>
  );

  const qrCode = (
    <div className="my-4 flex justify-center">
      {data?.public_url ? (
        <img src={data.public_url} alt="Menu QR Code" className="h-52 w-52" />
      ) : (
        <p className="text-muted-foreground text-center text-sm">
          Unable to generate QR code.
        </p>
      )}
    </div>
  );

  const QRActions = (
    <div className="flex w-full flex-col gap-2">
      <Button
        variant="outline"
        className="flex-1"
        onClick={handleCopyLink}
        disabled={copied}
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
        disabled={isDownloading}
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
