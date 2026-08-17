/**
 * ====================================================================
 * UNIFIED ACADEMIC API EXPORT & ADAPTER (Master Contract Aligned)
 * ====================================================================
 * Re-exports all modular API functions for full contract compliance
 * and provides robust compatibility adapters for all existing modules.
 */

export * from './academicApi';
export * from './attainmentApi';
export * from './reportsApi';
export * from './approvalApi';
export * from './dashboardApi';

import apiClient, { getApiBaseUrl } from './client';

import {
  getSchools,
  getSchool,
  createSchool,
  updateSchool,
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  getProgrammes,
  getProgramme,
  createProgramme,
  updateProgramme,
  getBatches,
  getBatch,
  createBatch,
  updateBatch,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  getCourseOfferings,
  getCourseOffering,
  createCourseOffering,
  updateCourseOffering,
  getUsers,
  extractUserList,
  getFaculty,
  getProgrammeCoordinators,
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  importStudents,
  getProgrammeOutcomes,
  saveProgrammeOutcomes,
  getProgrammeTargets,
  saveProgrammeTargets,
  getCourseOutcomes,
  saveCourseOutcomes,
  getCOPOMappings,
  saveCOPOMappings,
  getAttainmentConfiguration,
  saveAttainmentConfiguration,
  uploadCourseMarks,
  uploadCourseSurvey,
  uploadProgrammeSurvey,
} from './academicApi';

import {
  getCourseAttainment,
  getProgrammeBatchAttainment,
  getProgrammeBatchDataset,
  getProgrammeAverageMapping,
  getProgrammeAverageDirect,
  getProgrammeAverageIndirect,
  getProgrammeOverallAttainment,
} from './attainmentApi';

import {
  getCourseAtr,
  saveCourseAtr,
  submitCourseAtr,
  getProgrammeAtr,
  saveProgrammeAtr,
  submitProgrammeAtr,
} from './reportsApi';

import {
  getDirectorDashboard,
  getHodDashboard,
  getProgrammeCoordinatorDashboard,
  getCourseCoordinatorDashboard,
  getRoleSetupProgress,
  updateRoleSetupProgress,
} from './dashboardApi';

// ── Role User Helpers ───────────────────────────────────────────────────────
export const getUsersByRole = async (role) => {
  try {
    const res = await getUsers(role ? { role } : {});
    const list = extractUserList(res);
    if (Array.isArray(list) && list.length > 0) return list;
  } catch (err) {
    console.warn('[academic.js] getUsersByRole error:', err);
  }
  return [];
};

// ── Course & Outcome Helpers ────────────────────────────────────────────────
export const getCourseCOs = (offeringOrCourseId) => getCourseOutcomes(offeringOrCourseId);
export const saveCourseCOs = (offeringOrCourseId, data) => saveCourseOutcomes(offeringOrCourseId, data);

export const getCOMatrix = (offeringOrCourseId) => getCOPOMappings(offeringOrCourseId);
export const saveCOMatrix = (offeringOrCourseId, data) => saveCOPOMappings(offeringOrCourseId, data);
export const getCourseMappings = (offeringOrCourseId) => getCOPOMappings(offeringOrCourseId);
export const saveCourseMappings = (offeringOrCourseId, data) => saveCOPOMappings(offeringOrCourseId, data);

export const saveCourse = (data) => (data?.id ? updateCourse(data.id, data) : createCourse(data));
export const deleteCourse = (courseId) => apiClient.delete(`/academic/courses/${courseId}`);

export const getProgrammePOs = async (programmeId) => {
  try {
    const res = await apiClient.get(`/outcomes/programmes/${programmeId}/pos`);
    const list = res?.data || res || [];
    return { data: Array.isArray(list) ? list : (list.pos || []), pos: Array.isArray(list) ? list : (list.pos || []) };
  } catch (err) {
    const res = await getProgrammeOutcomes(programmeId);
    const list = res?.data?.pos || res?.pos || res?.data?.data?.pos || (Array.isArray(res?.data) ? res.data : []);
    return { data: list, pos: list };
  }
};

export const getProgrammePSOs = async (programmeId) => {
  try {
    const res = await apiClient.get(`/outcomes/programmes/${programmeId}/psos`);
    const list = res?.data || res || [];
    return { data: Array.isArray(list) ? list : (list.psos || []), psos: Array.isArray(list) ? list : (list.psos || []) };
  } catch (err) {
    const res = await getProgrammeOutcomes(programmeId);
    const list = res?.data?.psos || res?.psos || res?.data?.data?.psos || (Array.isArray(res?.data) ? res.data : []);
    return { data: list, psos: list };
  }
};

export const getProgrammePEOs = async (programmeId) => {
  try {
    const res = await apiClient.get(`/outcomes/programmes/${programmeId}/peos`);
    const list = res?.data || res || [];
    return { data: Array.isArray(list) ? list : (list.peos || []), peos: Array.isArray(list) ? list : (list.peos || []) };
  } catch (err) {
    const res = await getProgrammeOutcomes(programmeId);
    const list = res?.data?.peos || res?.peos || res?.data?.data?.peos || (Array.isArray(res?.data) ? res.data : []);
    return { data: list, peos: list };
  }
};

// ── School & Department Setup Helpers ───────────────────────────────────────
export const saveSchoolInfo = async (data) => {
  const targetId = data?.id || data?.schoolId;
  const payload = {
    ...data,
    name: data.name || data.schoolName || '',
    schoolName: data.name || data.schoolName || '',
    code: (data.code || data.schoolCode || '').toUpperCase(),
    schoolCode: (data.code || data.schoolCode || '').toUpperCase(),
    director: data.director || data.directorName || data.dean || '',
    directorName: data.director || data.directorName || data.dean || '',
    dean: data.director || data.directorName || data.dean || '',
    directorEmail: data.directorEmail || data.email || '',
    email: data.directorEmail || data.email || '',
  };

  if (targetId) {
    try {
      return await updateSchool(targetId, payload);
    } catch (err) {
      console.warn('[saveSchoolInfo] PUT failed, fallback to POST:', err);
      try {
        return await createSchool({ ...payload, id: targetId });
      } catch (err2) {
        throw err;
      }
    }
  } else {
    return createSchool(payload);
  }
};

export const saveDepartment = async (data) => {
  const targetId = data?.id || data?.deptId;
  const payload = {
    ...data,
    name: data.name || data.deptName || '',
    deptName: data.name || data.deptName || '',
    code: (data.code || data.deptCode || '').toUpperCase(),
    deptCode: (data.code || data.deptCode || '').toUpperCase(),
    hod: data.hod || data.deptHodName || data.hodName || 'Unassigned',
    deptHodName: data.hod || data.deptHodName || data.hodName || 'Unassigned',
    hodName: data.hod || data.deptHodName || data.hodName || 'Unassigned',
    hodEmail: data.hodEmail || data.deptHodEmail || '',
    deptHodEmail: data.hodEmail || data.deptHodEmail || '',
  };

  if (targetId) {
    try {
      return await updateDepartment(targetId, payload);
    } catch (err) {
      console.warn('[saveDepartment] PUT failed, fallback to POST:', err);
      try {
        return await createDepartment({ ...payload, id: targetId });
      } catch (err2) {
        throw err;
      }
    }
  } else {
    return createDepartment(payload);
  }
};

export const deleteDepartment = (departmentId) => apiClient.delete(`/academic/departments/${departmentId}`);
export const saveProgramme = async (data) => {
  console.log('[academicApi] saveProgramme called | ID:', data?.id, '| coordinator:', data?.coordinator, '| email:', data?.coordinatorEmail);
  if (data?.id) {
    try {
      const res = await updateProgramme(data.id, data);
      console.log('[academicApi] updateProgramme SUCCESS:', res);
      return res;
    } catch (err) {
      console.warn('[saveProgramme] PUT failed, fallback to POST:', err);
      try {
        const res2 = await createProgramme(data);
        console.log('[academicApi] createProgramme SUCCESS:', res2);
        return res2;
      } catch (err2) {
        throw err;
      }
    }
  } else {
    return createProgramme(data);
  }
};
export const deleteProgramme = (programmeId) => apiClient.delete(`/academic/programmes/${programmeId}`);

// ── Evidence & Attainment Upload Helpers ────────────────────────────────────
export const getExaminationAttainment = async (offeringId) => {
  try {
    const res = await apiClient.get(`/attainment/examination/${offeringId}`);
    if (res) return res;
  } catch (e) {
    return getCourseAttainment(offeringId);
  }
};
export const saveExaminationAttainment = (offeringId, data) => apiClient.post(`/attainment/examination/${offeringId}`, data);
export const uploadExaminationFile = async (offeringId, file, threshold) => {
  const formData = new FormData();
  formData.append('file', file);
  if (threshold !== undefined && threshold !== null) formData.append('thresholdPercentage', threshold);
  return apiClient.post(`/attainment/examination/${offeringId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getUploadedDocuments = (offeringId) => apiClient.get(`/attainment/documents/${offeringId}`);

export const getSurveyAttainment = async (offeringId) => {
  try {
    const res = await apiClient.get(`/attainment/survey/${offeringId}`);
    if (res) return res;
  } catch (e) {
    return getCourseAttainment(offeringId);
  }
};
export const saveSurveyAttainment = (offeringId, data) => apiClient.post(`/attainment/survey/${offeringId}`, data);
export const uploadSurveyFile = async (offeringId, file, threshold) => {
  const formData = new FormData();
  formData.append('file', file);
  if (threshold !== undefined && threshold !== null) formData.append('thresholdPercentage', threshold);
  return apiClient.post(`/attainment/survey/${offeringId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── Batch & Student Helpers ────────────────────────────────────────────────
export const saveBatch = (data) => (data?.id ? updateBatch(data.id, data) : createBatch(data));
export const deleteBatch = (batchId) => apiClient.delete(`/academic/batches/${batchId}`);
export const getStudentsByBatch = (batchId) => getStudents(batchId);
export const saveStudent = (data) => (data?.id ? updateStudent(data.id, data) : createStudent(data));
export const deleteStudent = (studentId) => apiClient.delete(`/academic/students/${studentId}`);

// ── Coordinator & Target Helpers ───────────────────────────────────────────
export const saveProgrammeCoordinator = (progId, coordId) => {
  const payload = typeof coordId === 'object' ? coordId : { coordinator: coordId, coordinatorId: coordId };
  console.log('[academicApi] saveProgrammeCoordinator called | progId:', progId, '| payload:', payload);
  return apiClient.put(`/academic/programmes/${progId}/coordinator`, payload);
};
export const saveProgrammePOs = (progId, pos) => {
  const payload = Array.isArray(pos) ? pos : (pos?.pos || []);
  return apiClient.post(`/outcomes/programmes/${progId}/pos`, payload);
};
export const saveProgrammePSOs = (progId, psos) => {
  const payload = Array.isArray(psos) ? psos : (psos?.psos || []);
  return apiClient.post(`/outcomes/programmes/${progId}/psos`, payload);
};
export const saveProgrammePEOs = (progId, peos) => {
  const payload = Array.isArray(peos) ? peos : (peos?.peos || []);
  return apiClient.post(`/outcomes/programmes/${progId}/peos`, payload);
};
export const saveProgrammeTargetLevels = (progId, data) => saveProgrammeTargets(progId, data);
export const getProgrammeTargetLevels = (progId) => getProgrammeTargets(progId);

export const getCourseCombinedAttainment = (offeringId) => getCourseAttainment(offeringId);
export const saveCourseCombinedAttainment = (offeringId, data) => saveCourseAtr(data);

// ── ATR Helpers ─────────────────────────────────────────────────────────────
export const getCourseAtrData = (offeringId) => getCourseAtr(offeringId);
export const saveCourseAtrData = (offeringId, data) => saveCourseAtr(data);
export const submitCourseAtrForApproval = (atrId, comments) => submitCourseAtr(atrId, comments);

export const getProgrammeAtrData = (programmeId, batchId) => getProgrammeAtr(programmeId, batchId);
export const saveProgrammeAtrData = (programmeId, batchId, data) => saveProgrammeAtr(data);
export const submitProgrammeAtrForApproval = (atrId, comments, progId, batchId) => submitProgrammeAtr(atrId, comments, progId, batchId);
export const getPreviousBatchProgrammeAtr = (programmeId, batchId) => getProgrammeAtr(programmeId, batchId);

// ── Dashboard & Summary Helpers ─────────────────────────────────────────────
export const getDirectorSchoolSummary = (directorEmail) => getDirectorDashboard(directorEmail);
export const getDepartmentSummary = (schoolId, directorEmail) => getHodDashboard(schoolId, directorEmail);
export const getHodDepartmentSummary = (hodEmail) => getHodDashboard(hodEmail);
export const getProgrammeCoordinatorSummary = (progId) => getProgrammeCoordinatorDashboard(progId);
export const getCourseCoordinatorSummary = (offeringId) => getCourseCoordinatorDashboard(offeringId);

// ── Setup Progress Helpers ──────────────────────────────────────────────────
export const getDirectorSetupProgress = (identifierOrEmail, optionalId) => {
  const id = optionalId || identifierOrEmail || '';
  return getRoleSetupProgress('DIRECTOR', id);
};

export const updateDirectorSetupProgress = (arg1, arg2, arg3) => {
  let identifier = '';
  let step = 1;
  if (typeof arg1 === 'number') {
    step = arg1;
    identifier = typeof arg2 === 'string' ? arg2 : '';
  } else {
    identifier = typeof arg1 === 'string' ? arg1 : '';
    step = typeof arg2 === 'number' ? arg2 : (typeof arg3 === 'number' ? arg3 : 1);
  }
  return updateRoleSetupProgress('DIRECTOR', identifier, step);
};

export const getHodSetupProgress = (identifierOrEmail, optionalId) => {
  const id = optionalId || identifierOrEmail || '';
  return getRoleSetupProgress('HOD', id);
};

export const updateHodSetupProgress = (arg1, arg2, arg3) => {
  let identifier = '';
  let step = 1;
  if (typeof arg1 === 'number') {
    step = arg1;
    identifier = typeof arg2 === 'string' ? arg2 : '';
  } else {
    identifier = typeof arg1 === 'string' ? arg1 : '';
    step = typeof arg2 === 'number' ? arg2 : (typeof arg3 === 'number' ? arg3 : 1);
  }
  return updateRoleSetupProgress('HOD', identifier, step);
};

export const completeHodSetup = (identifier, email) => updateRoleSetupProgress('HOD', identifier || email || '', 6);

export const getProgrammeCoordinatorSetupProgress = (identifierOrEmail, optionalId) => {
  const id = optionalId || identifierOrEmail || '';
  return getRoleSetupProgress('PROGRAMME_COORDINATOR', id);
};

export const updateProgrammeCoordinatorSetupProgress = (arg1, arg2, arg3) => {
  let identifier = '';
  let step = 1;
  if (typeof arg1 === 'number') {
    step = arg1;
    identifier = typeof arg2 === 'string' ? arg2 : '';
  } else {
    identifier = typeof arg1 === 'string' ? arg1 : '';
    step = typeof arg2 === 'number' ? arg2 : (typeof arg3 === 'number' ? arg3 : 1);
  }
  return updateRoleSetupProgress('PROGRAMME_COORDINATOR', identifier, step);
};

export const completeProgrammeCoordinatorSetup = (identifier, email) => updateRoleSetupProgress('PROGRAMME_COORDINATOR', identifier || email || '', 6);

export const getCourseCoordinatorSetupProgress = (identifierOrEmail, optionalId) => {
  const id = optionalId || identifierOrEmail || '';
  return getRoleSetupProgress('COURSE_COORDINATOR', id);
};

export const updateCourseCoordinatorSetupProgress = (arg1, arg2, arg3) => {
  let identifier = '';
  let step = 1;
  if (typeof arg1 === 'number') {
    step = arg1;
    identifier = typeof arg2 === 'string' ? arg2 : '';
  } else {
    identifier = typeof arg1 === 'string' ? arg1 : '';
    step = typeof arg2 === 'number' ? arg2 : (typeof arg3 === 'number' ? arg3 : 1);
  }
  return updateRoleSetupProgress('COURSE_COORDINATOR', identifier, step);
};

export const completeCourseCoordinatorSetup = (identifier, email) => updateRoleSetupProgress('COURSE_COORDINATOR', identifier || email || '', 6);

// ── Export Download Helpers ─────────────────────────────────────────────────
export const downloadAttainmentExcel = (courseOfferingOrCourseId, batchId) => {
  const query = batchId ? `?batchId=${encodeURIComponent(batchId)}` : '';
  const url = `${getApiBaseUrl()}/attainment/export/excel/${encodeURIComponent(courseOfferingOrCourseId)}${query}`;
  window.open(url, '_blank');
  return Promise.resolve();
};

export const downloadAttainmentPdf = (courseOfferingOrCourseId, batchId) => {
  const query = batchId ? `?batchId=${encodeURIComponent(batchId)}` : '';
  const url = `${getApiBaseUrl()}/attainment/export/pdf/${encodeURIComponent(courseOfferingOrCourseId)}${query}`;
  window.open(url, '_blank');
  return Promise.resolve();
};
