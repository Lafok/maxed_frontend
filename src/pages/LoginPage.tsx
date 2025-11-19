import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Welcome Back</h2>
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
            <Form>
              <Input name="username" type="text" placeholder="Username" hasError={!!(errors.username && touched.username)} />
              <Input name="password" type="password" placeholder="Password" hasError={!!(errors.password && touched.password)} />
              <Button type="submit" disabled={isSubmitting} fullWidth>
                Login
              </Button>
              {status?.error && <div className="text-red-500 text-center mt-4">{status.error}</div>}
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default LoginPage;
