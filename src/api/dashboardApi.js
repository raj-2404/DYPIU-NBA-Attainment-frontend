import apiClient from './client';

/**
 * ====================================================================
 * DASHBOARDS & PROGRESS API SERVICE (Production Deployment Ready)
 * ====================================================================
 * Real PostgreSQL Database & Spring Boot REST API integration.
 */

// ── 1. ROLE-SPECIFIC DASHBOARDS ─────────────────────────────────────────────
export const getDirectorDashboard = async (directorEmail) => {
  const url = directorEmail ? `/dashboard/director?directorEmail=${encodeURIComponent(directorEmail)}` : '/dashboard/director';
  return await apiClient.get(url);
};

export const getHodDashboard = async (deptIdOrParams, optionalEmail) => {
  let params = new URLSearchParams();
  if (typeof deptIdOrParams === 'object' && deptIdOrParams !== null) {
    if (deptIdOrParams.departmentId) params.append('departmentId', deptIdOrParams.departmentId);
    if (deptIdOrParams.email) params.append('email', deptIdOrParams.email);
    if (deptIdOrParams.hodEmail) params.append('hodEmail', deptIdOrParams.hodEmail);
  } else if (typeof deptIdOrParams === 'string' && deptIdOrParams) {
    if (deptIdOrParams.includes('@')) {
      params.append('email', deptIdOrParams);
    } else {
      params.append('departmentId', deptIdOrParams);
    }
  }
  if (optionalEmail && typeof optionalEmail === 'string') {
    params.append('email', optionalEmail);
  }
  const queryString = params.toString();
  const url = queryString ? `/dashboard/hod?${queryString}` : '/dashboard/hod';
  return await apiClient.get(url);
};

export const getProgrammeCoordinatorDashboard = async (programmeId) => {
  const url = programmeId ? `/dashboard/programme-coordinator?programmeId=${encodeURIComponent(programmeId)}` : '/dashboard/programme-coordinator';
  return await apiClient.get(url);
};

export const getCourseCoordinatorDashboard = async (courseOfferingId) => {
  const url = courseOfferingId ? `/dashboard/course-coordinator?courseOfferingId=${encodeURIComponent(courseOfferingId)}` : '/dashboard/course-coordinator';
  return await apiClient.get(url);
};

// ── 2. GUIDED SETUP PROGRESS ────────────────────────────────────────────────
export const getRoleSetupProgress = async (role, identifier) => {
  const endpointRole = String(role || '').toLowerCase().replace(/_/g, '-');
  const url = identifier
    ? `/academic/${endpointRole}/setup-progress?id=${encodeURIComponent(identifier)}`
    : `/academic/${endpointRole}/setup-progress`;
  return await apiClient.get(url);
};

export const updateRoleSetupProgress = async (role, identifier, step) => {
  const endpointRole = String(role || '').toLowerCase().replace(/_/g, '-');
  return await apiClient.post(`/academic/${endpointRole}/setup-progress`, {
    identifier,
    step,
  });
};
