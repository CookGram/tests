export interface RecipeStep {
  id: string;
  description: string;
  image?: string;
}

export interface Recipe {
  id: string;
  title: string;
  author: string;
  authorId?: number;
  image?: string;
  ingredients: string[];
  steps: RecipeStep[];
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  login: string;
  email: string;
  subscriptions: string[]; // массив имен авторов на которых подписан
}
