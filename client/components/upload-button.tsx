import { useState } from "react";
import styles from "./upload-button.module.css";

interface UploadButtonProps {
  onClick: () => void;
  dark?: boolean;
  uploadedUrl?: string;
}

export default function UploadButton({
  onClick,
  dark = true,
  uploadedUrl,
}: UploadButtonProps): JSX.Element {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = (): void => {
    setIsHovered(true);
  };

  const handleMouseLeave = (): void => {
    setIsHovered(false);
  };

  return (
    <button
      className={`${styles["upload-button"]} ${dark ? styles["dark"] : ""} ${
        isHovered ? styles["hovered"] : ""
      }`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {uploadedUrl ? (
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5,16.5L16.5,7.5M7.5,7.5h9v9"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 16V7.75735"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.75735 12L12 7.75735L16.2426 12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.75735V16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <span>{uploadedUrl ? "View on Web3" : "Upload"}</span>
    </button>
  );
}
