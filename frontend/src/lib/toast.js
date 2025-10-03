import { toast } from "react-hot-toast";

// default options for all toasts
const defaultOptions = {
  duration: 1500,
  position: "top-center",
  style: {
    borderRadius: "10px",
    background: "#1f2937", // dark background
    color: "#f9fafb",       // light text
    fontWeight: "500",
    fontSize: "16px",
  },
};

// wrapper functions
export const showSuccess = (message) => toast.success(message, defaultOptions);
export const showError = (message) => toast.error(message, defaultOptions);
export const showInfo = (message) => toast(message, defaultOptions);
export const showLoading = (message) => toast.loading(message, defaultOptions);
export const dismissToast = (id) => toast.dismiss(id);


// how to use in files:-
// import { showSuccess, showError } from "../lib/toast"; // first import

// showSuccess("Login successful! 🎉🚀 Redirecting to dashboard...🏃‍♂️💨");
// showError("Network error! 🌐⚠️ Try again.");