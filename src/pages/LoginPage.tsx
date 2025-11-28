import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-4xl font-extrabold mb-2 text-center text-gray-900 dark:text-white">Welcome Back</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Sign in to continue</p>
        
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              const response = await api.post('/auth/login', values);
              login(response.data.token);
              navigate('/chat');
            } catch (error) {
              setStatus({ error: 'Invalid credentials. Please try again.' });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status, errors, touched }) => (
            <Form className="space-y-6">
              <Input name="username" type="text" placeholder="Username" hasError={!!(errors.username && touched.username)} />
              <Input name="password" type="password" placeholder="Password" hasError={!!(errors.password && touched.password)} />
              
              {status?.error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative text-center">
                  {status.error}
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} fullWidth>
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
