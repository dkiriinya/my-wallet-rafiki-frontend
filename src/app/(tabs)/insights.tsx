import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Calendar, AlertCircle, ChevronLeft, ChevronRight, ArrowDownRight, ArrowUpRight, Flame, Layers } from 'lucide-react-native';
import { fetchFromAPI } from '@/utils/api';
import { getFiscalPeriod, getDynamicMockTransactions } from '@/utils/fiscal';
import { getCategoryIcon, stripEmoji } from '@/utils/icons';
import { AmbientBackground } from '@/components/ambient-background';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DONUT_SIZE = SCREEN_WIDTH * 0.75;

const MOCK_BUDGET_STATS = {
  totalBudget: 65000,
  totalSpent: 27100,
  categories: [
    { id: '1', name: 'Living Expenses', budget: 40000, spent: 12400, color: '#34D399' },
    { id: '2', name: 'Transportation', budget: 15000, spent: 6800, color: '#3B82F6' },
    { id: '3', name: 'Entertainment', budget: 10000, spent: 7900, color: '#EC4899' },
  ]
};

const MOCK_WEEKLY_TREND = [12400, 6800, 7900, 0];

const MOCK_TOP_EXPENSES = [
  { id: '1', description: 'Grocery Purchase Naivas', amount: '-4500.00', timestamp: '2026-06-25T14:30:00Z', categoryName: 'Living Expenses' },
  { id: '2', description: 'KPLC Tokens', amount: '-1200.00', timestamp: '2026-06-24T18:10:00Z', categoryName: 'Living Expenses' },
];

// Custom Donut Chart component using standard react-native-svg
function DonutChart({ categories, totalBudget }: { categories: any[], totalBudget: number }) {
  const radius = 38;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const activeCircumference = circumference * (300 / 360); // 300 degree gauge
  
  let accumulatedPercent = 0;
  
  if (totalBudget === 0 || categories.length === 0) {
    return (
      <View style={styles.donutWrapper}>
        <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox="0 0 100 100">
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${activeCircumference} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform="rotate(-240, 50, 50)" // Align gap at top
          />
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutCenterValue}>Ksh 0</Text>
          <Text style={styles.donutCenterLabel}>total per month</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.donutWrapper}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox="0 0 100 100">
        {/* Base Track Background in the active area */}
        <G rotation="-60" origin="50, 50">
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${activeCircumference} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
          />

          {categories.map((cat) => {
            const pct = cat.budget / totalBudget;
            if (pct <= 0) return null;
            
            const strokeLength = activeCircumference * pct;
            const strokeOffset = - (activeCircumference * accumulatedPercent);
            
            // Calculate midpoint of segment for text positioning
            const midPercent = accumulatedPercent + pct / 2;
            const midAngleRotated = midPercent * 300;
            const midAngle = midAngleRotated - 60; // relative to SVG 0
            const rad = (midAngle * Math.PI) / 180;
            const textX = 50 + radius * Math.cos(rad);
            const textY = 50 + radius * Math.sin(rad);
            
            accumulatedPercent += pct;
            const displayPct = (pct * 100).toFixed(0) + '%';
            
            const cleanName = stripEmoji(cat.name).trim();
            const firstWord = cleanName.split(/[\s-_]+/)[0];
            const shortName = firstWord.length > 7 ? firstWord.slice(0, 6) + '..' : firstWord;
            
            let labelText = '';
            if (pct >= 0.08) {
              labelText = `${shortName} ${displayPct}`;
            } else if (pct >= 0.04) {
              labelText = displayPct;
            }
            
            return (
              <G key={cat.name}>
                <Circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={cat.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeLength} ${circumference}`}
                  strokeDashoffset={strokeOffset}
                  fill="transparent"
                  strokeLinecap="round"
                />
                {labelText ? (
                  <SvgText
                    x={textX}
                    y={textY}
                    fill="rgba(9, 9, 11, 0.85)"
                    fontSize="3"
                    fontWeight="700"
                    textAnchor="middle"
                    dy="1.2"
                    rotation={midAngle + 90}
                    origin={`${textX}, ${textY}`}
                  >
                    {labelText}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </G>
      </Svg>

      {/* Top Gap Wallet/Card Icon Badge */}
      <View style={styles.donutTopBadge}>
        <Layers size={14} color="#09090B" />
      </View>

      <View style={styles.donutCenter}>
        <Text style={styles.donutCenterValue}>
          Ksh {totalBudget.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </Text>
        <Text style={styles.donutCenterLabel}>total per month</Text>
      </View>
    </View>
  );
}

export default function Insights() {
  const [stats, setStats] = useState(MOCK_BUDGET_STATS);
  const [weeklyTrend, setWeeklyTrend] = useState<number[]>(MOCK_WEEKLY_TREND);
  const [topExpenses, setTopExpenses] = useState<any[]>(MOCK_TOP_EXPENSES);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [fiscalCycle, setFiscalCycle] = useState('Current Cycle');
  
  // Design control state
  const [activeTab, setActiveTab] = useState<'weekly' | 'categories'>('weekly');
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  
  // Financial stats states
  const [totalBalance, setTotalBalance] = useState(116750.00);
  const [totalIncome, setTotalIncome] = useState(120000.00);
  const [totalExpenses, setTotalExpenses] = useState(8050.00);

  const loadData = async () => {
    try {
      const dbAccounts = await fetchFromAPI('/api/accounts');
      if (dbAccounts) {
        const balance = dbAccounts.reduce((acc: number, curr: any) => acc + Number(curr.balance), 0);
        setTotalBalance(balance);
      }

      const dbCategories = await fetchFromAPI('/api/categories');
      const dbTransactions = await fetchFromAPI('/api/transactions');
      
      const transactionsToUse = (dbTransactions && dbTransactions.length > 0)
        ? dbTransactions
        : getDynamicMockTransactions();
      
      if (dbCategories) {
        const currentPeriod = getFiscalPeriod(new Date());
        const colors = ['#34D399', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6', '#10B981'];
        
        // Calculate spent per category
        const formattedCategories = dbCategories.map((c: any, index: number) => {
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
            id: c.id,
            name: c.name,
            budget: Number(c.monthlyBudget),
            spent: spent,
            color: colors[index % colors.length]
          };
        });

        // Compute income and expenses for current fiscal period
        let incomeSum = 0;
        let expensesSum = 0;
        transactionsToUse.forEach((tx: any) => {
          const txPeriod = getFiscalPeriod(tx.timestamp);
          if (txPeriod.label === currentPeriod.label) {
            const amt = Number(tx.amount || 0);
            if (amt > 0) {
              incomeSum += amt;
            } else if (amt < 0) {
              expensesSum += Math.abs(amt);
            }
          }
        });
        setTotalIncome(incomeSum);
        setTotalExpenses(expensesSum);

        // Calculate weekly spending trend (current cycle)
        const weeklySpend = [0, 0, 0, 0]; // W1, W2, W3, W4
        const cycleTx: any[] = [];
        
        transactionsToUse.forEach((tx: any) => {
          const txPeriod = getFiscalPeriod(tx.timestamp);
          if (txPeriod.label === currentPeriod.label) {
            const amt = Number(tx.amount);
            if (amt < 0) {
              cycleTx.push(tx);
              const date = new Date(tx.timestamp);
              const day = date.getDate();
              
              // Map day to W1 (25-end), W2 (1-7), W3 (8-15), W4 (16-24)
              let weekIdx = 0;
              if (day >= 25) {
                weekIdx = 0;
              } else if (day >= 1 && day <= 7) {
                weekIdx = 1;
              } else if (day >= 8 && day <= 15) {
                weekIdx = 2;
              } else {
                weekIdx = 3;
              }
              weeklySpend[weekIdx] += Math.abs(amt);
            }
          }
        });
        
        // Group top 3 expenses
        const catMap = new Map(dbCategories.map((c: any) => [c.id, c.name]));
        const sortedExpenses = cycleTx
          .sort((a, b) => Number(a.amount) - Number(b.amount)) // Descending expense (most negative first)
          .slice(0, 3)
          .map(tx => ({
            ...tx,
            categoryName: tx.categoryId ? catMap.get(tx.categoryId) || 'Categorized' : 'Uncategorized'
          }));
        
        setTopExpenses(sortedExpenses);

        const totalBudget = formattedCategories.reduce((acc: number, curr: any) => acc + curr.budget, 0);
        const totalSpent = formattedCategories.reduce((acc: number, curr: any) => acc + curr.spent, 0);
        
        setStats({
          totalBudget,
          totalSpent,
          categories: formattedCategories
        });
        
        setWeeklyTrend(weeklySpend);
        setTransactionsList(transactionsToUse);
      }
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    const period = getFiscalPeriod(new Date());
    setFiscalCycle(period.label);
    loadData();
  }, []);

  const totalSpent = stats.categories.reduce((acc, c) => acc + c.spent, 0);
  const totalBudget = stats.totalBudget;

  const maxWeeklySpend = Math.max(...weeklyTrend, 1);
  const highestWeekIndex = weeklyTrend.indexOf(Math.max(...weeklyTrend));
  const weekLabels = [
    { name: 'W1', desc: '25th - EOM', days: '25th to End' },
    { name: 'W2', desc: '1st - 7th', days: '1st to 7th' },
    { name: 'W3', desc: '8th - 15th', days: '8th to 15th' },
    { name: 'W4', desc: '16th - 24th', days: '16th to 24th' },
  ];

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Grouped transactions computation
  const currentPeriod = getFiscalPeriod(new Date());
  
  // 1. Filter transactions to current fiscal cycle and only expenses
  const cycleExpenses = transactionsList.filter((tx: any) => {
    const txPeriod = getFiscalPeriod(tx.timestamp);
    const amountVal = Number(tx.amount || 0);
    return txPeriod.label === currentPeriod.label && amountVal < 0;
  });

  // Helper to resolve week index
  const getWeekIndexForDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    if (day >= 25) {
      return 0;
    } else if (day >= 1 && day <= 7) {
      return 1;
    } else if (day >= 8 && day <= 15) {
      return 2;
    } else {
      return 3;
    }
  };

  // 2. Filter further by active week if on the weekly tab and week is selected
  const filteredExpenses = cycleExpenses.filter((tx: any) => {
    if (activeTab === 'weekly' && activeWeek !== null) {
      return getWeekIndexForDate(tx.timestamp) === activeWeek;
    }
    return true;
  });

  // 3. Group by category
  const categoryGroupsMap: { [key: string]: { id: string | null, name: string, color: string, spent: number, transactions: any[] } } = {};

  // Initialize from categories in stats
  const categoryColors = ['#34D399', '#3B82F6', '#EC4899', '#F59E0B', '#8B5CF6', '#10B981'];
  
  stats.categories.forEach((cat, index) => {
    categoryGroupsMap[cat.id] = {
      id: cat.id,
      name: cat.name,
      color: cat.color || categoryColors[index % categoryColors.length],
      spent: 0,
      transactions: []
    };
  });

  const UNCATEGORIZED_ID = 'uncategorized';
  categoryGroupsMap[UNCATEGORIZED_ID] = {
    id: null,
    name: 'Uncategorized',
    color: '#71717A',
    spent: 0,
    transactions: []
  };

  // Populate groups
  filteredExpenses.forEach((tx: any) => {
    const catId = tx.categoryId || UNCATEGORIZED_ID;
    const amountVal = Math.abs(Number(tx.amount || 0));
    
    if (!categoryGroupsMap[catId]) {
      categoryGroupsMap[catId] = {
        id: catId === UNCATEGORIZED_ID ? null : catId,
        name: tx.categoryName || 'Categorized',
        color: '#A1A1AA',
        spent: 0,
        transactions: []
      };
    }
    
    categoryGroupsMap[catId].spent += amountVal;
    categoryGroupsMap[catId].transactions.push(tx);
  });

  // Filter out empty groups and sort descending by spent
  const sortedCategoryGroups = Object.values(categoryGroupsMap)
    .filter(g => g.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      
      {/* Top Header Section */}
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Financial Insights</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'weekly' && styles.tabButtonActive]}
            onPress={() => setActiveTab('weekly')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'weekly' && styles.tabButtonTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'categories' && styles.tabButtonActive]}
            onPress={() => setActiveTab('categories')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'categories' && styles.tabButtonTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >

        {/* Main focal card containing chart */}
        <View style={styles.mainCard}>
          {/* Date Selector */}
          <View style={styles.dateSelector}>
            <TouchableOpacity style={styles.chevronButton}>
              <ChevronLeft size={16} color="#A1A1AA" />
            </TouchableOpacity>
            <Text style={styles.dateSelectorText}>{fiscalCycle}</Text>
            <TouchableOpacity style={styles.chevronButton}>
              <ChevronRight size={16} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {/* Balance figure */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceValue}>
              Ksh <Text style={styles.monoNumber}>
                {activeTab === 'weekly'
                  ? (activeWeek !== null ? weeklyTrend[activeWeek] : totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })
                  : (totalIncome - totalExpenses).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </Text>
            <Text style={styles.balanceLabel}>
              {activeTab === 'weekly'
                ? (activeWeek !== null ? `Week ${activeWeek + 1} Expenses` : 'Expense cycle total')
                : 'Net Cash Flow'}
            </Text>
          </View>

          {/* Conditional chart rendering */}
          {activeTab === 'weekly' ? (
            /* Vertical Capsule chart based on user's layout */
            <View style={styles.capsuleChartContainer}>
              {weeklyTrend.map((spend, idx) => {
                const ratio = spend / maxWeeklySpend;
                const fillHeight = `${Math.min(ratio * 100, 100)}%`;
                const isActive = activeWeek === idx;

                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.85}
                    onPress={() => setActiveWeek(isActive ? null : idx)}
                    style={styles.capsuleCol}
                  >
                    <View style={styles.capsuleTrack}>
                      <View
                        style={[
                          styles.capsuleFill,
                          {
                            height: fillHeight as any,
                            backgroundColor: isActive ? '#34D399' : 'rgba(52, 211, 153, 0.45)',
                          },
                        ]}
                      />
                    </View>
                    <View style={styles.capsuleLabelCol}>
                      <Text style={[styles.capsuleDayLabel, isActive && styles.capsuleLabelActive]}>
                        {weekLabels[idx].name}
                      </Text>
                      <Text style={styles.capsuleSubLabel}>
                        {idx + 1}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* Monthly comparison bar chart (Income vs Expenses) */
            <View style={styles.monthlyChartContainer}>
              {/* Income Column */}
              <View style={styles.monthlyCapsuleCol}>
                <View style={[styles.capsuleTrack, { width: 16 }]}>
                  <View
                    style={[
                      styles.capsuleFill,
                      {
                        height: `${Math.min((totalIncome / Math.max(totalIncome, totalExpenses, 1)) * 100, 100)}%` as any,
                        backgroundColor: '#10B981',
                      },
                    ]}
                  />
                </View>
                <View style={styles.capsuleLabelCol}>
                  <Text style={styles.capsuleDayLabel}>INCOME</Text>
                  <Text style={styles.capsuleSubLabel}>
                    Ksh {totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>

              {/* Expenses Column */}
              <View style={styles.monthlyCapsuleCol}>
                <View style={[styles.capsuleTrack, { width: 16 }]}>
                  <View
                    style={[
                      styles.capsuleFill,
                      {
                        height: `${Math.min((totalExpenses / Math.max(totalIncome, totalExpenses, 1)) * 100, 100)}%` as any,
                        backgroundColor: '#F43F5E',
                      },
                    ]}
                  />
                </View>
                <View style={styles.capsuleLabelCol}>
                  <Text style={styles.capsuleDayLabel}>EXPENSES</Text>
                  <Text style={styles.capsuleSubLabel}>
                    Ksh {totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Section title sitting directly on background */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeader}>Transaction Summary</Text>
        </View>

        {/* Grouped transactions in matte card containers */}
        <View style={styles.groupedListContainer}>
          {sortedCategoryGroups.length === 0 ? (
            <Text style={styles.emptyText}>
              {activeTab === 'weekly' && activeWeek !== null 
                ? `No transactions recorded for Week ${activeWeek + 1}.` 
                : 'No transaction expenses recorded.'}
            </Text>
          ) : (
            sortedCategoryGroups.map((group) => {
              const IconComponent = getCategoryIcon(group.name);
              const cleanCatName = stripEmoji(group.name);
              
              return (
                <View key={group.id || group.name} style={styles.categoryMatteCard}>
                  {/* Category Header Row inside Card */}
                  <View style={styles.categoryCardHeader}>
                    <View style={styles.categoryCardHeaderLeft}>
                      <View style={[styles.categoryIconCircle, { backgroundColor: `${group.color}15` }]}>
                        <IconComponent size={15} color={group.color} />
                      </View>
                      <Text style={styles.categoryCardName} numberOfLines={1}>
                        {cleanCatName}
                      </Text>
                    </View>
                    <Text style={[styles.categoryCardSpentText, { color: group.color }]}>
                      Ksh {group.spent.toLocaleString('en-US', { maximumFractionDigits: 0 })} spent
                    </Text>
                  </View>

                  {/* Divider */}
                  <View style={styles.matteCardDivider} />

                  {/* Transactions list in subcategory */}
                  <View style={styles.transactionsSublist}>
                    {group.transactions.map((tx, idx) => {
                      const cleanDesc = stripEmoji(tx.description);
                      const amountVal = Math.abs(Number(tx.amount));
                      
                      return (
                        <View key={tx.id}>
                          {idx > 0 && <View style={styles.sublistItemDivider} />}
                          <View style={styles.transactionRow}>
                            <View style={styles.txRowLeft}>
                              <Text style={styles.txDescription} numberOfLines={1}>
                                {cleanDesc}
                              </Text>
                              <Text style={styles.txDateText}>
                                {formatDate(tx.timestamp)}
                              </Text>
                            </View>
                            <Text style={styles.txAmountText}>
                              -Ksh {amountVal.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Dynamic Tip block */}
        {activeTab === 'weekly' && (
          <View style={styles.tipBlock}>
            <AlertCircle size={16} color="#34D399" />
            <Text style={styles.tipText}>
              {activeWeek !== null ? (
                <>
                  <Text style={styles.boldText}>{weekLabels[activeWeek].name} ({weekLabels[activeWeek].days}): </Text>
                  Expenditure is <Text style={styles.boldMono}>Ksh {weeklyTrend[activeWeek].toLocaleString()}</Text>.
                </>
              ) : (
                <>
                  Highest spend was in <Text style={styles.boldText}>{weekLabels[highestWeekIndex].name}</Text> (<Text style={styles.boldMono}>Ksh {weeklyTrend[highestWeekIndex].toLocaleString()}</Text>). Select bars above to inspect.
                </>
              )}
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  headerSafeArea: {
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#71717A',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    alignItems: 'center',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  chevronButton: {
    padding: 4,
  },
  dateSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginHorizontal: 12,
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#71717A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  capsuleChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    height: 150,
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  capsuleCol: {
    alignItems: 'center',
    flex: 1,
  },
  capsuleTrack: {
    width: 24,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  capsuleFill: {
    width: '100%',
    borderRadius: 12,
  },
  capsuleLabelCol: {
    alignItems: 'center',
    marginTop: 8,
  },
  capsuleDayLabel: {
    fontSize: 12,
    fontFamily: 'Inter',
    color: '#71717A',
    fontWeight: '600',
  },
  capsuleSubLabel: {
    fontSize: 9,
    color: '#3F3F46',
    marginTop: 1,
  },
  capsuleLabelActive: {
    color: '#34D399',
    fontWeight: '700',
  },
  donutWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    height: DONUT_SIZE,
    width: DONUT_SIZE,
    marginVertical: 16,
    alignSelf: 'center',
  },
  donutTopBadge: {
    position: 'absolute',
    top: DONUT_SIZE * 0.12 - 16,
    alignSelf: 'center',
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#DFFF00', // Bright lime yellow
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#09090B',
    shadowColor: '#DFFF00',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  donutCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterValue: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  donutCenterLabel: {
    fontSize: 13,
    color: '#71717A',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionHeaderContainer: {
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  monthlyChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  monthlyCapsuleCol: {
    alignItems: 'center',
    width: 100,
    height: '100%',
    justifyContent: 'flex-end',
  },
  groupedListContainer: {
    gap: 16,
    marginBottom: 16,
    width: '100%',
  },
  categoryMatteCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)', // Matte gray glass card
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  categoryCardSpentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  matteCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 12,
  },
  transactionsSublist: {
    gap: 10,
  },
  sublistItemDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginVertical: 10,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txRowLeft: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    marginRight: 10,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  txDateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tipBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.1)',
    padding: 14,
    borderRadius: 20,
    marginTop: 8,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#A1A1AA',
    flex: 1,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monoNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  boldMono: {
    fontFamily: 'Inter-Bold',
    fontWeight: '700',
  },
  emptyText: {
    color: '#71717A',
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 12,
  },
  spacer: {
    height: 40,
  },
});
