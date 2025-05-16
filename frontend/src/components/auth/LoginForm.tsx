import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import { useForm } from '../../hooks/useForm';
import { loginValidation } from '../../utils/validation.utils';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { LoginCredentials } from '../../types/auth.types';

const initialValues = {
  email: '',
  password: '',
} as const;

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Get the redirect path from location state or default to dashboard
  const from = (location.state as { from?: string })?.from || '/dashboard';

  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useForm<LoginCredentials>({
    initialValues: initialValues as LoginCredentials,
    validationSchema: loginValidation,
    onSubmit: async (formValues) => {
      await login(formValues);
      navigate(from, { replace: true });
    },
  });

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 bg-white rounded-xl p-8 shadow-lg">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">Please sign in to your account</p>
      </div>

      <div className="space-y-5">
        <Input
          label="Email"
          type="email"
          name="email"
          value={values.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={values.password}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.password}
          autoComplete="current-password"
          placeholder="••••••••"
          required
        />
      </div>

      {errors.submit && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm animate-[fadeIn_0.2s_ease-in-out]">
          {errors.submit}
        </div>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          isLoading={isSubmitting}
          fullWidth
        >
          Sign In
        </Button>
      </div>

      <div className="relative mt-8 pt-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <div className="text-center text-sm">
        <span className="text-gray-600">Don't have an account? </span>
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
        >
          Sign up now
        </button>
      </div>
    </form>
  );
};