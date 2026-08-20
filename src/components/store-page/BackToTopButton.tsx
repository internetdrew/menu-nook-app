import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";
import { useNavigate } from "react-router";

type BackToTopButtonProps = {
  hash: string;
  navRef: RefObject<HTMLElement | null>;
  pathname: string;
  search: string;
};

const BackToTopButton = ({
  hash,
  navRef,
  pathname,
  search,
}: BackToTopButtonProps) => {
  const navigate = useNavigate();
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    let animationFrame: number | null = null;

    const updateScrollToTopVisibility = () => {
      if (animationFrame !== null) return;

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        const nav = navRef.current;
        const navBottom = nav
          ? nav.getBoundingClientRect().bottom + window.scrollY
          : 96;

        setShowScrollToTop(window.scrollY > navBottom);
      });
    };

    updateScrollToTopVisibility();
    window.addEventListener("scroll", updateScrollToTopVisibility, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollToTopVisibility);

    return () => {
      window.removeEventListener("scroll", updateScrollToTopVisibility);
      window.removeEventListener("resize", updateScrollToTopVisibility);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [navRef]);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (hash) {
      navigate(
        {
          pathname,
          search,
        },
        { replace: true, preventScrollReset: true },
      );
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });
    });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="sm"
      className={`fixed right-4 bottom-4 inline-flex items-center rounded-full text-xs shadow-lg motion-safe:transition-transform motion-safe:duration-300 ${
        showScrollToTop ? "translate-x-0" : "translate-x-40"
      }`}
      aria-label="Scroll to top"
    >
      <ArrowUp className="size-4" /> Back to top
    </Button>
  );
};

export default BackToTopButton;
