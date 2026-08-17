import apiClient from './client';

/**
 * ====================================================================
 * APPROVALS API SERVICE (Production Deployment Ready)
 * ====================================================================
 * Real PostgreSQL Database & Spring Boot REST API integration.
 */

export const getPendingApprovals = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await apiClient.get(`/approvals/pending${query ? `?${query}` : ''}`);
};

export const getApprovalDetails = async (approvalId) => {
  return await apiClient.get(`/approvals/${approvalId}`);
};

export const approveItem = async (approvalId, comments = '') => {
  return await apiClient.post(`/approvals/${approvalId}/approve`, { comments });
};

export const requestRevision = async (approvalId, remarks = '') => {
  return await apiClient.post(`/approvals/${approvalId}/request-revision`, { remarks, comments: remarks });
};

export const getApprovalHistory = async (approvalId) => {
  return await apiClient.get(`/approvals/${approvalId}/history`);
};
