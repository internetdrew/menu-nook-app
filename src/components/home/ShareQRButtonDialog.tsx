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
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Copy, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";

interface ShareQRButtonDialogProps {
  activeMenuId: string;
  activeMenuName: string;
}

const ShareQRButtonDialog = ({
  activeMenuId,
  activeMenuName,
}: ShareQRButtonDialogProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timeout = copyTimeoutRef.current;
    return () => {
      if (timeout) {
        clearTimeout(timeout);
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

  const handleCopyLink = async () => {
    if (!data?.public_url) return;

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/menu/${activeMenuId}`,
      );

      setCopied(true);

      copyTimeoutRef.current = window.setTimeout(() => {
        setCopied(false);
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto">Share Menu</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Your QR Code</DialogTitle>
          <DialogDescription>
            Put your camera over the QR code to open your menu.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 flex justify-center">
          {data?.public_url ? (
            isLoading ? (
              <Skeleton className="h-52 w-52" />
            ) : (
              <img src={data.public_url} alt="QR Code" className="h-52 w-52" />
            )
          ) : (
            <p className="text-muted-foreground text-center text-sm">
              Unable to generate QR code.
            </p>
          )}
        </div>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
            <Button
              variant={"outline"}
              className="flex-1"
              onClick={handleCopyLink}
              disabled={copied}
            >
              {copied ? (
                "Link copied!"
              ) : (
                <span className="flex items-center gap-1">
                  <Copy /> Copy Link
                </span>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download /> Save QR Code
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareQRButtonDialog;
