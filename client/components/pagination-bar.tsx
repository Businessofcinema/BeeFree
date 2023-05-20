import React from 'react';
import styles from './pagination-bar.module.css';

interface PaginationBarProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
}) => {
  const handlePrevClick = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextClick = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.paginationBar}>
      <button
        className={`${styles.arrowButton} ${currentPage === 1 && styles.disabled}`}
        onClick={handlePrevClick}
        disabled={currentPage === 1}
      >
        &larr;
      </button>
      <div className={styles.pageInfo}>
        Page {currentPage} of {totalPages}
      </div>
      <button
        className={`${styles.arrowButton} ${currentPage === totalPages && styles.disabled}`}
        onClick={handleNextClick}
        disabled={currentPage === totalPages}
      >
        &rarr;
      </button>
    </div>
  );
};

export default PaginationBar;
