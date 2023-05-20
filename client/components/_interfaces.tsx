
export interface VideoMetadata {
    cid: string;
    title: string;
    size: number;
    url: string;
    description: string;
    duration: number;
    likeCount: number;
    viewCount: number;
    thumbnail: string;
}

export interface PaginationProps {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
}