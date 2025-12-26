import React from 'react';
import RegistrationForm from "../modules/components/RegistrationForm";

const RegisterPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h1 className="text-center text-3xl font-extrabold text-gray-900">
                    Create Account
                </h1>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Please fill in the form to register
                </p>
            </div>
            <RegistrationForm />
        </div>
    );
};

export default RegisterPage;