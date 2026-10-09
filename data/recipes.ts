import type { ImageSourcePropType } from 'react-native';

export type Recipe = {
  id: string;
  name: string;
  image: ImageSourcePropType;
  categories: string[];
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  servings: number;
  calories: number;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  personal?: boolean;
};

export const categories = [
  'All',
  'Breakfast',
  'Lunch',
  'Dinner',
  'Desserts',
  'Snacks',
  'Italian',
  'Indian',
  'Mexican',
  'Healthy',
  'My Food',
];

const photo = (id: string): ImageSourcePropType => ({
  uri: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`,
});

export const sampleRecipes: Recipe[] = [
  {
    id: 'pesto-pasta',
    name: 'Creamy Pesto Pasta',
    image: require('../assets/images/foodie-pesto.jpg'),
    categories: ['Dinner', 'Italian'],
    ingredients: ['12 oz rigatoni', '½ cup basil pesto', '½ cup cream', 'Parmesan', 'Cherry tomatoes'],
    instructions: ['Boil pasta in salted water until al dente.', 'Warm pesto and cream together in a skillet.', 'Toss pasta with the sauce and a splash of pasta water.', 'Finish with tomatoes and freshly grated Parmesan.'],
    prepTime: 25,
    servings: 4,
    calories: 485,
    difficulty: 'Easy',
  },
  {
    id: 'avocado-toast',
    name: 'Garden Avocado Toast',
    image: require('../assets/images/foodie-toast.jpg'),
    categories: ['Breakfast', 'Healthy'],
    ingredients: ['2 slices sourdough', '1 ripe avocado', '2 eggs', 'Lemon', 'Chili flakes'],
    instructions: ['Toast the sourdough until golden.', 'Mash avocado with lemon juice, salt, and pepper.', 'Spread over toast and top with a soft poached egg.', 'Add chili flakes and microgreens to serve.'],
    prepTime: 15,
    servings: 2,
    calories: 360,
    difficulty: 'Easy',
  },
  {
    id: 'butter-chicken',
    name: 'Weeknight Butter Chicken',
    image: photo('photo-1603894584373-5ac82b2ae398'),
    categories: ['Dinner', 'Indian'],
    ingredients: ['1 lb chicken thighs', '½ cup tomato purée', '½ cup yogurt', 'Garam masala', '½ cup cream'],
    instructions: ['Toss chicken with yogurt and garam masala.', 'Sear chicken until browned on all sides.', 'Stir in tomato purée and simmer until cooked through.', 'Finish with cream and serve with warm naan.'],
    prepTime: 40,
    servings: 4,
    calories: 520,
    difficulty: 'Medium',
  },
  {
    id: 'berry-pancakes',
    name: 'Fluffy Berry Pancakes',
    image: photo('photo-1528207776546-365bb710ee93'),
    categories: ['Breakfast', 'Desserts'],
    ingredients: ['1½ cups flour', '1 cup milk', '1 egg', '2 tbsp maple syrup', 'Fresh berries'],
    instructions: ['Whisk flour, milk, egg, and a pinch of salt until smooth.', 'Pour small rounds onto a buttered warm pan.', 'Flip when bubbles form and cook until golden.', 'Serve with berries and maple syrup.'],
    prepTime: 20,
    servings: 3,
    calories: 390,
    difficulty: 'Easy',
  },
  {
    id: 'tacos',
    name: 'Smoky Street Tacos',
    image: photo('photo-1551504734-5ee1c4a1479b'),
    categories: ['Dinner', 'Mexican'],
    ingredients: ['8 corn tortillas', '1 lb flank steak', '1 tsp smoked paprika', '1 lime', 'Cilantro and onion'],
    instructions: ['Season steak with paprika, salt, and pepper.', 'Sear in a hot pan to your preferred doneness.', 'Rest the steak, then slice thinly across the grain.', 'Serve in warm tortillas with lime, onion, and cilantro.'],
    prepTime: 30,
    servings: 4,
    calories: 410,
    difficulty: 'Medium',
  },
  {
    id: 'chocolate-mousse',
    name: 'Silky Chocolate Mousse',
    image: photo('photo-1511715112108-9acc2c9a6d5c'),
    categories: ['Desserts'],
    ingredients: ['6 oz dark chocolate', '3 eggs, separated', '¾ cup heavy cream', '1 tbsp sugar', 'Pinch of sea salt'],
    instructions: ['Melt chocolate gently and let it cool slightly.', 'Whip cream to soft peaks in a chilled bowl.', 'Fold egg yolks into chocolate, then gently fold in cream.', 'Whip egg whites with sugar, fold through, and chill for 3 hours.'],
    prepTime: 25,
    servings: 4,
    calories: 340,
    difficulty: 'Medium',
  },
  {
    id: 'grain-bowl',
    name: 'Green Goddess Grain Bowl',
    image: photo('photo-1512621776951-a57141f2eefd'),
    categories: ['Lunch', 'Healthy'],
    ingredients: ['1 cup quinoa', '1 cucumber', '1 avocado', '1 cup edamame', 'Herb dressing'],
    instructions: ['Cook quinoa according to the package directions.', 'Slice cucumber and avocado; steam the edamame.', 'Divide quinoa between bowls and arrange vegetables on top.', 'Drizzle generously with herb dressing.'],
    prepTime: 25,
    servings: 2,
    calories: 430,
    difficulty: 'Easy',
  },
  {
    id: 'masala-chickpeas',
    name: 'Quick Masala Chickpeas',
    image: photo('photo-1546833999-b9f581a1996d'),
    categories: ['Lunch', 'Indian', 'Healthy'],
    ingredients: ['2 cans chickpeas', '1 onion', '1 cup crushed tomatoes', 'Garam masala', 'Fresh cilantro'],
    instructions: ['Soften diced onion in a little oil.', 'Add garam masala and stir until fragrant.', 'Stir in chickpeas and tomatoes; simmer for 15 minutes.', 'Finish with cilantro and serve with rice or flatbread.'],
    prepTime: 25,
    servings: 4,
    calories: 310,
    difficulty: 'Easy',
  },
  {
    id: 'lemon-bars',
    name: 'Bright Lemon Bars',
    image: photo('photo-1519915028121-7d3463d20b13'),
    categories: ['Desserts', 'Snacks'],
    ingredients: ['1 cup flour', '½ cup butter', '¾ cup sugar', '2 eggs', '2 lemons'],
    instructions: ['Press flour, butter, and a little sugar into a lined tin.', 'Bake the crust until just lightly golden.', 'Whisk eggs with sugar, lemon zest, and lemon juice.', 'Pour over the crust and bake until set; cool before slicing.'],
    prepTime: 45,
    servings: 9,
    calories: 220,
    difficulty: 'Medium',
  },
  {
    id: 'tomato-soup',
    name: 'Roasted Tomato Soup',
    image: photo('photo-1547592180-85f173990554'),
    categories: ['Lunch', 'Dinner', 'Healthy'],
    ingredients: ['2 lb ripe tomatoes', '1 red pepper', '3 garlic cloves', '2 cups vegetable stock', 'Fresh basil'],
    instructions: ['Roast tomatoes, pepper, and garlic until caramelized.', 'Transfer vegetables and their juices to a saucepan.', 'Add stock and simmer for 10 minutes.', 'Blend until smooth and top with fresh basil.'],
    prepTime: 35,
    servings: 4,
    calories: 190,
    difficulty: 'Easy',
  },
];
