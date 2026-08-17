import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage, login, register, requestPasswordReset, verifyOtp, resendOtp } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import { InlineSpinner } from "../../components/common/InlineSpinner";
import backgroundImage from "../../assets/images/dyp.jpeg";
import iqacLogo from "../../assets/images/IQAS.png";
import universityLogo from "../../assets/images/image.png";

export const dashboardForRole = (role) => {
  switch (role?.toUpperCase()) {
    case 'DIRECTOR':
      return '/director/dashboard';
    case 'HOD':
      return '/hod/dashboard';
    case 'PROGRAMME_COORDINATOR':
      return '/programme-coordinator/dashboard';
    case 'COURSE_COORDINATOR':
    case 'FACULTY':
    default:
      return '/dashboard';
  }
};

const normalizeInput = (value) => value.trim();
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginUser, getAccessToken } = useAuth();

  // Mode state
  const [isRegistering, setIsRegistering] = useState(false);

  // Login state
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(location.state?.message || "");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("FACULTY");
  const [regLoading, setRegLoading] = useState(false);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loginSessionId, setLoginSessionId] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(30);
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!mfaRequired) return;

    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [mfaRequired]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const storeSessionAndNavigate = (userData, token, refreshToken = '') => {
    const loggedUser = loginUser(userData, token, refreshToken);
    const targetDashboard = dashboardForRole(loggedUser.role);
    navigate(targetDashboard, { replace: true });
  };

  const handleLogin = async () => {
    const identifier = normalizeInput(usernameOrEmail);
    const pw = password.trim();

    if (!identifier) {
      setError("Please enter your email address or username.");
      return;
    }
    if (!pw) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await login(identifier, pw);

      if (!res || res.success === false) {
        throw new Error(res?.message || "Invalid email/username or password.");
      }

      const data = res?.data || res;

      if (data?.mfaRequired) {
        setMfaRequired(true);
        setLoginSessionId(data.loginSessionId);
        setTimer(data.expiresIn || 300);
        setResendCooldown(30);
        setOtpDigits(["", "", "", "", "", ""]);
        setMessage("Verification code sent to your registered email address.");
        setError("");
        setPassword("");
        return;
      }

      // Backend returns user details, token, refreshToken and role in response
      const userRole = data?.user?.role || data?.role;
      const token = data?.token || data?.accessToken;
      const userProfile = data?.user;

      if (!token || !userProfile) {
        throw new Error("Invalid email/username or password.");
      }

      const refreshToken = data?.refreshToken || '';
      storeSessionAndNavigate({ ...userProfile, role: userRole }, token, refreshToken);
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, "Invalid email/username or password."));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const name = regName.trim();
    const username = regUsername.trim();
    const email = regEmail.trim();
    const pw = regPassword.trim();
    const role = regRole;

    if (!name) {
      setError("Please enter your full name.");
      return;
    }
    if (!username) {
      setError("Please enter a username.");
      return;
    }
    if (!email || !isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!pw || pw.length < 4) {
      setError("Please enter a password (at least 4 characters).");
      return;
    }

    setRegLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await register({ name, username, email, password: pw, role });

      if (!res || res.success === false) {
        throw new Error(res?.message || "Registration failed. Please check your details.");
      }

      const data = res?.data || res;
      const userRole = data?.user?.role || role;
      const token = data?.token || data?.accessToken;
      const userProfile = data?.user || { name, username, email, role: userRole };

      if (!token) {
        setIsRegistering(false);
        setUsernameOrEmail(email);
        setPassword(pw);
        setMessage("Account registered successfully! Please log in with your credentials.");
        return;
      }

      const refreshToken = data?.refreshToken || '';
      storeSessionAndNavigate({ ...userProfile, role: userRole }, token, refreshToken);
    } catch (regError) {
      setError(getApiErrorMessage(regError, "Registration failed. Please try again."));
    } finally {
      setRegLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const identifier = normalizeInput(usernameOrEmail);

    if (!identifier) {
      setError("Please enter your email or username above, then click Forgot password.");
      setMessage("");
      return;
    }

    setResetLoading(true);
    setError("");
    setMessage("");

    try {
      const email = identifier.includes("@") ? identifier : `${identifier}@dypiu.ac.in`;
      const res = await requestPasswordReset(email);
      setMessage(res?.data?.message || `Password reset link sent to ${email}`);
    } catch (resetError) {
      setError(getApiErrorMessage(resetError, "Could not process password reset."));
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToSubmit = null) => {
    const code = codeToSubmit || otpDigits.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits of the verification code.");
      return;
    }

    setOtpLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await verifyOtp(loginSessionId, code);
      const data = res?.data;

      const userRole = data?.user?.role || 'FACULTY';
      const token = data?.token || 'jwt-token-mfa';
      const userProfile = data?.user || {
        name: usernameOrEmail.includes("@") ? usernameOrEmail.split("@")[0] : usernameOrEmail,
        email: usernameOrEmail.includes("@") ? usernameOrEmail : `${usernameOrEmail}@dypiu.ac.in`,
        username: usernameOrEmail,
        role: userRole,
      };

      const refreshToken = data?.refreshToken || '';
      storeSessionAndNavigate({ ...userProfile, role: userRole }, token, refreshToken);
    } catch (otpError) {
      setError(getApiErrorMessage(otpError, "Invalid or expired verification code."));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await resendOtp(loginSessionId);
      setResendCooldown(30);
      setTimer(res?.data?.expiresIn || 300);
      setOtpDigits(["", "", "", "", "", ""]);
      setMessage(res?.data?.message || "Verification code resent successfully.");
    } catch (resendError) {
      setError(getApiErrorMessage(resendError, "Could not resend verification code."));
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join("");
    if (fullCode.length === 6) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = ["", "", "", "", "", ""];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    const focusIdx = Math.min(pastedData.length, 5);
    otpRefs.current[focusIdx]?.focus();

    if (pastedData.length === 6) {
      handleVerifyOtp(pastedData);
    }
  };

  const handleBackToLogin = () => {
    setMfaRequired(false);
    setLoginSessionId("");
    setError("");
    setMessage("");
    setOtpDigits(["", "", "", "", "", ""]);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      if (isRegistering) {
        handleRegister();
      } else {
        handleLogin();
      }
    }
  };

  const toggleMode = (registering) => {
    setIsRegistering(registering);
    setError("");
    setMessage("");
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; }

        .dyp-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid rgba(255,255,255,0.55);
          border-radius: 4px;
          font-size: 14px;
          color: white;
          background: rgba(255,255,255,0.08);
          margin-bottom: 14px;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .dyp-input::placeholder { color: rgba(255,255,255,0.5); }
        .dyp-input:focus {
          border-color: white;
          box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
        }
        .dyp-select option {
          background-color: #1e293b;
          color: white;
        }
        .dyp-btn {
          width: 100%;
          padding: 12px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
          margin-bottom: 12px;
          letter-spacing: 0.2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dyp-btn:hover:not(:disabled) { background: #1d4ed8; }
        .dyp-btn:disabled { opacity: 0.72; cursor: not-allowed; }
        .dyp-forgot {
          background: none;
          border: none;
          font-size: 13px;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          font-family: inherit;
          padding: 0;
          text-align: center;
          width: 100%;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dyp-forgot:hover:not(:disabled) { color: white; text-decoration: underline; }
        .dyp-forgot:disabled { opacity: 0.65; }

        .dyp-toggle-link {
          background: none;
          border: none;
          color: #60a5fa;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          padding: 0;
          margin-left: 4px;
          text-decoration: underline;
        }
        .dyp-toggle-link:hover { color: #93c5fd; }

        @media (max-width: 900px) {
          .school-login-card {
            width: min(100%, 520px) !important;
            flex-direction: column;
          }
          .school-login-left {
            padding: 120px 24px 24px !important;
          }
          .school-login-right {
            width: 100% !important;
            border-left: 0 !important;
            border-top: 1px solid rgba(255,255,255,0.15);
          }
          .school-login-logo {
            height: 72px !important;
          }
        }
      `}</style>

      <div style={s.wrap}>
        <img
          className="school-login-logo"
          src={universityLogo}
          alt="University Logo"
          style={s.topLeftLogo}
        />

        <img
          className="school-login-logo"
          src={iqacLogo}
          alt="IQAC Logo"
          style={s.topRightLogo}
        />

        <div style={s.overlay} />

        <div className="school-login-card" style={s.card}>
          <div className="school-login-left" style={s.left}>
            <h1 style={s.uniName}>NBA Attainment & Academic Portal</h1>
            <h1 style={s.uniName}>
              D. Y. Patil International University, Akurdi, Pune, Maharashtra
            </h1>

            <p style={s.desc}>
              To create a vibrant learning environment fostering innovation,
              creativity, experiential learning, and research-driven academic
              excellence across all schools.
            </p>
          </div>

          <div className="school-login-right" style={s.right}>
            {!mfaRequired ? (
              !isRegistering ? (
                /* LOGIN FORM */
                <>
                  <h2 style={s.panelTitle}>Welcome! Please login to continue.</h2>

                  {error && <div style={s.error}>{error}</div>}
                  {message && <div style={s.success}>{message}</div>}

                  <input
                    className="dyp-input"
                    type="text"
                    placeholder="Enter email address or username"
                    value={usernameOrEmail}
                    onChange={(event) => setUsernameOrEmail(event.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="username"
                    maxLength={254}
                  />

                  <div style={{ position: "relative", marginBottom: 2 }}>
                    <input
                      className="dyp-input"
                      style={{ marginBottom: 0, paddingRight: 52 }}
                      type={showPw ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      style={s.eyeBtn}
                      onClick={() => setShowPw((value) => !value)}
                      tabIndex={-1}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div style={{ marginBottom: 16 }} />

                  <button className="dyp-btn" type="button" onClick={handleLogin} disabled={loading} aria-busy={loading}>
                    {loading && <InlineSpinner label="Signing in" />}
                    {loading ? "Signing in..." : "Login"}
                  </button>

                  <button
                    className="dyp-forgot"
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    aria-busy={resetLoading}
                    style={{ marginBottom: 12 }}
                  >
                    {resetLoading && <InlineSpinner label="Sending reset link" />}
                    {resetLoading ? "Sending reset link..." : "Forgot password?"}
                  </button>

                  <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
                    Don't have an account?
                    <button
                      type="button"
                      className="dyp-toggle-link"
                      onClick={() => toggleMode(true)}
                    >
                      Register Account
                    </button>
                  </div>
                </>
              ) : (
                /* REGISTER FORM */
                <>
                  <h2 style={s.panelTitle}>Create a New Account</h2>

                  {error && <div style={s.error}>{error}</div>}
                  {message && <div style={s.success}>{message}</div>}

                  <input
                    className="dyp-input"
                    type="text"
                    placeholder="Full Name (e.g. Dr. Raj Shaikh)"
                    value={regName}
                    onChange={(event) => setRegName(event.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="name"
                  />

                  <input
                    className="dyp-input"
                    type="text"
                    placeholder="Username (e.g. raj_shaikh)"
                    value={regUsername}
                    onChange={(event) => setRegUsername(event.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="username"
                  />

                  <input
                    className="dyp-input"
                    type="email"
                    placeholder="Email Address (e.g. raj.shaikh@dypiu.ac.in)"
                    value={regEmail}
                    onChange={(event) => setRegEmail(event.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                  />

                  <div style={{ position: "relative", marginBottom: 14 }}>
                    <input
                      className="dyp-input"
                      style={{ marginBottom: 0, paddingRight: 52 }}
                      type={showPw ? "text" : "password"}
                      placeholder="Password (min 4 characters)"
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      onKeyDown={handleKeyDown}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      style={s.eyeBtn}
                      onClick={() => setShowPw((value) => !value)}
                      tabIndex={-1}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>

                  <select
                    className="dyp-input dyp-select"
                    value={regRole}
                    onChange={(event) => setRegRole(event.target.value)}
                    style={{ cursor: "pointer" }}
                  >
                    <option value="FACULTY">Faculty / Course Coordinator</option>
                    <option value="PROGRAMME_COORDINATOR">Programme Coordinator</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="DIRECTOR">Director / Dean</option>
                  </select>

                  <button className="dyp-btn" type="button" onClick={handleRegister} disabled={regLoading} aria-busy={regLoading}>
                    {regLoading && <InlineSpinner label="Registering" />}
                    {regLoading ? "Registering Account..." : "Register Account"}
                  </button>

                  <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
                    Already have an account?
                    <button
                      type="button"
                      className="dyp-toggle-link"
                      onClick={() => toggleMode(false)}
                    >
                      Log In
                    </button>
                  </div>
                </>
              )
            ) : (
              /* MFA OTP VERIFICATION FORM */
              <>
                <h2 style={s.panelTitle}>Verify your identity</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.72)", marginTop: -14, marginBottom: 18, lineHeight: 1.4 }}>
                  Enter the 6-digit code sent to: <strong>{usernameOrEmail}</strong>
                </p>

                {error && <div style={s.error}>{error}</div>}
                {message && <div style={s.success}>{message}</div>}

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    justifyContent: "center",
                    marginBottom: 16
                  }}
                  onPaste={handleOtpPaste}
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpDigitKeyDown(idx, e)}
                      style={{
                        width: 40,
                        height: 46,
                        textAlign: "center",
                        fontSize: 20,
                        fontWeight: 700,
                        color: "white",
                        background: "rgba(255,255,255,0.12)",
                        border: "1.5px solid rgba(255,255,255,0.5)",
                        borderRadius: 4,
                        outline: "none",
                      }}
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>

                <button
                  className="dyp-btn"
                  type="button"
                  onClick={() => handleVerifyOtp()}
                  disabled={otpLoading || otpDigits.join("").length !== 6}
                  aria-busy={otpLoading}
                >
                  {otpLoading && <InlineSpinner label="Verifying" />}
                  {otpLoading ? "Verifying..." : "Verify & Continue"}
                </button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    style={{ background: "none", border: "none", color: "rgba(255,255,255,0.75)", cursor: "pointer", fontSize: 13 }}
                  >
                    &larr; Back to login
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resendLoading}
                    style={{ background: "none", border: "none", color: resendCooldown > 0 ? "rgba(255,255,255,0.4)" : "#60a5fa", cursor: resendCooldown > 0 ? "default" : "pointer", fontSize: 13 }}
                  >
                    {resendLoading ? "Resending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const s = {
  wrap: {
    minHeight: "100vh",
    width: "100%",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundImage: `url(${backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    padding: 24,
  },
  topLeftLogo: {
    position: "absolute",
    top: 18,
    left: 24,
    height: 90,
    width: "auto",
    zIndex: 2,
    objectFit: "contain",
  },
  topRightLogo: {
    position: "absolute",
    top: 18,
    right: 24,
    height: 90,
    width: "auto",
    zIndex: 2,
    objectFit: "contain",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 1,
  },
  card: {
    position: "relative",
    zIndex: 2,
    width: "min(100%, 960px)",
    display: "flex",
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(4px)",
  },
  left: {
    flex: 1.25,
    background: "rgba(10, 20, 35, 0.72)",
    padding: "40px 36px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  right: {
    width: 380,
    background: "rgba(15, 23, 42, 0.85)",
    padding: "36px 30px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    borderLeft: "1px solid rgba(255,255,255,0.12)",
  },
  uniName: {
    margin: "0 0 12px 0",
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  desc: {
    margin: "12px 0 0 0",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 1.6,
  },
  panelTitle: {
    margin: "0 0 18px 0",
    color: "white",
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.3,
  },
  error: {
    background: "rgba(239, 68, 68, 0.25)",
    border: "1px solid rgba(239, 68, 68, 0.5)",
    color: "#fca5a5",
    padding: "9px 12px",
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 1.4,
  },
  success: {
    background: "rgba(34, 197, 94, 0.25)",
    border: "1px solid rgba(34, 197, 94, 0.5)",
    color: "#86efac",
    padding: "9px 12px",
    borderRadius: 4,
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 1.4,
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.75)",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "inherit",
    padding: "2px 6px",
  },
};
