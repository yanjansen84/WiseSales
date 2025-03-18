
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

const ForgotPassword = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIj48cmVjdCBmaWxsPSIjRjRGOUY5IiB3aWR0aD0iMTQ0MCIgaGVpZ2h0PSI3NjUiLz48Y2lyY2xlIGZpbGwtb3BhY2l0eT0iLjAzIiBmaWxsPSIjMjJDNTVFIiBjeD0iODYxIiBjeT0iNTc4IiByPSI0ODEiLz48Y2lyY2xlIGZpbGwtb3BhY2l0eT0iLjA0IiBmaWxsPSIjMjJDNTVFIiBjeD0iNDY1IiBjeT0iMTc1IiByPSI2NDAiLz48L2c+PC9zdmc+')] opacity-50 -z-10"></div>
      
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <div className="w-10 h-10 rounded-md bg-green-600 flex items-center justify-center">
              <span className="font-bold text-white text-xl">WS</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold font-display mb-2 text-green-800">Wise Sales</h1>
          <p className="text-gray-600">Reset your password</p>
        </div>
        
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPassword;
