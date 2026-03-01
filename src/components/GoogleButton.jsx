import React from "react";

export default function GoogleButton({ label = "Continue with Google", loading, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="ems-google-btn"
    >
      <span className="ems-google-icon-wrapper">
        <img
          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
          alt="Google logo"
          className="ems-google-icon"
        />
      </span>
      <span className="ems-google-label">
        {loading ? "Please wait..." : label}
      </span>
    </button>
  );
}

