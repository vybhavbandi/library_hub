package com.library.dto;

public class PaginationResponse {
    private int currentPage;
    private int totalPages;
    private long totalBooks;
    private int limit;
    private boolean hasNextPage;
    private boolean hasPrevPage;
    
    public PaginationResponse() {}
    
    public PaginationResponse(int currentPage, int totalPages, long totalBooks, int limit) {
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.totalBooks = totalBooks;
        this.limit = limit;
        this.hasNextPage = currentPage < totalPages;
        this.hasPrevPage = currentPage > 1;
    }
    
    public int getCurrentPage() {
        return currentPage;
    }
    
    public void setCurrentPage(int currentPage) {
        this.currentPage = currentPage;
    }
    
    public int getTotalPages() {
        return totalPages;
    }
    
    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
    
    public long getTotalBooks() {
        return totalBooks;
    }
    
    public void setTotalBooks(long totalBooks) {
        this.totalBooks = totalBooks;
    }
    
    public int getLimit() {
        return limit;
    }
    
    public void setLimit(int limit) {
        this.limit = limit;
    }
    
    public boolean isHasNextPage() {
        return hasNextPage;
    }
    
    public void setHasNextPage(boolean hasNextPage) {
        this.hasNextPage = hasNextPage;
    }
    
    public boolean isHasPrevPage() {
        return hasPrevPage;
    }
    
    public void setHasPrevPage(boolean hasPrevPage) {
        this.hasPrevPage = hasPrevPage;
    }
}
