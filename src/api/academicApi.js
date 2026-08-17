import apiClient from './client';

/**
 * ====================================================================
 * ACADEMIC API SERVICE (Production Deployment Ready)
 * ====================================================================
 * Hierarchy: School -> Department -> Programme -> Batch -> CourseOffering
 * Real PostgreSQL Database & Spring Boot REST API integration.
 */

// Helper to normalize wrapper response
export const wrapApiResponse = (data, message = 'Success', success = true) => ({
  success,
  message,
  data,
});

// ── 1. SCHOOLS ─────────────────────────────────────────────────────────────
export const getSchools = async (directorEmail) => {
  const url = directorEmail ? `/academic/schools?directorEmail=${encodeURIComponent(directorEmail)}` : '/academic/schools';
  return await apiClient.get(url);
};

export const getSchool = async (schoolId) => {
  return await apiClient.get(`/academic/schools/${schoolId}`);
};

export const createSchool = async (data) => {
  return await apiClient.post('/academic/schools', data);
};

export const updateSchool = async (schoolId, data) => {
  return await apiClient.put(`/academic/schools/${schoolId}`, data);
};

export const deleteSchool = async (schoolId) => {
  return await apiClient.delete(`/academic/schools/${schoolId}`);
};

// ── 2. DEPARTMENTS ─────────────────────────────────────────────────────────
export const getDepartments = async (schoolId) => {
  const url = schoolId ? `/academic/departments?schoolId=${encodeURIComponent(schoolId)}` : '/academic/departments';
  return await apiClient.get(url);
};

export const getDepartment = async (departmentId) => {
  return await apiClient.get(`/academic/departments/${departmentId}`);
};

export const createDepartment = async (data) => {
  return await apiClient.post('/academic/departments', data);
};

export const updateDepartment = async (departmentId, data) => {
  return await apiClient.put(`/academic/departments/${departmentId}`, data);
};

export const deleteDepartment = async (departmentId) => {
  return await apiClient.delete(`/academic/departments/${departmentId}`);
};

// ── 3. PROGRAMMES ──────────────────────────────────────────────────────────
export const getProgrammes = async (arg1, arg2, arg3) => {
  let params = new URLSearchParams();
  if (typeof arg1 === 'object' && arg1 !== null) {
    if (arg1.departmentId) params.append('departmentId', arg1.departmentId);
    if (arg1.schoolId) params.append('schoolId', arg1.schoolId);
    if (arg1.directorEmail) params.append('directorEmail', arg1.directorEmail);
    if (arg1.coordinatorEmail) params.append('coordinatorEmail', arg1.coordinatorEmail);
    if (arg1.email) params.append('email', arg1.email);
  } else {
    const deptId = typeof arg1 === 'string' && arg1 && !arg1.includes('@') && !arg1.startsWith('sch-')
      ? arg1
      : (typeof arg2 === 'string' && arg2 && !arg2.includes('@') && !arg2.startsWith('sch-') ? arg2 : '');
    const schoolId = typeof arg1 === 'string' && arg1.startsWith('sch-')
      ? arg1
      : (typeof arg2 === 'string' && arg2.startsWith('sch-') ? arg2 : '');
    const email = typeof arg3 === 'string' && arg3
      ? arg3
      : (typeof arg1 === 'string' && arg1.includes('@') ? arg1 : (typeof arg2 === 'string' && arg2.includes('@') ? arg2 : ''));

    if (deptId && deptId !== 'ALL') params.append('departmentId', deptId);
    if (schoolId) params.append('schoolId', schoolId);
    if (email) params.append('email', email);
  }
  const queryString = params.toString();
  const url = queryString ? `/academic/programmes?${queryString}` : '/academic/programmes';
  return await apiClient.get(url);
};

export const getProgramme = async (programmeId) => {
  return await apiClient.get(`/academic/programmes/${programmeId}`);
};

export const createProgramme = async (data) => {
  return await apiClient.post('/academic/programmes', data);
};

export const updateProgramme = async (programmeId, data) => {
  return await apiClient.put(`/academic/programmes/${programmeId}`, data);
};

export const deleteProgramme = async (programmeId) => {
  return await apiClient.delete(`/academic/programmes/${programmeId}`);
};

// ── 4. BATCHES (Central Cohort Context) ────────────────────────────────────
export const getBatches = async (programmeId) => {
  const url = programmeId ? `/academic/batches?programmeId=${encodeURIComponent(programmeId)}` : '/academic/batches';
  return await apiClient.get(url);
};

export const getBatch = async (batchId) => {
  return await apiClient.get(`/academic/batches/${batchId}`);
};

export const getBatchContext = async (batchId) => {
  return await apiClient.get(`/academic/batches/${batchId}/context`);
};

export const createBatch = async (data) => {
  return await apiClient.post('/academic/batches', data);
};

export const updateBatch = async (batchId, data) => {
  return await apiClient.put(`/academic/batches/${batchId}`, data);
};

export const deleteBatch = async (batchId) => {
  return await apiClient.delete(`/academic/batches/${batchId}`);
};

// ── 5. MASTER COURSES (Curriculum Templates) ───────────────────────────────
export const getCourses = async (programmeId) => {
  const url = programmeId ? `/academic/courses?programmeId=${encodeURIComponent(programmeId)}` : '/academic/courses';
  return await apiClient.get(url);
};

export const getCourse = async (courseId) => {
  return await apiClient.get(`/academic/courses/${courseId}`);
};

export const createCourse = async (data) => {
  return await apiClient.post('/academic/courses', data);
};

export const updateCourse = async (courseId, data) => {
  return await apiClient.put(`/academic/courses/${courseId}`, data);
};

export const deleteCourse = async (courseId) => {
  return await apiClient.delete(`/academic/courses/${courseId}`);
};

// ── 6. COURSE OFFERINGS (Batch-Specific Course Instances) ───────────────────
export const getCourseOfferings = async (batchId) => {
  const url = batchId ? `/academic/course-offerings?batchId=${encodeURIComponent(batchId)}` : '/academic/course-offerings';
  return await apiClient.get(url);
};

export const getCourseOffering = async (offeringId) => {
  return await apiClient.get(`/academic/course-offerings/${offeringId}`);
};

export const createCourseOffering = async (data) => {
  return await apiClient.post('/academic/course-offerings', data);
};

export const updateCourseOffering = async (offeringId, data) => {
  return await apiClient.put(`/academic/course-offerings/${offeringId}`, data);
};

export const deleteCourseOffering = async (offeringId) => {
  return await apiClient.delete(`/academic/course-offerings/${offeringId}`);
};

// ── 7. USERS / ROLES / COORDINATORS ─────────────────────────────────────────
export const extractUserList = (res) => {
  if (!res) return [];
  let raw = [];
  if (Array.isArray(res)) raw = res;
  else if (Array.isArray(res.data)) raw = res.data;
  else if (Array.isArray(res.data?.data)) raw = res.data.data;
  else if (Array.isArray(res.data?.content)) raw = res.data.content;
  else if (Array.isArray(res.data?.data?.content)) raw = res.data.data.content;
  else if (Array.isArray(res.data?.users)) raw = res.data.users;
  else if (Array.isArray(res.data?.data?.users)) raw = res.data.data.users;
  else if (Array.isArray(res.content)) raw = res.content;
  else if (Array.isArray(res.users)) raw = res.users;

  return raw
    .map((u, idx) => {
      if (!u) return null;
      if (typeof u === 'string') {
        return {
          id: `u-${idx}`,
          name: u,
          email: `${u.toLowerCase().replace(/[^a-z0-9]/g, '')}@dypiu.ac.in`,
          role: 'HOD',
        };
      }
      const name =
        u.name ||
        u.fullName ||
        u.displayName ||
        (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : '') ||
        u.username ||
        u.email ||
        `User ${idx + 1}`;

      const email = u.email || (u.username && u.username.includes('@') ? u.username : '');
      let role = u.role || u.userRole || '';
      if (Array.isArray(u.roles)) {
        role = u.roles.map((r) => (typeof r === 'string' ? r : r.name || r.role || '')).join(',');
      }
      return {
        id: u.id || u.userId || email || name,
        name,
        email,
        role: String(role).toUpperCase(),
        department: u.department || u.departmentName || '',
      };
    })
    .filter(Boolean);
};

export const getUsers = async (params = {}) => {
  let queryObj = {};
  if (typeof params === 'string') {
    queryObj = { role: params };
  } else if (typeof params === 'object' && params !== null) {
    queryObj = { ...params };
  }
  const query = new URLSearchParams(queryObj).toString();
  const qs = query ? `?${query}` : '';
  return await apiClient.get(`/academic/users${qs}`);
};

export const getFaculty = async () => {
  return getUsers({ role: 'FACULTY' });
};

export const getProgrammeCoordinators = async (programmeId) => {
  const params = { role: 'PROGRAMME_COORDINATOR' };
  if (programmeId) params.programmeId = programmeId;
  return getUsers(params);
};

// ── 8. STUDENTS (Cohort-Scoped) ────────────────────────────────────────────
export const getStudents = async (batchId) => {
  const url = batchId ? `/academic/batches/${encodeURIComponent(batchId)}/students` : '/academic/students';
  return await apiClient.get(url);
};

export const getStudent = async (studentId) => {
  return await apiClient.get(`/academic/students/${studentId}`);
};

export const createStudent = async (data) => {
  if (data?.batchId) {
    return await apiClient.post(`/academic/batches/${encodeURIComponent(data.batchId)}/students`, data);
  }
  return await apiClient.post('/academic/students', data);
};

export const updateStudent = async (studentId, data) => {
  return await apiClient.put(`/academic/students/${studentId}`, data);
};

export const deleteStudent = async (studentId) => {
  return await apiClient.delete(`/academic/students/${studentId}`);
};

export const importStudents = async (batchId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  if (batchId) formData.append('batchId', batchId);
  return await apiClient.post('/academic/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── 9. PROGRAMME OUTCOMES (PEO, PO, PSO) & TARGETS ─────────────────────────
export const getProgrammeOutcomes = async (programmeId) => {
  try {
    return await apiClient.get(`/academic/programmes/${programmeId}/outcomes`);
  } catch (err) {
    const [posRes, psosRes, peosRes] = await Promise.allSettled([
      apiClient.get(`/outcomes/programmes/${programmeId}/pos`),
      apiClient.get(`/outcomes/programmes/${programmeId}/psos`),
      apiClient.get(`/outcomes/programmes/${programmeId}/peos`),
    ]);
    const pos = posRes.status === 'fulfilled' ? (posRes.value?.data || posRes.value || []) : [];
    const psos = psosRes.status === 'fulfilled' ? (psosRes.value?.data || psosRes.value || []) : [];
    const peos = peosRes.status === 'fulfilled' ? (peosRes.value?.data || peosRes.value || []) : [];
    return wrapApiResponse({ programmeId, pos, psos, peos });
  }
};

export const saveProgrammeOutcomes = async (programmeId, data) => {
  try {
    return await apiClient.put(`/academic/programmes/${programmeId}/outcomes`, data);
  } catch (err) {
    if (data?.pos) await apiClient.post(`/outcomes/programmes/${programmeId}/pos`, data.pos);
    if (data?.psos) await apiClient.post(`/outcomes/programmes/${programmeId}/psos`, data.psos);
    if (data?.peos) await apiClient.post(`/outcomes/programmes/${programmeId}/peos`, data.peos);
    return wrapApiResponse({ programmeId, ...data, status: 'SAVED' });
  }
};

export const getProgrammeTargets = async (programmeId) => {
  try {
    return await apiClient.get(`/outcomes/programmes/${programmeId}/targets`);
  } catch (err) {
    return await apiClient.get(`/academic/programmes/${programmeId}/targets`);
  }
};

export const saveProgrammeTargets = async (programmeId, data) => {
  try {
    return await apiClient.post(`/outcomes/programmes/${programmeId}/targets`, data);
  } catch (err) {
    return await apiClient.put(`/academic/programmes/${programmeId}/targets`, data);
  }
};

// ── 10. COURSE OUTCOMES (COs) & MAPPINGS (Course Offering Scoped) ───────────
export const getCourseOutcomes = async (offeringId) => {
  try {
    return await apiClient.get(`/academic/course-offerings/${offeringId}/outcomes`);
  } catch (err) {
    return await apiClient.get(`/outcomes/courses/${offeringId}/cos`);
  }
};

export const saveCourseOutcomes = async (offeringId, data) => {
  try {
    return await apiClient.post(`/academic/course-offerings/${offeringId}/outcomes`, data);
  } catch (err) {
    const payload = Array.isArray(data) ? data : (data?.outcomes || data?.cos || []);
    return await apiClient.post(`/outcomes/courses/${offeringId}/cos`, payload);
  }
};

export const getCOPOMappings = async (offeringId) => {
  try {
    return await apiClient.get(`/academic/course-offerings/${offeringId}/mappings`);
  } catch (err) {
    return await apiClient.get(`/outcomes/courses/${offeringId}/mappings`);
  }
};

export const saveCOPOMappings = async (offeringId, data) => {
  try {
    return await apiClient.put(`/academic/course-offerings/${offeringId}/mappings`, data);
  } catch (err) {
    return await apiClient.post(`/outcomes/courses/${offeringId}/mappings`, data);
  }
};

// ── 11. ATTAINMENT CONFIGURATION (Master Course Level) ──────────────────────
export const getAttainmentConfiguration = async (courseId) => {
  try {
    return await apiClient.get(`/attainment/config/${courseId}`);
  } catch (err) {
    return await apiClient.get(`/academic/courses/${courseId}/attainment-configuration`);
  }
};

export const saveAttainmentConfiguration = async (courseId, data) => {
  try {
    return await apiClient.post(`/attainment/config/${courseId}`, data);
  } catch (err) {
    return await apiClient.put(`/academic/courses/${courseId}/attainment-configuration`, data);
  }
};

// ── 12. EVIDENCE UPLOADS (Marks & Surveys) ──────────────────────────────────
export const uploadCourseMarks = async (offeringId, file, thresholdPercentage = 45) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('thresholdPercentage', thresholdPercentage);
  try {
    return await apiClient.post(`/attainment/examination/${offeringId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } catch (err) {
    return await apiClient.post(`/academic/course-offerings/${offeringId}/marks/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
};

export const uploadCourseSurvey = async (offeringId, file, thresholdPercentage) => {
  const formData = new FormData();
  formData.append('file', file);
  if (thresholdPercentage !== undefined && thresholdPercentage !== null) {
    formData.append('thresholdPercentage', thresholdPercentage);
  }
  try {
    return await apiClient.post(`/attainment/survey/${offeringId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  } catch (err) {
    return await apiClient.post(`/academic/course-offerings/${offeringId}/survey/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
};

export const uploadProgrammeSurvey = async (programmeId, batchId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  try {
    return await apiClient.post(
      `/attainment/programmes/${programmeId}/batches/${batchId}/programme-survey/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  } catch (err) {
    return await apiClient.post(
      `/academic/programmes/${programmeId}/batches/${batchId}/programme-survey/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  }
};

// ── 13. DIRECTOR SUMMARY & SETUP PROGRESS ──────────────────────────────────
export const getDirectorSchoolSummaryApi = async (directorEmail) => {
  const url = directorEmail
    ? `/academic/director/school-summary?directorEmail=${encodeURIComponent(directorEmail)}`
    : '/academic/director/school-summary';
  return await apiClient.get(url);
};

export const getDepartmentSummaryApi = async (schoolId, directorEmail) => {
  const params = [];
  if (schoolId) params.push(`schoolId=${encodeURIComponent(schoolId)}`);
  if (directorEmail) params.push(`directorEmail=${encodeURIComponent(directorEmail)}`);
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  return await apiClient.get(`/academic/director/department-summary${qs}`);
};

export const getDirectorSetupProgressApi = async (schoolId, directorEmail) => {
  const params = [];
  if (schoolId) params.push(`schoolId=${encodeURIComponent(schoolId)}`);
  if (directorEmail) params.push(`directorEmail=${encodeURIComponent(directorEmail)}`);
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  return await apiClient.get(`/academic/director/setup-progress${qs}`);
};

export const updateDirectorSetupProgressApi = async (schoolId, currentStep) => {
  const sId = schoolId || '';
  const step = currentStep || 1;
  return await apiClient.post(`/academic/director/setup-progress?schoolId=${encodeURIComponent(sId)}&currentStep=${step}`);
};

// ── 14. HOD SUMMARY & SETUP PROGRESS ───────────────────────────────────────
export const getHodDepartmentSummaryApi = async (hodEmail) => {
  const url = hodEmail
    ? `/academic/hod/department-summary?hodEmail=${encodeURIComponent(hodEmail)}`
    : '/academic/hod/department-summary';
  return await apiClient.get(url);
};

export const getHodSetupProgressApi = async (departmentId, hodEmail) => {
  const params = [];
  if (departmentId) params.push(`departmentId=${encodeURIComponent(departmentId)}`);
  if (hodEmail) params.push(`hodEmail=${encodeURIComponent(hodEmail)}`);
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  return await apiClient.get(`/academic/hod/setup-progress${qs}`);
};

export const updateHodSetupProgressApi = async (departmentId, currentStep, hodEmail) => {
  const params = [];
  if (departmentId) params.push(`departmentId=${encodeURIComponent(departmentId)}`);
  if (currentStep) params.push(`currentStep=${currentStep}`);
  if (hodEmail) params.push(`hodEmail=${encodeURIComponent(hodEmail)}`);
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  return await apiClient.put(`/academic/hod/setup-progress${qs}`);
};

export const completeHodSetupApi = async (departmentId, hodEmail) => {
  const params = [];
  if (departmentId) params.push(`departmentId=${encodeURIComponent(departmentId)}`);
  if (hodEmail) params.push(`hodEmail=${encodeURIComponent(hodEmail)}`);
  const qs = params.length > 0 ? `?${params.join('&')}` : '';
  return await apiClient.post(`/academic/hod/setup-progress/complete${qs}`);
};
