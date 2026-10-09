import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { sampleRecipes, type Recipe } from '@/data/recipes';

type RecipeContextValue = {
  favorites: string[];
  personalRecipes: Recipe[];
  allRecipes: Recipe[];
  ready: boolean;
  toggleFavorite: (id: string) => void;
  saveRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
};

const STORAGE_KEY = 'foodie.local.v1';
const RecipeContext = createContext<RecipeContextValue | null>(null);

export function RecipeProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [personalRecipes, setPersonalRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        const saved = JSON.parse(value) as { favorites?: string[]; recipes?: Recipe[] };
        setFavorites(Array.isArray(saved.favorites) ? saved.favorites : []);
        setPersonalRecipes(Array.isArray(saved.recipes) ? saved.recipes : []);
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ favorites, recipes: personalRecipes })).catch(() => undefined);
  }, [favorites, personalRecipes, ready]);

  const value = useMemo<RecipeContextValue>(() => ({
    favorites,
    personalRecipes,
    allRecipes: [...personalRecipes, ...sampleRecipes],
    ready,
    toggleFavorite: (id) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]),
    saveRecipe: (recipe) => setPersonalRecipes((current) => [recipe, ...current.filter((item) => item.id !== recipe.id)]),
    deleteRecipe: (id) => setPersonalRecipes((current) => current.filter((recipe) => recipe.id !== id)),
  }), [favorites, personalRecipes, ready]);

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
}

export function useRecipes() {
  const value = useContext(RecipeContext);
  if (!value) throw new Error('useRecipes must be used inside RecipeProvider');
  return value;
}
