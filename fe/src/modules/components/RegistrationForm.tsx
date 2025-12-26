import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import authStore from '../stores/AuthStore';
import Input from "../../ui/elements/Input";
import Button from "../../ui/elements/Button";

const RegistrationForm: React.FC = observer(() => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await authStore.register(formData);
        if (success) {
            // Redirect or show success message
            console.log('Registration successful!');
            // You can redirect here: navigate('/dashboard');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>

            {authStore.error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {authStore.error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <Input
                    label="Username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter username"
                    required
                    error={!formData.username ? 'Username is required' : undefined}
                />

                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email"
                    required
                    error={!formData.email ? 'Email is required' : undefined}
                />

                <Input
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    error={!formData.password ? 'Password is required' : undefined}
                />

                <Button
                    type="submit"
                    isLoading={authStore.isLoading}
                    disabled={authStore.isLoading}
                    className="w-full"
                >
                    Register
                </Button>
            </form>

            {authStore.isAuthenticated && (
                <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
                    Registration successful! Token saved.
                </div>
            )}
        </div>
    );
});

export default RegistrationForm;