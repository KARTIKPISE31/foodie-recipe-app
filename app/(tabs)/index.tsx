import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { categories, type Recipe } from '@/data/recipes';
import { useColors } from '@/hooks/useColors';
import { useRecipes } from '@/context/RecipeContext';

type Page = 'feed' | 'favorites' | 'myFood' | 'myRecipes' | 'detail' | 'form';

const emptyForm = {
  name: '',
  ingredients: '',
  instructions: '',
  prepTime: '30',
  servings: '2',
  calories: '350',
  difficulty: 'Easy' as Recipe['difficulty'],
};

const fallbackImage = require('../../assets/images/foodie-toast.jpg');

function ActionIcon({ name, onPress, color, testID }: { name: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; color: string; testID?: string }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" testID={testID} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
      <Ionicons name={name} size={22} color={color} />
    </Pressable>
  );
}

export default function FoodieScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { favorites, personalRecipes, allRecipes, ready, toggleFavorite, saveRecipe, deleteRecipe } = useRecipes();
  const [page, setPage] = useState<Page>('feed');
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<Recipe['image'] | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const selectedRecipe = allRecipes.find((recipe) => recipe.id === selectedId) ?? null;
  const isPersonal = (recipe: Recipe) => personalRecipes.some((item) => item.id === recipe.id);
  const visibleRecipes = useMemo(() => {
    let items = page === 'favorites'
      ? allRecipes.filter((recipe) => favorites.includes(recipe.id))
      : page === 'myRecipes'
        ? personalRecipes
        : allRecipes.filter((recipe) => category === 'All' || recipe.categories.includes(category));
    if (query.trim()) {
      const term = query.trim().toLowerCase();
      items = items.filter((recipe) => `${recipe.name} ${recipe.categories.join(' ')}`.toLowerCase().includes(term));
    }
    return items;
  }, [allRecipes, category, favorites, page, personalRecipes, query]);

  const backTo = (target: Page) => {
    setPage(target);
    setSelectedId(null);
    setQuery('');
  };

  const startNewRecipe = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageUri(null);
    setExistingImage(null);
    setPage('form');
  };

  const startEdit = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setForm({
      name: recipe.name,
      ingredients: recipe.ingredients.join('\n'),
      instructions: recipe.instructions.join('\n'),
      prepTime: String(recipe.prepTime),
      servings: String(recipe.servings),
      calories: String(recipe.calories),
      difficulty: recipe.difficulty,
    });
    setImageUri(typeof recipe.image === 'object' && 'uri' in recipe.image ? recipe.image.uri ?? null : null);
    setExistingImage(recipe.image);
    setPage('form');
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow access to your photo library to add a recipe image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const submitRecipe = () => {
    Keyboard.dismiss();
    const ingredients = form.ingredients.split('\n').map((item) => item.trim()).filter(Boolean);
    const instructions = form.instructions.split('\n').map((item) => item.trim()).filter(Boolean);
    if (!form.name.trim() || ingredients.length === 0 || instructions.length === 0) {
      Alert.alert('A little more to add', 'Add a recipe name, at least one ingredient, and at least one step.');
      return;
    }
    const id = editingId ?? `my-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const recipe: Recipe = {
      id,
      name: form.name.trim(),
      image: imageUri ? { uri: imageUri } : existingImage ?? fallbackImage,
      categories: ['My Food'],
      ingredients,
      instructions,
      prepTime: Math.max(1, Number(form.prepTime) || 30),
      servings: Math.max(1, Number(form.servings) || 2),
      calories: Math.max(0, Number(form.calories) || 0),
      difficulty: form.difficulty,
      personal: true,
    };
    saveRecipe(recipe);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    setSelectedId(id);
    setPage('detail');
  };

  const confirmDelete = (recipe: Recipe) => {
    Alert.alert('Delete recipe?', `“${recipe.name}” will be removed from My Recipes.`, [
      { text: 'Keep recipe', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteRecipe(recipe.id); backTo('myRecipes'); } },
    ]);
  };

  const openRecipe = (recipe: Recipe) => {
    setSelectedId(recipe.id);
    setPage('detail');
  };

  const sectionTitle = page === 'favorites' ? 'Your favorites' : page === 'myRecipes' ? 'My recipes' : 'Made for today';
  const pageBackTarget: Page = page === 'detail' ? (selectedRecipe && isPersonal(selectedRecipe) ? 'myRecipes' : 'feed') : page === 'form' ? 'myFood' : 'feed';

  const renderRecipeGrid = () => (
    visibleRecipes.length ? (
      <View style={styles.grid}>
        {visibleRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            favorite={favorites.includes(recipe.id)}
            width={width > 640 ? '48%' : '48%'}
            colors={colors}
            onOpen={() => openRecipe(recipe)}
            onFavorite={() => { toggleFavorite(recipe.id); Haptics.selectionAsync().catch(() => undefined); }}
            onEdit={isPersonal(recipe) ? () => startEdit(recipe) : undefined}
            onDelete={isPersonal(recipe) ? () => confirmDelete(recipe) : undefined}
          />
        ))}
      </View>
    ) : (
      <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.accent }]}>
          <Ionicons name={page === 'favorites' ? 'heart-outline' : 'restaurant-outline'} size={25} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          {page === 'favorites' ? 'Save a little inspiration' : page === 'myRecipes' ? 'Your recipe book is ready' : 'No recipes found'}
        </Text>
        <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
          {page === 'favorites' ? 'Tap the heart on any recipe to keep it close.' : page === 'myRecipes' ? 'Add a recipe you love and it will live here.' : 'Try another search or category.'}
        </Text>
        {page === 'myRecipes' && <PrimaryButton label="Add a recipe" onPress={startNewRecipe} colors={colors} />}
      </View>
    )
  );

  if (!ready) {
    return <View style={[styles.loading, { backgroundColor: colors.background, paddingTop: topInset }]}><Text style={{ color: colors.mutedForeground }}>Opening your recipe book…</Text></View>;
  }

  if (page === 'detail' && selectedRecipe) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <View style={styles.detailTop}>
          <ActionIcon name="arrow-back" onPress={() => backTo(pageBackTarget)} color={colors.foreground} testID="recipe-back" />
          <Text style={[styles.topLabel, { color: colors.mutedForeground }]}>RECIPE</Text>
          <ActionIcon name={favorites.includes(selectedRecipe.id) ? 'heart' : 'heart-outline'} onPress={() => toggleFavorite(selectedRecipe.id)} color={favorites.includes(selectedRecipe.id) ? colors.primary : colors.foreground} testID="detail-favorite" />
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 34 }}>
          <Image source={selectedRecipe.image} style={styles.detailImage} contentFit="cover" transition={180} />
          <View style={styles.detailBody}>
            <View style={styles.tagRow}>{selectedRecipe.categories.filter((tag) => tag !== 'My Food').slice(0, 3).map((tag) => <Text key={tag} style={[styles.tag, { backgroundColor: colors.accent, color: colors.primary }]}>{tag}</Text>)}</View>
            <Text style={[styles.detailTitle, { color: colors.foreground }]}>{selectedRecipe.name}</Text>
            <View style={styles.statsRow}>
              <Stat icon="time-outline" label={`${selectedRecipe.prepTime} min`} colors={colors} />
              <Stat icon="people-outline" label={`${selectedRecipe.servings} servings`} colors={colors} />
              <Stat icon="flame-outline" label={`${selectedRecipe.calories} kcal`} colors={colors} />
              <Stat icon="sparkles-outline" label={selectedRecipe.difficulty} colors={colors} />
            </View>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Ingredients <Text style={[styles.sectionAside, { color: colors.mutedForeground }]}>· {selectedRecipe.ingredients.length} items</Text></Text>
            {selectedRecipe.ingredients.map((ingredient, index) => (
              <View key={`${ingredient}-${index}`} style={[styles.ingredientRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.ingredientDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.ingredientText, { color: colors.foreground }]}>{ingredient}</Text>
              </View>
            ))}
            <Text style={[styles.sectionHeading, { color: colors.foreground, marginTop: 30 }]}>Let’s make it</Text>
            {selectedRecipe.instructions.map((instruction, index) => (
              <View key={`${instruction}-${index}`} style={styles.stepRow}>
                <View style={[styles.stepNumber, { backgroundColor: colors.accent }]}><Text style={{ color: colors.primary, fontWeight: '700' }}>{String(index + 1).padStart(2, '0')}</Text></View>
                <Text style={[styles.stepText, { color: colors.foreground }]}>{instruction}</Text>
              </View>
            ))}
            {isPersonal(selectedRecipe) && (
              <View style={styles.detailActions}>
                <PrimaryButton label="Edit recipe" icon="create-outline" onPress={() => startEdit(selectedRecipe)} colors={colors} />
                <Pressable onPress={() => confirmDelete(selectedRecipe)} style={({ pressed }) => [styles.deleteButton, { borderColor: colors.border }, pressed && styles.pressed]} testID="delete-recipe">
                  <Ionicons name="trash-outline" size={18} color={colors.destructive} /><Text style={{ color: colors.destructive, fontWeight: '700' }}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (page === 'form') {
    const fieldStyle = [styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }];
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <View style={styles.detailTop}>
          <ActionIcon name="arrow-back" onPress={() => backTo('myFood')} color={colors.foreground} testID="form-back" />
          <Text style={[styles.topLabel, { color: colors.foreground }]}>{editingId ? 'EDIT RECIPE' : 'NEW RECIPE'}</Text>
          <View style={{ width: 40 }} />
        </View>
        <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.formBody, { paddingBottom: bottomInset + 36 }]} bottomOffset={70} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>{editingId ? 'Make it yours' : 'What are we cooking?'}</Text>
          <Text style={[styles.formSubtitle, { color: colors.mutedForeground }]}>Keep your favorite recipes in one place.</Text>
          <Pressable onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]} testID="pick-recipe-image">
            {imageUri ? <Image source={{ uri: imageUri }} contentFit="cover" style={StyleSheet.absoluteFill} /> : editingId && selectedRecipe ? <Image source={selectedRecipe.image} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
            <View style={[styles.imagePickerBadge, { backgroundColor: colors.background }]}>
              <Ionicons name="camera-outline" size={17} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>{imageUri || (editingId && selectedRecipe) ? 'Change photo' : 'Add a photo'}</Text>
            </View>
          </Pressable>
          <FormLabel label="Recipe name" colors={colors} />
          <TextInput value={form.name} onChangeText={(name) => setForm((current) => ({ ...current, name }))} placeholder="e.g. Sunday tomato pasta" placeholderTextColor={colors.mutedForeground} style={fieldStyle} testID="recipe-name-input" returnKeyType="next" />
          <FormLabel label="Ingredients · one per line" colors={colors} />
          <TextInput value={form.ingredients} onChangeText={(ingredients) => setForm((current) => ({ ...current, ingredients }))} placeholder={'2 cups cherry tomatoes\nFresh basil\nOlive oil'} placeholderTextColor={colors.mutedForeground} style={[fieldStyle, styles.multiline]} multiline textAlignVertical="top" testID="ingredients-input" />
          <FormLabel label="Steps · one per line" colors={colors} />
          <TextInput value={form.instructions} onChangeText={(instructions) => setForm((current) => ({ ...current, instructions }))} placeholder={'Preheat the oven to 400°F.\nRoast tomatoes until soft.\nToss with pasta and serve.'} placeholderTextColor={colors.mutedForeground} style={[fieldStyle, styles.multiline, { minHeight: 132 }]} multiline textAlignVertical="top" testID="instructions-input" />
          <FormLabel label="A few details" colors={colors} />
          <View style={styles.detailInputs}>
            <SmallInput label="Minutes" value={form.prepTime} onChange={(prepTime) => setForm((current) => ({ ...current, prepTime }))} colors={colors} />
            <SmallInput label="Servings" value={form.servings} onChange={(servings) => setForm((current) => ({ ...current, servings }))} colors={colors} />
            <SmallInput label="Calories" value={form.calories} onChange={(calories) => setForm((current) => ({ ...current, calories }))} colors={colors} />
          </View>
          <View style={styles.difficultyRow}>
            {(['Easy', 'Medium', 'Advanced'] as const).map((difficulty) => (
              <Pressable key={difficulty} onPress={() => setForm((current) => ({ ...current, difficulty }))} style={[styles.difficultyOption, { backgroundColor: form.difficulty === difficulty ? colors.primary : colors.card, borderColor: form.difficulty === difficulty ? colors.primary : colors.border }]}><Text style={{ color: form.difficulty === difficulty ? colors.primaryForeground : colors.foreground, fontWeight: '600' }}>{difficulty}</Text></Pressable>
            ))}
          </View>
          <PrimaryButton label={editingId ? 'Save changes' : 'Save recipe'} icon="checkmark" onPress={submitRecipe} colors={colors} testID="save-recipe" />
        </KeyboardAwareScrollViewCompat>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 28 }}>
        <View style={styles.header}>
          {(page === 'favorites' || page === 'myRecipes') ? (
            <ActionIcon name="arrow-back" onPress={() => backTo('feed')} color={colors.foreground} testID="section-back" />
          ) : (
            <View style={[styles.brandMark, { backgroundColor: colors.primary }]}><Ionicons name="restaurant" size={17} color={colors.primaryForeground} /></View>
          )}
          <View style={styles.brandText}>
            <Text style={[styles.brandName, { color: colors.foreground }]}>{page === 'feed' ? 'Foodie' : sectionTitle}</Text>
            <Text style={[styles.brandCaption, { color: colors.mutedForeground }]}>{page === 'feed' ? 'A little joy, served daily' : page === 'favorites' ? 'Recipes worth keeping' : page === 'myRecipes' ? 'Your kitchen, your rules' : ''}</Text>
          </View>
          <ActionIcon name={page === 'favorites' ? 'heart' : 'heart-outline'} onPress={() => backTo(page === 'favorites' ? 'feed' : 'favorites')} color={page === 'favorites' ? colors.primary : colors.foreground} testID="favorites-toggle" />
        </View>

        {(page === 'feed' || page === 'myFood') && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
            {categories.map((item) => {
              const active = item === 'My Food' ? page === 'myFood' : page === 'feed' && category === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    if (item === 'My Food') { setPage('myFood'); setQuery(''); }
                    else { setPage('feed'); setCategory(item); }
                  }}
                  style={[styles.categoryChip, { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border }]}
                >
                  <Text style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontWeight: active ? '700' : '500' }}>{item}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {page === 'myFood' ? (
          <View style={styles.myFoodBody}>
            <Text style={[styles.sectionHeading, { color: colors.foreground }]}>Your kitchen, your collection</Text>
            <Text style={[styles.myFoodCopy, { color: colors.mutedForeground }]}>Save the recipes you make on repeat, all in one delicious place.</Text>
            <Pressable onPress={startNewRecipe} style={({ pressed }) => [styles.myFoodAction, { backgroundColor: colors.primary }, pressed && styles.pressed]} testID="add-new-recipe">
              <View style={styles.actionIconCircle}><Ionicons name="add" size={22} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.primaryForeground }]}>Add new recipe</Text><Text style={[styles.actionCopy, { color: colors.primaryForeground }]}>Bring a favorite into Foodie</Text></View>
              <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
            </Pressable>
            <Pressable onPress={() => backTo('myRecipes')} style={({ pressed }) => [styles.myFoodAction, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }, pressed && styles.pressed]} testID="my-recipes">
              <View style={[styles.actionIconCircle, { backgroundColor: colors.accent }]}><Ionicons name="book-outline" size={20} color={colors.primary} /></View>
              <View style={{ flex: 1 }}><Text style={[styles.actionTitle, { color: colors.foreground }]}>My recipes</Text><Text style={[styles.actionCopy, { color: colors.mutedForeground }]}>{personalRecipes.length} recipes saved</Text></View>
              <Ionicons name="arrow-forward" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ) : (
          <>
            {page === 'feed' && (
              <View style={[styles.hero, { backgroundColor: colors.secondary }]}>
                <Image source={require('../../assets/images/foodie-pesto.jpg')} style={styles.heroImage} contentFit="cover" transition={200} />
                <View style={[styles.heroOverlay, { backgroundColor: 'rgba(20,26,20,0.25)' }]} />
                <View style={styles.heroContent}>
                  <Text style={styles.heroEyebrow}>TODAY’S LITTLE INSPIRATION</Text>
                  <Text style={styles.heroTitle}>Good food.{'\n'}Good mood.</Text>
                  <Pressable onPress={() => openRecipe(allRecipes.find((recipe) => recipe.id === 'pesto-pasta') ?? allRecipes[0])} style={styles.heroButton}>
                    <Text style={{ color: colors.foreground, fontWeight: '700' }}>Cook something lovely</Text><Ionicons name="arrow-forward" size={17} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
            )}
            {(page === 'feed' || page === 'favorites' || page === 'myRecipes') && (
              <View style={styles.feedBody}>
                {page === 'feed' ? (
                  <>
                    <View style={styles.sectionIntro}>
                      <View><Text style={[styles.sectionHeading, { color: colors.foreground }]}>{category === 'All' ? 'Fresh from the kitchen' : category}</Text><Text style={[styles.sectionAside, { color: colors.mutedForeground }]}>Recipes to make your day</Text></View>
                      <View style={[styles.countBadge, { backgroundColor: colors.accent }]}><Text style={{ color: colors.primary, fontWeight: '700' }}>{visibleRecipes.length}</Text></View>
                    </View>
                    <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Ionicons name="search" size={18} color={colors.mutedForeground} />
                      <TextInput value={query} onChangeText={setQuery} placeholder="Find something delicious" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} returnKeyType="search" testID="recipe-search" />
                      {query.length > 0 && <ActionIcon name="close-circle" onPress={() => setQuery('')} color={colors.mutedForeground} />}
                    </View>
                  </>
                ) : (
                  <View style={styles.sectionIntro}>
                    <View><Text style={[styles.sectionHeading, { color: colors.foreground }]}>{sectionTitle}</Text><Text style={[styles.sectionAside, { color: colors.mutedForeground }]}>{page === 'favorites' ? 'A collection of good ideas' : `${personalRecipes.length} saved in your kitchen`}</Text></View>
                    {page === 'myRecipes' && <Pressable onPress={startNewRecipe} style={[styles.addSmall, { backgroundColor: colors.primary }]}><Ionicons name="add" size={20} color={colors.primaryForeground} /></Pressable>}
                  </View>
                )}
                {renderRecipeGrid()}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function RecipeCard({ recipe, favorite, colors, onOpen, onFavorite, onEdit, onDelete }: {
  recipe: Recipe; favorite: boolean; width: string; colors: ReturnType<typeof useColors>;
  onOpen: () => void; onFavorite: () => void; onEdit?: () => void; onDelete?: () => void;
}) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.recipeCard, { backgroundColor: colors.card }, pressed && styles.cardPressed]} testID={`recipe-${recipe.id}`}>
      <View style={styles.recipeImageWrap}>
        <Image source={recipe.image} style={styles.recipeImage} contentFit="cover" transition={180} />
        <Pressable onPress={(event) => { event.stopPropagation(); onFavorite(); }} style={[styles.favoriteButton, { backgroundColor: colors.background }]} hitSlop={8} accessibilityRole="button" testID={`favorite-${recipe.id}`}>
          <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={18} color={favorite ? colors.primary : colors.foreground} />
        </Pressable>
        {recipe.personal && <View style={[styles.personalBadge, { backgroundColor: colors.background }]}><Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>MY RECIPE</Text></View>}
      </View>
      <View style={styles.recipeCardText}>
        <Text style={[styles.recipeName, { color: colors.foreground }]} numberOfLines={2}>{recipe.name}</Text>
        <View style={styles.recipeMeta}><Ionicons name="time-outline" size={14} color={colors.mutedForeground} /><Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>{recipe.prepTime} min</Text><View style={[styles.metaDot, { backgroundColor: colors.border }]} /><Text style={[styles.recipeMetaText, { color: colors.mutedForeground }]}>{recipe.difficulty}</Text></View>
        {(onEdit || onDelete) && (
          <View style={styles.cardActions}>
            <Pressable onPress={(event) => { event.stopPropagation(); onEdit?.(); }} style={[styles.cardActionButton, { borderColor: colors.border }]} testID={`edit-${recipe.id}`}><Ionicons name="create-outline" size={15} color={colors.primary} /><Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>Edit</Text></Pressable>
            <Pressable onPress={(event) => { event.stopPropagation(); onDelete?.(); }} style={[styles.cardActionButton, { borderColor: colors.border }]} testID={`delete-${recipe.id}`}><Ionicons name="trash-outline" size={15} color={colors.destructive} /><Text style={{ color: colors.destructive, fontWeight: '600', fontSize: 12 }}>Delete</Text></Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function Stat({ icon, label, colors }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.stat}><Ionicons name={icon} size={17} color={colors.primary} /><Text style={[styles.statText, { color: colors.foreground }]}>{label}</Text></View>;
}

function FormLabel({ label, colors }: { label: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={[styles.formLabel, { color: colors.foreground }]}>{label}</Text>;
}

function SmallInput({ label, value, onChange, colors }: { label: string; value: string; onChange: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return <View style={{ flex: 1 }}><Text style={[styles.smallInputLabel, { color: colors.mutedForeground }]}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType="number-pad" style={[styles.smallInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} /></View>;
}

function PrimaryButton({ label, icon, onPress, colors, testID }: { label: string; icon?: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; colors: ReturnType<typeof useColors>; testID?: string }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]} testID={testID}>{icon && <Ionicons name={icon} size={19} color={colors.primaryForeground} />}<Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 21, paddingBottom: 10, gap: 12 },
  brandMark: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandText: { flex: 1 },
  brandName: { fontSize: 21, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  brandCaption: { fontSize: 12, marginTop: 2, fontFamily: 'Inter_400Regular' },
  iconButton: { minWidth: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  detailTop: { height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 },
  categoryRail: { paddingHorizontal: 20, paddingVertical: 9, gap: 8 },
  categoryChip: { paddingHorizontal: 15, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 245, marginHorizontal: 20, marginTop: 12, borderRadius: 23, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFill },
  heroOverlay: { ...StyleSheet.absoluteFill },
  heroContent: { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 20 },
  heroEyebrow: { color: '#fff4dc', fontSize: 9, fontWeight: '700', letterSpacing: 1.6, marginBottom: 8 },
  heroTitle: { color: '#ffffff', fontSize: 30, lineHeight: 33, fontFamily: 'Inter_700Bold', letterSpacing: -1 },
  heroButton: { flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: '#fffaf0', borderRadius: 18, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10 },
  feedBody: { paddingHorizontal: 20, paddingTop: 23 },
  sectionIntro: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionHeading: { fontSize: 20, lineHeight: 26, fontFamily: 'Inter_700Bold', letterSpacing: -0.5 },
  sectionAside: { fontSize: 12, lineHeight: 18, fontFamily: 'Inter_400Regular' },
  countBadge: { minWidth: 32, height: 32, paddingHorizontal: 8, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  searchBox: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, marginBottom: 17 },
  searchInput: { flex: 1, minHeight: 44, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 13, paddingBottom: 10 },
  recipeCard: { width: '48%', minWidth: 145, maxWidth: '49%', borderRadius: 17, overflow: 'hidden', marginBottom: 3 },
  recipeImageWrap: { height: 128, position: 'relative' },
  recipeImage: { width: '100%', height: '100%' },
  favoriteButton: { position: 'absolute', top: 9, right: 9, width: 33, height: 33, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  personalBadge: { position: 'absolute', bottom: 8, left: 8, borderRadius: 9, paddingVertical: 5, paddingHorizontal: 8 },
  recipeCardText: { paddingHorizontal: 11, paddingTop: 10, paddingBottom: 11 },
  recipeName: { fontSize: 13, lineHeight: 18, minHeight: 36, fontFamily: 'Inter_600SemiBold' },
  recipeMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  recipeMetaText: { fontSize: 10 },
  metaDot: { width: 3, height: 3, borderRadius: 2, marginHorizontal: 1 },
  cardActions: { flexDirection: 'row', gap: 6, marginTop: 9 },
  cardActionButton: { flex: 1, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', minHeight: 30, borderWidth: 1, borderRadius: 9 },
  emptyState: { borderRadius: 20, alignItems: 'center', padding: 26, marginTop: 8 },
  emptyIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  emptyCopy: { marginTop: 7, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 260, marginBottom: 14 },
  myFoodBody: { padding: 21, paddingTop: 30 },
  myFoodCopy: { fontSize: 14, lineHeight: 21, marginTop: 6, marginBottom: 24 },
  myFoodAction: { minHeight: 79, flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15, borderRadius: 17, marginBottom: 12 },
  actionIconCircle: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff7df' },
  actionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  actionCopy: { fontSize: 11, marginTop: 4, opacity: 0.82 },
  detailImage: { width: '100%', height: 270 },
  detailBody: { paddingHorizontal: 22, paddingTop: 20 },
  tagRow: { flexDirection: 'row', gap: 7, marginBottom: 11 },
  tag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden', fontSize: 10, fontWeight: '700' },
  detailTitle: { fontSize: 28, lineHeight: 34, letterSpacing: -0.8, fontFamily: 'Inter_700Bold' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 17, marginBottom: 27 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(140,140,140,0.08)', paddingHorizontal: 9, paddingVertical: 8, borderRadius: 12 },
  statText: { fontSize: 10, fontWeight: '600' },
  ingredientRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, gap: 11 },
  ingredientDot: { width: 7, height: 7, borderRadius: 4 },
  ingredientText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, marginTop: 17 },
  stepNumber: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 21, paddingTop: 5, fontFamily: 'Inter_400Regular' },
  detailActions: { gap: 10, marginTop: 28 },
  deleteButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderRadius: 14 },
  formBody: { paddingHorizontal: 20, paddingTop: 16 },
  formTitle: { fontSize: 25, lineHeight: 31, letterSpacing: -0.8, fontFamily: 'Inter_700Bold' },
  formSubtitle: { fontSize: 13, marginTop: 4, marginBottom: 19 },
  imagePicker: { height: 180, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 21 },
  imagePickerBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 15, paddingHorizontal: 13, paddingVertical: 9 },
  formLabel: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 14 },
  input: { minHeight: 47, borderWidth: 1, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14 },
  multiline: { minHeight: 108, paddingTop: 13, lineHeight: 21 },
  detailInputs: { flexDirection: 'row', gap: 9 },
  smallInputLabel: { fontSize: 10, marginBottom: 6 },
  smallInput: { height: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, fontSize: 13 },
  difficultyRow: { flexDirection: 'row', gap: 8, marginVertical: 18 },
  difficultyOption: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1 },
  primaryButton: { minHeight: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, marginTop: 7 },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },
  addSmall: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  pressed: { opacity: 0.78 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});
