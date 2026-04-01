import { useState } from "react";
import {
    loginRequest,
    registerRequest,
    saveTokens,
    fetchProfileByEmail,
} from "../api/auth";
import type { User } from "../types/recipe";

type SimpleAuthPageProps = {
    onLogin: (user: User) => void;
};

export function SimpleAuthPage({ onLogin }: SimpleAuthPageProps) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!form.email.trim()) {
            newErrors.email = "Email обязателен";
        } else if (form.email.length < 5) {
            newErrors.email = "Email должен быть не менее 5 символов";
        } else if (!form.email.includes("@") || !form.email.includes(".")) {
            newErrors.email = "Введите корректный email";
        }

        if (!form.password) {
            newErrors.password = "Пароль обязателен";
        } else if (form.password.length < 6) {
            newErrors.password = "Пароль должен быть не менее 6 символов";
        } else if (form.password.length > 12) {
            newErrors.password = "Пароль должен быть не более 12 символов";
        } else if (!/^[a-zA-Zа-яА-ЯёЁ0-9]+$/.test(form.password)) {
            newErrors.password =
                "Пароль может содержать только латинские/русские буквы и цифры";
        }

        if (isRegistering) {
            if (!form.name.trim()) {
                newErrors.name = "Имя обязательно";
            } else if (form.name.length < 2) {
                newErrors.name = "Имя должно быть не менее 2 символов";
            }

            if (!form.confirmPassword) {
                newErrors.confirmPassword = "Подтвердите пароль";
            } else if (form.confirmPassword !== form.password) {
                newErrors.confirmPassword = "Пароли не совпадают";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isRegistering) {
            if (
                !form.name ||
                !form.email ||
                !form.password ||
                !form.confirmPassword
            ) {
                alert("Заполните все поля");
                return;
            }
        } else {
            if (!form.email || !form.password) {
                alert("Заполните все поля");
                return;
            }
        }

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            if (isRegistering) {
                await registerRequest({
                    login: form.name,
                    email: form.email,
                    password: form.password,
                });

                const tokens = await loginRequest({
                    email: form.email,
                    password: form.password,
                });

                saveTokens(tokens);

                const profile = await fetchProfileByEmail(form.email);

                const displayName =
                    (profile.name && profile.name.trim()) ||
                    profile.login ||
                    profile.email;

                const user: User = {
                    id: String(profile.id),
                    login: profile.login ?? displayName,
                    name: displayName,
                    email: profile.email,
                    subscriptions: [],
                };

                onLogin(user);
            } else {
                const tokens = await loginRequest({
                    email: form.email,
                    password: form.password,
                });

                saveTokens(tokens);

                const profile = await fetchProfileByEmail(form.email);

                const displayName =
                    (profile.name && profile.name.trim()) ||
                    profile.login ||
                    profile.email;

                const user: User = {
                    id: String(profile.id),
                    login: profile.login ?? displayName,
                    name: displayName,
                    email: profile.email,
                    subscriptions: [],
                };

                onLogin(user);
            }
        } catch (err: any) {
            console.error(err);
            const errorMessage = isRegistering
                ? "Ошибка при регистрации. Возможно, пользователь с таким email уже существует."
                : "Не удалось войти. Проверьте введённые данные.";
            setErrors({ submit: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: "" }));
        }
        if (errors.submit) {
            setErrors((prev) => ({ ...prev, submit: "" }));
        }
    };

    const resetForm = () => {
        setForm({ name: "", email: "", password: "", confirmPassword: "" });
        setErrors({});
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const toggleForm = (registering: boolean) => {
        setIsRegistering(registering);
        resetForm();
    };

    const EyeIcon = () => (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );

    const EyeOffIcon = () => (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94" />
            <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88" />
            <path d="M1 1l22 22" />
        </svg>
    );

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-md rounded-lg border bg-white p-6 shadow-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold">
                        Добро пожаловать в CookBook
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {isRegistering
                            ? "Создайте новый аккаунт"
                            : "Войдите в свой аккаунт"}
                    </p>
                </div>

                <div className="mb-6">
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        <button
                            type="button"
                            onClick={() => toggleForm(false)}
                            className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${
                                !isRegistering
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Вход
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleForm(true)}
                            className={`flex-1 rounded py-2 text-sm font-medium transition-colors ${
                                isRegistering
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                            }`}
                        >
                            Регистрация
                        </button>
                    </div>
                </div>

                {errors.submit && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Имя
                            </label>
                            <input
                                type="text"
                                placeholder="Например, Анна"
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Пароль
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={isRegistering ? "Минимум 6 символов" : "••••••••"}
                                value={form.password}
                                onChange={(e) => updateField("password", e.target.value)}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Повторите пароль
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Ещё раз пароль"
                                    value={form.confirmPassword}
                                    onChange={(e) =>
                                        updateField("confirmPassword", e.target.value)
                                    }
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((prev) => !prev)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    aria-label={
                                        showConfirmPassword
                                            ? "Скрыть пароль"
                                            : "Показать пароль"
                                    }
                                >
                                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-md bg-blue-600 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading
                            ? isRegistering
                                ? "Создаём аккаунт..."
                                : "Входим..."
                            : isRegistering
                                ? "Зарегистрироваться"
                                : "Войти"}
                    </button>
                </form>
            </div>
        </div>
    );
}
