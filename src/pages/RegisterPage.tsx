import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
        <Formik
          initialValues={{ username: '', email: '', password: '' }}
          validationSchema={RegisterSchema}
          onSubmit={async (values, { setSubmitting, setStatus }) => {
            try {
              await api.post('/users/register', values);
              setStatus({ success: 'Registration successful! Please log in.' });
              setTimeout(() => navigate('/login'), 2000);
            } catch (error) {
              setStatus({ error: 'Registration failed. Please try again.' });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, status, errors, touched }) => (
            <Form>
              <Input name="username" type="text" placeholder="Username" hasError={!!(errors.username && touched.username)} />
              <Input name="email" type="email" placeholder="Email" hasError={!!(errors.email && touched.email)} />
              <Input name="password" type="password" placeholder="Password" hasError={!!(errors.password && touched.password)} />
              <Button type="submit" disabled={isSubmitting} fullWidth>
                Register
              </Button>
              {status?.error && <div className="text-red-500 text-center mt-4">{status.error}</div>}
              {status?.success && <div className="text-green-500 text-center mt-4">{status.success}</div>}
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default RegisterPage;
