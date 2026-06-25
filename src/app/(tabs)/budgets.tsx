import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Dimensions, TouchableOpacity, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Lightbulb, ChevronDown, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { AmbientBackground } from '@/components/ambient-background';
import { FormModal } from '@/components/form-modal';
import { fetchFromAPI } from '@/utils/api';
import { getFiscalPeriod, getDynamicMockTransactions } from '@/utils/fiscal';
import { getCategoryIcon, stripEmoji } from '@/utils/icons';
import Svg, { Circle } from 'react-native-svg';

const COLORS = ['#34D399', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6', '#10B981'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function CategoryCircle({ spent, budget, color }: { spent: number; budget: number; color: string }) {
  const radius = 32;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius; // ~201.0
  const pct = budget > 0 ? spent / budget : 0;
  const strokeDashoffset = circumference * (1 - Math.min(pct, 1));
  const percentText = `${Math.round(pct * 100)}%`;

  return (
    <View style={styles.catCircleContainer}>
      <Svg width={80} height={80} viewBox="0 0 80 80">
        {/* Base Track */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Fill */}
        <Circle
          cx="40"
          cy="40"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
      </Svg>
      <View style={styles.catCircleCenterText}>
        <Text style={styles.catCirclePercentText}>{percentText}</Text>
      </View>
    </View>
  );
}

const MOCK_CATEGORIES = [
  { id: '1', name: 'Living Expenses', monthlyBudget: '40000.00', spent: '12400.00' },
  { id: '2', name: 'Transportation', monthlyBudget: '15000.00', spent: '6800.00' },
  { id: '3', name: 'Entertainment', monthlyBudget: '10000.00', spent: '7900.00' },
];

export default function BudgetsScreen() {
  const router = useRouter();
  const [categoriesList, setCategoriesList] = useState<any[]>(MOCK_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [fiscalCycle, setFiscalCycle] = useState('Current Cycle');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Control
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const loadData = async () => {
    try {
      const dbCategories = await fetchFromAPI('/api/categories');
      const dbTransactions = await fetchFromAPI('/api/transactions');
      
      const transactionsToUse = (dbTransactions && dbTransactions.length > 0)
        ? dbTransactions
        : getDynamicMockTransactions();
      
      const currentPeriod = getFiscalPeriod(new Date());

      if (dbCategories && dbCategories.length > 0) {
        const formattedCategories = dbCategories.map((c: any) => {
          let spent = 0;
          transactionsToUse.forEach((tx: any) => {
            if (tx.categoryId === c.id) {
              const txPeriod = getFiscalPeriod(tx.timestamp);
              if (txPeriod.label === currentPeriod.label) {
                const amt = Number(tx.amount);
                if (amt < 0) {
                  spent += Math.abs(amt);
                }
              }
            }
          });
          return {
            ...c,
            spent: spent.toFixed(2),
          };
        });
        setCategoriesList(formattedCategories);
      } else {
        // Fallback calculation for mock categories
        const enrichedMock = MOCK_CATEGORIES.map((c: any) => {
          let spent = 0;
          transactionsToUse.forEach((tx: any) => {
            if (tx.categoryId === c.id) {
              const txPeriod = getFiscalPeriod(tx.timestamp);
              if (txPeriod.label === currentPeriod.label) {
                const amt = Number(tx.amount);
                if (amt < 0) {
                  spent += Math.abs(amt);
                }
              }
            }
          });
          return {
            ...c,
            spent: spent.toFixed(2),
          };
        });
        setCategoriesList(enrichedMock);
      }
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    loadData();
    const period = getFiscalPeriod(new Date());
    setFiscalCycle(period.label);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleSubmit = async (data: any) => {
    if (modalMode === 'create') {
      await fetchFromAPI('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } else {
      await fetchFromAPI(`/api/categories/${selectedItem.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
    await loadData();
  };

  const handleDelete = async (id: string) => {
    await fetchFromAPI(`/api/categories/${id}`, {
      method: 'DELETE',
    });
    await loadData();
  };

  const totalBudget = categoriesList.reduce((acc, curr) => acc + Number(curr.monthlyBudget || 0), 0);
  const totalSpent = categoriesList.reduce((acc, curr) => acc + Number(curr.spent || 0), 0);

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView style={styles.header} edges={['top']}>
          {/* Centered screen title matching the screenshot */}
          <Text style={styles.centeredTitle}>Monthly Budget</Text>
          
          {/* Calendar Cycle Selector Dropdown */}
          <View style={styles.cycleDropdownContainer}>
            <Calendar size={16} color="#A1A1AA" />
            <Text style={styles.cycleDropdownText}>{fiscalCycle}</Text>
            <ChevronDown size={14} color="#A1A1AA" />
          </View>
        </SafeAreaView>

        {/* Main Progress Circle Section flanked by buttons */}
        <View style={styles.mainCircleRow}>
          {/* Insights Lightbulb Action */}
          <TouchableOpacity 
            style={styles.circleActionButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/insights')}
          >
            <Lightbulb size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Main remaining progress ring */}
          <View style={styles.mainProgressContainer}>
            <Svg width={220} height={220} viewBox="0 0 220 220">
              <Circle
                cx="110"
                cy="110"
                r={94}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={16}
                fill="transparent"
              />
              <Circle
                cx="110"
                cy="110"
                r={94}
                stroke="#34D399" // Vibrant emerald/green to indicate positive budget left
                strokeWidth={16}
                fill="transparent"
                strokeDasharray={2 * Math.PI * 94}
                strokeDashoffset={2 * Math.PI * 94 * (1 - (totalBudget > 0 ? Math.max(0, (totalBudget - totalSpent) / totalBudget) : 0))}
                strokeLinecap="round"
                transform="rotate(-90 110 110)"
              />
            </Svg>
            <View style={styles.mainCircleTextWrapper}>
              <Text style={styles.mainCircleLabel}>Remaining</Text>
              <Text style={styles.mainCircleValue} numberOfLines={1}>
                Ksh {(totalBudget - totalSpent).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </View>
          </View>

          {/* Add Category Plus Action */}
          <TouchableOpacity 
            style={styles.circleActionButton} 
            activeOpacity={0.8}
            onPress={handleOpenCreate}
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Subtle Search Bar above categories grid */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Search size={16} color="rgba(255, 255, 255, 0.4)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              style={styles.searchBarInput}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories Grid list */}
        <View style={styles.gridContainer}>
          {categoriesList.filter(cat => 
            stripEmoji(cat.name).toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
            <View style={styles.emptyGridContainer}>
              <Text style={styles.emptyGridText}>No matching budgets found</Text>
            </View>
          ) : (
            categoriesList
              .filter(cat => 
                stripEmoji(cat.name).toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((cat) => {
                const spent = Number(cat.spent || 0);
                const budget = Number(cat.monthlyBudget || 0);
                const remaining = budget - spent;
                const isOver = remaining < 0;
                
                // Color mapping: reuse colors for categories circles
                const originalIdx = categoriesList.findIndex(c => c.id === cat.id);
                const categoryColor = COLORS[originalIdx >= 0 ? originalIdx % COLORS.length : 0];
                const cleanName = stripEmoji(cat.name);

                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.gridItemCard}
                    activeOpacity={0.85}
                    onPress={() => handleOpenEdit(cat)}
                  >
                    {/* Category progress circle */}
                    <CategoryCircle 
                      spent={spent} 
                      budget={budget} 
                      color={categoryColor} 
                    />

                    {/* Category Label */}
                    <Text style={styles.gridItemLabel} numberOfLines={1}>
                      {cleanName}
                    </Text>

                    {/* Category Whats Left text */}
                    <Text style={[styles.gridItemLeftText, { color: isOver ? '#EF4444' : 'rgba(255, 255, 255, 0.45)' }]}>
                      {isOver 
                        ? `${Math.abs(remaining).toLocaleString('en-US', { maximumFractionDigits: 0 })} over` 
                        : `${remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })} left`
                      }
                    </Text>
                  </TouchableOpacity>
                );
              })
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <FormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type="category"
        mode={modalMode}
        initialData={selectedItem}
        accounts={[]}
        categories={[]}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  centeredTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  cycleDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cycleDropdownText: {
    color: '#E4E4E7',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  mainCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 32,
    paddingHorizontal: 24,
  },
  circleActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  mainProgressContainer: {
    position: 'relative',
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCircleTextWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  mainCircleLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.45)',
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  mainCircleValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchBarInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter',
    padding: 0,
  },
  clearSearchText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
  },
  gridItemCard: {
    width: (SCREEN_WIDTH - 24) / 3, // exactly 3 columns
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  catCircleContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCircleCenterText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catCirclePercentText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  gridItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Inter',
    paddingHorizontal: 4,
  },
  gridItemLeftText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'Inter',
  },
  emptyGridContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
    width: '100%',
  },
  emptyGridText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  spacer: {
    height: 40,
  },
});
