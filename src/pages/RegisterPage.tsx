import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom'; // Импортируем Link
import Input from '../components/Input';
import Button from '../components/Button';
import api from '../services/api';

const RegisterSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-extrabold mb-2 text-center text-gray-900 dark:text-white">Create Account</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Join us to start chatting</p>
        
        <Formik
          initialValues={{ username: '', email: '', password: '' }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              await api.post('/auth/register', values); // Изменен эндпоинт
              setStatus({ success: 'Registration successful! Redirecting to login...' });
              setTimeout(() => navigate('/login'));
            } catch (error) {
              setStatus({ error: 'Registration failed. This username or email might already be taken.' });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status, errors, touched }) => (
            <Form className="space-y-6">
              <Input name="username" type="text" placeholder="Username" hasError={!!(errors.username && touched.username)} />
              <Input name="email" type="email" placeholder="Email" hasError={!!(errors.email && touched.email)} />
              <Input name="password" type="password" placeholder="Password" hasError={!!(errors.password && touched.password)} />
              
              {status?.error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative text-center">
                  {status.error}
                </div>
              )}
              {status?.success && (
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg relative text-center">
                  {status.success}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting || status?.success} fullWidth>
                {isSubmitting ? 'Creating Account...' : 'Register'}
              </Button>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
