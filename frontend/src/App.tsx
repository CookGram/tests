import { useEffect, useState } from "react";
import type { Recipe, User } from "./types/recipe";
import { SimpleHeader } from "./components/SimpleHeader";
import { SimpleRecipeFeed } from "./components/SimpleRecipeFeed";
import { SimpleAddRecipePage } from "./components/SimpleAddRecipePage";
import { SimpleRecipeViewPage } from "./components/SimpleRecipeViewPage";
import { SimpleSubscriptionsPage } from "./components/SimpleSubscriptionsPage";
import { SimpleAuthorRecipesPage } from "./components/SimpleAuthorRecipesPage";
import { SimpleSettingsPage } from "./components/SimpleSettingsPage";
import { getAllRecipesApi } from "./api/recipes";
import type { RecipeDTO } from "./api/recipes";
import { clearTokens, getAccessToken } from "./api/auth";
import {
    followUserApi,
    unfollowUserApi,
    getUserSubscriptionsApi,
} from "./api/follow";
import { SimpleAuthPage } from "./components/SimpleAuthPage";

type Page =
    | "auth"
    | "feed"
    | "add-recipe"
    | "view-recipe"
    | "subscriptions"
    | "author-recipes"
    | "my-recipes"
    | "settings";

const mapRecipeDtoToRecipe = (dto: RecipeDTO): Recipe => {
    const authorName =
        dto.authorLogin && dto.authorLogin.trim().length > 0
            ? dto.authorLogin
            : "Неизвестный автор";

    return {
        id: String(dto.id),
        title: dto.title,
        author: authorName,
        authorId: dto.authorId ?? undefined,
        image: dto.imageData ? `data:image/*;base64,${dto.imageData}` : undefined,
        ingredients: [],
        steps:
            dto.steps?.map((step) => ({
                id: step.id != null ? String(step.id) : String(step.stepNo),
                description: step.description,
                image: step.imageData
                    ? `data:image/*;base64,${step.imageData}`
                    : undefined,
            })) ?? [],
        createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
    };
};

export default function App() {
    const [currentPage, setCurrentPage] = useState<Page>();
    const [user, setUser] = useState<User | null>(null);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [selectedAuthor, setSelectedAuthor] = useState<string>("");
    const [showSubscriptionsOnly, setShowSubscriptionsOnly] =
        useState<boolean>(false);
    const [isLoadingRecipes, setIsLoadingRecipes] = useState<boolean>(false);
    const [recipesError, setRecipesError] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

    const clearAuthData = () => {
        clearTokens();
        localStorage.removeItem("currentUser");
        setUser(null);
        setCurrentPage("auth");
    };

    const loadRecipes = async () => {
        setIsLoadingRecipes(true);
        setRecipesError(null);
        try {
            const dtos = await getAllRecipesApi();
            const mapped = dtos.map((dto) => mapRecipeDtoToRecipe(dto));
            setRecipes(mapped);
        } catch (err: any) {
            console.error(err);
            setRecipesError(
                err?.message ||
                "Не удалось загрузить рецепты. Попробуйте обновить страницу."
            );
            setRecipes([]);
        } finally {
            setIsLoadingRecipes(false);
        }
    };

    /**
     * Подгрузить подписки пользователя с бэкенда и сохранить пользователя в состояние.
     * Используется и при логине, и при автологине (после перезагрузки страницы).
     */
    const loadUserWithSubscriptions = async (baseUser: User) => {
        const userIdNum = Number(baseUser.id);
        let subscriptionsFromServer: string[] = [];

        if (Number.isFinite(userIdNum)) {
            try {
                subscriptionsFromServer = await getUserSubscriptionsApi(userIdNum);
            } catch (error) {
                console.error("Не удалось загрузить подписки пользователя:", error);
            }
        }

        const fullUser: User = {
            ...baseUser,
            subscriptions:
                subscriptionsFromServer.length > 0
                    ? subscriptionsFromServer
                    : baseUser.subscriptions ?? [],
        };

        setUser(fullUser);
        setCurrentPage("feed");
        await loadRecipes();
    };

    useEffect(() => {
        const checkAuthStatus = async () => {
            setIsCheckingAuth(true);

            try {
                const token = getAccessToken();

                if (token) {
                    const savedUser = localStorage.getItem("currentUser");

                    if (savedUser) {
                        try {
                            const userData: User = JSON.parse(savedUser);
                            if (!userData.subscriptions) {
                                userData.subscriptions = [];
                            }

                            await loadUserWithSubscriptions(userData);
                        } catch (error) {
                            console.error("Ошибка парсинга пользователя:", error);
                            clearAuthData();
                        }
                    } else {
                        clearAuthData();
                    }
                } else {
                    setCurrentPage("auth");
                }
            } catch (error) {
                console.error("Ошибка проверки авторизации:", error);
                clearAuthData();
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuthStatus();
    }, []);

    // Сохраняем пользователя в localStorage при изменении
    useEffect(() => {
        if (user) {
            localStorage.setItem("currentUser", JSON.stringify(user));
        }
    }, [user]);

    const handleLogin = (loggedInUser: User) => {
        // логин из SimpleAuthPage → подтягиваем подписки и рецепты
        loadUserWithSubscriptions(loggedInUser);
    };

    const handleLogout = () => {
        clearAuthData();
        alert("Выход из аккаунта");
        setSelectedRecipe(null);
        setSelectedAuthor("");
        setShowSubscriptionsOnly(false);
    };

    const handleAddRecipe = () => {
        setCurrentPage("add-recipe");
    };

    const handleSaveRecipe = (newRecipe: Omit<Recipe, "id" | "createdAt">) => {
        const recipe: Recipe = {
            ...newRecipe,
            id: Date.now().toString(),
            createdAt: new Date(),
        };
        setRecipes([recipe, ...recipes]);
        alert("Рецепт успешно добавлен!");
        setCurrentPage("my-recipes");
    };

    const handleRecipeClick = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setCurrentPage("view-recipe");
    };

    const handleBackToFeed = () => {
        setSelectedRecipe(null);
        setSelectedAuthor("");
        setShowSubscriptionsOnly(false);
        setCurrentPage("feed");
    };

    const handleSubscriptionsClick = () => {
        setCurrentPage("subscriptions");
    };

    const handleUserNameClick = () => {
        setCurrentPage("my-recipes");
    };

    const handleSettingsClick = () => {
        setCurrentPage("settings");
    };

    const handleSaveSettings = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const handleAuthorClick = (authorName: string) => {
        setSelectedAuthor(authorName);
        setCurrentPage("author-recipes");
    };

    const handleSubscribe = async (authorName: string) => {
        if (!user) return;
        if (user.subscriptions.includes(authorName)) return;

        const followerId = Number(user.id);
        if (!Number.isFinite(followerId)) {
            console.warn("Невозможно подписаться: user.id не число:", user.id);
            const updatedUser = {
                ...user,
                subscriptions: [...user.subscriptions, authorName],
            };
            setUser(updatedUser);
            return;
        }

        // Ищем рецепт этого автора, чтобы достать его authorId
        const recipeOfAuthor = recipes.find(
            (r) => r.author === authorName && r.authorId != null
        );

        if (!recipeOfAuthor || recipeOfAuthor.authorId == null) {
            console.warn("Невозможно определить authorId для автора", authorName);
            const updatedUser = {
                ...user,
                subscriptions: [...user.subscriptions, authorName],
            };
            setUser(updatedUser);
            return;
        }

        const targetUserId = recipeOfAuthor.authorId;

        try {
            await followUserApi(followerId, targetUserId);
            const updatedUser = {
                ...user,
                subscriptions: [...user.subscriptions, authorName],
            };
            setUser(updatedUser);
        } catch (err) {
            console.error("Ошибка при подписке:", err);
        }
    };

    const handleUnsubscribe = async (authorName: string) => {
        if (!user) return;
        if (!user.subscriptions.includes(authorName)) return;

        const followerId = Number(user.id);
        if (!Number.isFinite(followerId)) {
            console.warn("Невозможно отписаться: user.id не число:", user.id);
            const updatedUser = {
                ...user,
                subscriptions: user.subscriptions.filter((sub) => sub !== authorName),
            };
            setUser(updatedUser);
            return;
        }

        const recipeOfAuthor = recipes.find(
            (r) => r.author === authorName && r.authorId != null
        );

        if (!recipeOfAuthor || recipeOfAuthor.authorId == null) {
            console.warn("Невозможно определить authorId для автора", authorName);
            const updatedUser = {
                ...user,
                subscriptions: user.subscriptions.filter((sub) => sub !== authorName),
            };
            setUser(updatedUser);
            return;
        }

        const targetUserId = recipeOfAuthor.authorId;

        try {
            await unfollowUserApi(followerId, targetUserId);
            const updatedUser = {
                ...user,
                subscriptions: user.subscriptions.filter((sub) => sub !== authorName),
            };
            setUser(updatedUser);
        } catch (err) {
            console.error("Ошибка при отписке:", err);
        }
    };

    const handleToggleSubscriptionsFilter = () => {
        setShowSubscriptionsOnly(!showSubscriptionsOnly);
    };

    const getFilteredRecipes = () => {
        if (currentPage === "my-recipes") {
            return recipes.filter((recipe) => recipe.author === user?.name);
        }
        if (currentPage === "author-recipes") {
            return recipes.filter((recipe) => recipe.author === selectedAuthor);
        }
        if (showSubscriptionsOnly && user) {
            return recipes.filter((recipe) =>
                user.subscriptions.includes(recipe.author)
            );
        }
        return recipes;
    };

    if (isCheckingAuth || currentPage === undefined) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg text-gray-600">
                        Проверка авторизации...
                    </div>
                </div>
            </div>
        );
    }

    if (currentPage === "auth") {
        return <SimpleAuthPage onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <SimpleHeader
                user={user}
                onLogout={handleLogout}
                onSubscriptionsClick={handleSubscriptionsClick}
                onUserNameClick={handleUserNameClick}
                onCookBookClick={handleBackToFeed}
                onSettingsClick={handleSettingsClick}
            />

            {isLoadingRecipes && (
                <div className="p-4 text-center text-gray-500">Загрузка рецептов...</div>
            )}

            {recipesError &&
                (currentPage === "feed" ||
                    currentPage === "my-recipes" ||
                    currentPage === "author-recipes") && (
                    <div className="p-4 text-center text-red-600">
                        {
                            "Произошла ошибка при загрузке рецептов. Повторите попытку позже."
                        }
                    </div>
                )}

            {(currentPage === "feed" || currentPage === "my-recipes") &&
                !recipesError && (
                    <SimpleRecipeFeed
                        recipes={getFilteredRecipes()}
                        onRecipeClick={handleRecipeClick}
                        onAddRecipeClick={handleAddRecipe}
                        onAuthorClick={handleAuthorClick}
                        showSubscriptionsOnly={showSubscriptionsOnly}
                        onToggleSubscriptionsFilter={handleToggleSubscriptionsFilter}
                        hideFilterButton={currentPage === "my-recipes"}
                        title={
                            currentPage === "my-recipes" ? "Мои рецепты" : "Лента рецептов"
                        }
                        currentUserName={user?.name}
                        subscriptions={user?.subscriptions ?? []}
                        onSubscribe={handleSubscribe}
                        onUnsubscribe={handleUnsubscribe}
                    />
                )}

            {currentPage === "add-recipe" && user && (
                <SimpleAddRecipePage
                    user={user}
                    onBack={handleBackToFeed}
                    onSave={handleSaveRecipe}
                />
            )}

            {currentPage === "view-recipe" && selectedRecipe && user && (
                <SimpleRecipeViewPage
                    recipe={selectedRecipe}
                    onBack={handleBackToFeed}
                    onAuthorClick={handleAuthorClick}
                    onSubscribe={handleSubscribe}
                    onUnsubscribe={handleUnsubscribe}
                    isSubscribed={user.subscriptions.includes(selectedRecipe.author)}
                    currentUserName={user.name}
                />
            )}

            {currentPage === "subscriptions" && user && (
                <SimpleSubscriptionsPage
                    user={user}
                    onBack={handleBackToFeed}
                    onUnsubscribe={handleUnsubscribe}
                    onAuthorClick={handleAuthorClick}
                />
            )}

            {currentPage === "author-recipes" && !recipesError && (
                <SimpleAuthorRecipesPage
                    authorName={selectedAuthor}
                    recipes={getFilteredRecipes()}
                    onBack={handleBackToFeed}
                    onRecipeClick={handleRecipeClick}
                    currentUserName={user?.name}
                    isSubscribed={!!user && user.subscriptions.includes(selectedAuthor)}
                    onSubscribe={handleSubscribe}
                    onUnsubscribe={handleUnsubscribe}
                />
            )}

            {currentPage === "settings" && user && (
                <SimpleSettingsPage
                    user={user}
                    onBack={handleBackToFeed}
                    onSaveSettings={handleSaveSettings}
                />
            )}
        </div>
    );
}
