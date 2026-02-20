import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./views/layout/AppShell";
import { ProtectedLayout } from "./views/layout/ProtectedLayout";
import { DashboardPage } from "./controllers/DashboardPage";
import { EditResumePage } from "./controllers/EditResumePage";
import { ForgotPasswordPage } from "./controllers/ForgotPasswordPage";
import { LoginPage } from "./controllers/LoginPage";
import { NewResumePage } from "./controllers/NewResumePage";
import { RegisterPage } from "./controllers/RegisterPage";
import { ResetPasswordPage } from "./controllers/ResetPasswordPage";

export const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/app" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="resumes/new" element={<NewResumePage />} />
          <Route path="resumes/:id/edit" element={<EditResumePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
};