import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 animate-[fadeIn_0.5s_ease-in-out]">
      <div className="max-w-md mx-auto">
        <RegisterForm />
      </div>
    </div>
  );
};

export default RegisterPage;