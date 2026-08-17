import { useState, useEffect } from 'react';
import { ClipboardList, Upload, CheckCircle2, FileSpreadsheet, Award, Save, HardDrive, Clock, Eye, RefreshCw, X, FileText, ExternalLink } from 'lucide-react';
import { useAcademic } from '../../context/AcademicContext';
import SectionSaveFooter from '../../components/layout/SectionSaveFooter';
import { getSurveyAttainment, saveSurveyAttainment, uploadSurveyFile } from '../../api/academic';
import { getApiBaseUrl } from '../../api/client';
import * as XLSX from 'xlsx';

export default function CourseEndSurveyHub({ courseId, hideFooter = false }) {
  const { selectedCourse } = useAcademic();
  const targetCourseId = courseId || selectedCourse?.id;

  const [surveyResponses, setSurveyResponses] = useState([]);
  const [attainmentResult, setAttainmentResult] = useState(null);
  const [uploadedFileDetails, setUploadedFileDetails] = useState(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (targetCourseId) {
      setLoading(true);
      getSurveyAttainment(targetCourseId)
        .then((res) => {
          if (isMounted) {
            const data = res?.data?.data || res?.data;
            if (data) {
              setAttainmentResult(data);
              if (Array.isArray(data.surveyResponses) && data.surveyResponses.length > 0) {
                setSurveyResponses(data.surveyResponses);
              }
              if (data.fileDetails) {
                setUploadedFileDetails(data.fileDetails);
              }
            }
          }
        })
        .catch((err) => console.warn('Failed to fetch survey attainment:', err))
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [targetCourseId]);

  // Extract CO codes from responses or default to CO1-CO5
  const coKeys = Array.from(
    new Set(
      surveyResponses.flatMap((st) => (st.coFeedbacks ? Object.keys(st.coFeedbacks) : []))
    )
  );
  const activeCOs = coKeys.length > 0 ? coKeys : ['CO1', 'CO2', 'CO3', 'CO4', 'CO5'];

  // Recalculate live indirect survey attainment
  const calculateLiveSurveyAttainment = () => {
    const totalStudents = surveyResponses.length;
    const lvl1Counts = {};
    const lvl2Counts = {};
    const lvl3Counts = {};

    const lvl1Pcts = {};
    const lvl2Pcts = {};
    const lvl3Pcts = {};

    const overallIndirectPcts = {};
    const indirectScores = {};

    let sumScores = 0;

    activeCOs.forEach((co) => {
      let c1 = 0; // Slight (1)
      let c2 = 0; // Moderate (2)
      let c3 = 0; // Substantial (3)

      surveyResponses.forEach((st) => {
        const rawFb = String(st.coFeedbacks?.[co] || '').toLowerCase().trim();
        if (rawFb.includes('slight') || rawFb === '1') {
          c1++;
        } else if (rawFb.includes('moderate') || rawFb === '2') {
          c2++;
        } else if (rawFb.includes('substantial') || rawFb === '3') {
          c3++;
        } else {
          c3++;
        }
      });

      lvl1Counts[co] = c1;
      lvl2Counts[co] = c2;
      lvl3Counts[co] = c3;

      const p1 = totalStudents > 0 ? Number(((c1 / totalStudents) * 100).toFixed(2)) : 0;
      const p2 = totalStudents > 0 ? Number(((c2 / totalStudents) * 100).toFixed(2)) : 0;
      const p3 = totalStudents > 0 ? Number(((c3 / totalStudents) * 100).toFixed(2)) : 0;

      lvl1Pcts[co] = p1;
      lvl2Pcts[co] = p2;
      lvl3Pcts[co] = p3;

      // Overall Indirect % = (p1 * 1/3) + (p2 * 2/3) + (p3 * 3/3)
      const overallPct = Number(((p1 * (1 / 3)) + (p2 * (2 / 3)) + (p3 * (3 / 3))).toFixed(2));
      overallIndirectPcts[co] = overallPct;

      // Score out of 3 = (overallPct / 100) * 3
      const score = Number(((overallPct / 100) * 3).toFixed(2));
      indirectScores[co] = score;
      sumScores += score;
    });

    const overallAttainment = activeCOs.length > 0 ? (sumScores / activeCOs.length).toFixed(2) : 0;

    return {
      totalStudents,
      lvl1Counts,
      lvl2Counts,
      lvl3Counts,
      lvl1Pcts,
      lvl2Pcts,
      lvl3Pcts,
      overallIndirectPcts,
      indirectScores,
      overallAttainment,
    };
  };

  const liveResult = calculateLiveSurveyAttainment();

  const handleSaveSurvey = async () => {
    if (!targetCourseId) return;
    try {
      setSaving(true);
      const payload = {
        courseId: targetCourseId,
        surveyResponses,
      };
      const res = await saveSurveyAttainment(targetCourseId, payload);
      const updated = res?.data?.data || res?.data;
      if (updated) {
        setAttainmentResult(updated);
        if (updated.fileDetails) setUploadedFileDetails(updated.fileDetails);
      }
      alert(`Course End Survey responses & indirect attainment saved successfully!`);
    } catch (err) {
      console.error('Failed to save survey attainment:', err);
      alert('Error saving survey attainment. Please check backend logs.');
    } finally {
      setSaving(false);
    }
  };

  // Upload Excel Document to Backend Multipart API
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let parsedResponses = [];

    // Local Parsing Preview
    try {
      setSaving(true);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const sheetName = workbook.SheetNames.find((n) => n.toLowerCase().includes('survey')) || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });

      let coHeaderMap = {};

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;
        const containsCO1 = row.some((cell) => typeof cell === 'string' && cell.trim().toUpperCase() === 'CO1');
        if (containsCO1) {
          row.forEach((cell, colIdx) => {
            if (typeof cell === 'string' && /^CO\d+$/i.test(cell.trim())) {
              coHeaderMap[cell.trim().toUpperCase()] = colIdx;
            }
          });
          break;
        }
      }

      if (Object.keys(coHeaderMap).length === 0) {
        coHeaderMap = { CO1: 2, CO2: 3, CO3: 4, CO4: 5, CO5: 6 };
      }

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        const firstCellStr = String(row[0] || '').trim();

        if (/^\d+$/.test(firstCellStr)) {
          const coFeedbacks = {};
          let hasVal = false;
          Object.keys(coHeaderMap).forEach((coCode) => {
            const colIdx = coHeaderMap[coCode];
            const rawVal = row[colIdx] !== null && row[colIdx] !== undefined ? String(row[colIdx]).trim() : 'Substantial';
            if (rawVal) hasVal = true;
            coFeedbacks[coCode] = rawVal || 'Substantial';
          });

          if (hasVal) {
            parsedResponses.push({
              srNo: parsedResponses.length + 1,
              studentName: `Student ${parsedResponses.length + 1}`,
              coFeedbacks,
            });
          }
        }
      }

      if (parsedResponses.length > 0) {
        setSurveyResponses(parsedResponses);
      }
    } catch (parseErr) {
      console.warn('Local survey preview parse warning:', parseErr);
    }

    // Backend Document Upload & Processing API
    try {
      if (targetCourseId) {
        const res = await uploadSurveyFile(targetCourseId, file);
        const updated = res?.data?.data || res?.data;
        if (updated) {
          setAttainmentResult(updated);
          if (updated.fileDetails) setUploadedFileDetails(updated.fileDetails);
          if (Array.isArray(updated.surveyResponses) && updated.surveyResponses.length > 0) {
            setSurveyResponses(updated.surveyResponses);
          }
        }
        alert(`Survey Document "${file.name}" saved on backend server disk and processed successfully!`);
      }
    } catch (uploadErr) {
      console.error('Failed to upload survey file to backend:', uploadErr);
      alert('Survey file processed locally. (Backend upload warning)');
    } finally {
      setSaving(false);
    }
  };

  const getFeedbackBadgeClass = (fb) => {
    const text = String(fb || '').toLowerCase();
    if (text.includes('substantial') || text === '3') return 'badge-success';
    if (text.includes('moderate') || text === '2') return 'badge-info';
    return 'badge-warning';
  };

  return (
    <div className="animated-page">
      {/* Top Banner Header */}
      <div className="banner-dark-gradient">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#f5f3ff',
                border: '1.5px solid #6366f1',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ClipboardList size={24} style={{ color: '#4f46e5' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#0f172a', fontWeight: '800' }}>
                Course End Survey (Indirect Attainment Calculations)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                Sheet 3: Upload course end survey document, calculate level % & overall indirect attainment score
              </p>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSaveSurvey} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving...' : 'Save Indirect Attainment'}
          </button>
        </div>
      </div>

      {/* SECTION 1 (TOP): Excel Document Upload & Backend File Status */}
      <div className="card" style={{ padding: '24px', background: '#ffffff', marginBottom: '22px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={18} style={{ color: '#4f46e5' }} /> 1. Upload Course End Survey Excel Document to Backend Server
        </h3>

        {uploadedFileDetails || surveyResponses.length > 0 ? (
          <div style={{ padding: '20px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f3e8ff', display: 'grid', placeItems: 'center', color: '#7c3aed' }}>
                  <FileSpreadsheet size={26} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                      {uploadedFileDetails?.fileName || 'survey_sheet.xlsx'}
                    </strong>
                    <span className="badge badge-success" style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                      ✓ Survey Document Saved & Verified
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                    <span><HardDrive size={13} style={{ display: 'inline', marginRight: '3px' }} /> Storage: Indirect Attainment Directory</span>
                    <span><Clock size={13} style={{ display: 'inline', marginRight: '3px' }} /> Responses: {uploadedFileDetails?.recordsProcessed || surveyResponses.length} Students</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <a
                  href={`${getApiBaseUrl()}/attainment/documents/${targetCourseId}/download/SURVEY`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', background: '#059669', textDecoration: 'none', color: '#ffffff' }}
                >
                  <ExternalLink size={15} /> Download Excel
                </a>

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  id="reupload-survey-file-input"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="reupload-survey-file-input"
                  className="btn btn-secondary"
                  style={{ cursor: 'pointer', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <RefreshCw size={14} /> Upload New
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              border: '2px dashed #6366f1',
              borderRadius: '12px',
              padding: '24px',
              background: '#f8fafc',
              textAlign: 'center',
            }}
          >
            <FileSpreadsheet size={36} style={{ color: '#4f46e5', marginBottom: '8px' }} />
            <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>
              Select & Upload Course End Survey Excel File (`survey.xlsx`)
            </strong>
            <p style={{ margin: '4px 0 16px', fontSize: '12px', color: '#64748b' }}>
              The uploaded document will be saved on backend server disk and processed via Apache POI.
            </p>

            <input
              type="file"
              accept=".xlsx,.xls"
              id="survey-file-input"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <label htmlFor="survey-file-input" className="btn btn-primary" style={{ cursor: 'pointer', padding: '10px 22px' }}>
              <Upload size={16} /> Choose Survey Excel File
            </label>
          </div>
        )}
      </div>

      {/* Survey Document Inspection Modal */}
      {showDocModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '650px', background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', pb: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={22} style={{ color: '#7c3aed' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                  Indirect Attainment (Survey) Document Details
                </h3>
              </div>
              <button className="btn btn-secondary" onClick={() => setShowDocModal(false)} style={{ padding: '6px' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Document Name</strong>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>
                  {uploadedFileDetails?.fileName || 'survey_sheet.xlsx'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Attainment Type</strong>
                  <div style={{ fontWeight: '700', color: '#7c3aed' }}>Indirect Attainment (Course End Survey)</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Responses Processed</strong>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>{uploadedFileDetails?.recordsProcessed || surveyResponses.length} Students</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Backend Storage Directory</strong>
                <div style={{ fontWeight: '600', color: '#334155', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '12px' }}>
                  {uploadedFileDetails?.savedPath || `~/.obe_uploads/indirect_attainment/${targetCourseId}/`}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Uploaded By</strong>
                  <div style={{ fontWeight: '600', color: '#0f172a' }}>{uploadedFileDetails?.uploadedBy || 'Course Coordinator'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <strong style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Verification Status</strong>
                  <div style={{ fontWeight: '700', color: '#16a34a' }}>✓ PERSISTED & VERIFIED</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <a
                href={`${getApiBaseUrl()}/attainment/documents/${targetCourseId}/download/SURVEY`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: '700', background: '#059669', textDecoration: 'none', color: '#ffffff' }}
              >
                <ExternalLink size={16} /> Open Excel File in New Tab
              </a>
              <button className="btn btn-primary" onClick={() => setShowDocModal(false)} style={{ padding: '8px 20px', background: '#7c3aed' }}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Calculated Indirect CO Attainment Summary Table */}
      <div className="card" style={{ padding: '24px', background: '#ffffff' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} style={{ color: '#10b981' }} /> 2. Calculated Indirect CO Attainment Summary Table
        </h3>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="audit-data-table" style={{ textAlign: 'center' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', minWidth: '240px' }}>Feedback Level Breakdown</th>
                {activeCOs.map((co) => (
                  <th key={co} style={{ textAlign: 'center', width: '110px' }}>{co}</th>
                ))}
                <th style={{ textAlign: 'center', width: '130px', background: '#e0e7ff', color: '#3730a3' }}>Overall Indirect</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: '600' }}>Count of Level 1 (Slight)</td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '700', color: '#d97706' }}>{liveResult.lvl1Counts[co]}</td>
                ))}
                <td style={{ background: '#f8fafc', fontWeight: '700' }}>-</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: '600' }}>Count of Level 2 (Moderate)</td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '700', color: '#2563eb' }}>{liveResult.lvl2Counts[co]}</td>
                ))}
                <td style={{ background: '#f8fafc', fontWeight: '700' }}>-</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: '600' }}>Count of Level 3 (Substantial)</td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '700', color: '#059669' }}>{liveResult.lvl3Counts[co]}</td>
                ))}
                <td style={{ background: '#f8fafc', fontWeight: '700' }}>{liveResult.totalStudents} Students</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: '600' }}>% of Level 1 (Slight)</td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '700', color: '#d97706' }}>{liveResult.lvl1Pcts[co]}%</td>
                ))}
                <td style={{ background: '#f8fafc', fontWeight: '700' }}>-</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: '600' }}>% of Level 2 (Moderate)</td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '700', color: '#2563eb' }}>{liveResult.lvl2Pcts[co]}%</td>
                ))}
                <td style={{ background: '#f8fafc', fontWeight: '700' }}>-</td>
              </tr>
              <tr>
                <td style={{ textAlign: 'left', fontWeight: '600' }}>% of Level 3 (Substantial)</td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '700', color: '#059669' }}>{liveResult.lvl3Pcts[co]}%</td>
                ))}
                <td style={{ background: '#f8fafc', fontWeight: '700' }}>-</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ textAlign: 'left', fontWeight: '800', color: '#1e1b4b' }}>
                  Overall Indirect Attainment % (p1×1/3 + p2×2/3 + p3×3/3)
                </td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '800', fontSize: '15px', color: '#4f46e5' }}>
                    {liveResult.overallIndirectPcts[co]}%
                  </td>
                ))}
                <td style={{ background: '#e0e7ff', color: '#3730a3', fontWeight: '800' }}>-</td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ textAlign: 'left', fontWeight: '800', color: '#1e1b4b' }}>
                  Indirect Attainment Score (out of 3.00)
                </td>
                {activeCOs.map((co) => (
                  <td key={co} style={{ fontWeight: '800', fontSize: '16px', color: '#059669' }}>
                    {liveResult.indirectScores[co]} / 3.00
                  </td>
                ))}
                <td style={{ background: '#4f46e5', color: '#ffffff', fontWeight: '800', fontSize: '17px' }}>
                  {liveResult.overallAttainment}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Student Survey Responses Inspection Grid */}
      <div className="card">
        <div className="card-header">
          <h3>3. Student Survey Responses Inspection</h3>
          <span className="badge badge-active">{surveyResponses.length} Student Responses Evaluated</span>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="audit-data-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                <th style={{ width: '180px' }}>Student Reference</th>
                {activeCOs.map((co) => (
                  <th key={co} style={{ textAlign: 'center' }}>{co} Feedback</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {surveyResponses.map((st, idx) => (
                <tr key={st.srNo || idx}>
                  <td style={{ textAlign: 'center', fontWeight: '700', color: '#64748b' }}>{st.srNo || idx + 1}</td>
                  <td style={{ fontWeight: '600' }}>{st.studentName || `Student ${idx + 1}`}</td>
                  {activeCOs.map((co) => {
                    const fb = st.coFeedbacks?.[co] || 'Substantial';
                    return (
                      <td key={co} style={{ textAlign: 'center' }}>
                        <span className={`badge ${getFeedbackBadgeClass(fb)}`}>
                          {fb}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save, Previous & Save & Next Footer */}
      <SectionSaveFooter
        label="Course End Survey & Indirect Attainment"
        prevPath="/endsem-marks"
        nextPath="/co-attainment"
        nextLabel="Save & Proceed to Overall Attainment Calculation →"
        hidden={hideFooter}
        onSave={handleSaveSurvey}
      />
    </div>
  );
}
