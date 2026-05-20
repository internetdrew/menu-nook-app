import { motion } from "motion/react";

const LoadingSpinner = () => {
  return (
    <div className="container">
      <motion.div
        className="spinner"
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
            .container {
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 40px;
                border-radius: 8px;
            }

            .spinner {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 4px solid var(--divider);
                border-top-color: var(--hue-1);
                will-change: transform;
            }
            `}
    </style>
  );
}

export default LoadingSpinner;
