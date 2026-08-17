import apiClient from './client';

/**
 * ====================================================================
 * ATTAINMENT API SERVICE (Production Deployment Ready)
 * ====================================================================
 * Single Source of Truth for Attainment Calculations
 * Real PostgreSQL Database & Spring Boot REST API integration.
 */

// ── 1. COURSE-LEVEL ATTAINMENT (By Course Offering) ─────────────────────────
export const getCourseAttainment = async (courseOfferingId) => {
  return await apiClient.get(`/attainment/course/${courseOfferingId}`);
};

// ── 2. PROGRAMME & BATCH-LEVEL ATTAINMENT (Cohort Scoped) ───────────────────
export const getProgrammeBatchAttainment = async (programmeId, batchId) => {
  return await apiClient.get(`/attainment/programme/${programmeId}/batch/${batchId}`);
};

export const getProgrammeBatchDataset = async (programmeId, batchId) => {
  return await apiClient.get(`/attainment/programme/${programmeId}/batch/${batchId}/dataset`);
};

export const getProgrammeAverageMapping = async (programmeId, batchId) => {
  return await apiClient.get(`/attainment/programme/${programmeId}/batch/${batchId}/average-mapping`);
};

export const getProgrammeAverageDirect = async (programmeId, batchId) => {
  return await apiClient.get(`/attainment/programme/${programmeId}/batch/${batchId}/average-direct`);
};

export const getProgrammeAverageIndirect = async (programmeId, batchId) => {
  return await apiClient.get(`/attainment/programme/${programmeId}/batch/${batchId}/average-indirect`);
};

export const getProgrammeOverallAttainment = async (programmeId, batchId) => {
  return await apiClient.get(`/attainment/programme/${programmeId}/batch/${batchId}/overall`);
};

export const getProgrammeSemestersAttainment = async (programmeId, batchId) => {
  return await apiClient.get(`/attainment/programme/${programmeId}/batch/${batchId}/semesters`);
};
