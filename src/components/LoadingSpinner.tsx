import { motion } from "motion/react";

const LoadingSpinner = ({
  size = "page",
  className = "",
}: {
  size?: "page" | "button";
  className?: string;
}) => {
  return (
    <div className={`loading-spinner-container ${className}`} data-size={size}>
      <motion.div
        className="loading-spinner"
        animate={{ transform: "rotate(360deg)" }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <StyleSheet />
    </div>
  );
};

function StyleSheet() {
  return (
    <style>
      {`
            .loading-spinner-container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 40px;
                border-radius: 8px;
            }

            .loading-spinner {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 4px solid var(--divider);
                border-top-color: var(--hue-1);
                will-change: transform;
            }

            .loading-spinner-container[data-size="button"] {
                padding: 0;
                border-radius: 999px;
            }

            .loading-spinner-container[data-size="button"] .loading-spinner {
                width: 16px;
                height: 16px;
                border-width: 2px;
            }
            `}
    </style>
  );
}

export default LoadingSpinner;
