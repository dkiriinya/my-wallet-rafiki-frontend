import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, RefreshControl, Dimensions, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Cpu, CreditCard, Layers, Flame, Inbox, ArrowDownLeft, ArrowUpRight, Search, Play } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BalanceHeaderCard } from '@/components/balance-header-card';
import { fetchFromAPI } from '@/utils/api';
import { getFiscalPeriod, getDynamicMockTransactions } from '@/utils/fiscal';
import { getAccountIcon, getCategoryIcon, stripEmoji } from '@/utils/icons';
import { AmbientBackground } from '@/components/ambient-background';
import { FormModal } from '@/components/form-modal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock data fallbacks for standalone preview
const MOCK_ACCOUNTS = [
  { id: '1', name: 'M-Pesa Wallet', balance: '25450.00' },
  { id: '2', name: 'Equity Bank', balance: '87900.00' },
  { id: '3', name: 'Cash', balance: '3400.00' },
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Living Expenses', monthlyBudget: '40000.00', spent: '12400.00' },
  { id: '2', name: 'Transportation', monthlyBudget: '15000.00', spent: '6800.00' },
  { id: '3', name: 'Entertainment', monthlyBudget: '10000.00', spent: '7900.00' },
];

const CARD_BACKGROUNDS = [
  { bg: '#1E1B4B', border: '#4338CA' }, // Indigo Dark
  { bg: '#064E3B', border: '#0F766E' }, // Emerald Dark
  { bg: '#581C87', border: '#7E22CE' }, // Purple Dark
  { bg: '#881337', border: '#BE123C' }, // Crimson Dark
];

export default function CommandCenter() {
  const router = useRouter();
  const [accountsList, setAccountsList] = useState<any[]>(MOCK_ACCOUNTS);
  const [categoriesList, setCategoriesList] = useState<any[]>(MOCK_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [fiscalCycle, setFiscalCycle] = useState('Current Cycle');
  const [totalIncome, setTotalIncome] = useState(120000.00);
  const [totalExpenses, setTotalExpenses] = useState(8050.00);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Modal control states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'account' | 'category' | 'transaction'>('account');
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const dbAccounts = await fetchFromAPI('/api/accounts');
      const dbCategories = await fetchFromAPI('/api/categories');
      const dbTransactions = await fetchFromAPI('/api/transactions');
      
      const transactionsToUse = (dbTransactions && dbTransactions.length > 0)
        ? dbTransactions
        : getDynamicMockTransactions();

      // Sort and slice top 3 recent transactions
      const sorted = [...transactionsToUse].sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentTransactions(sorted.slice(0, 3));
      
      const currentPeriod = getFiscalPeriod(new Date());
      const accountSpentMap: Record<string, number> = {};

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
          
          // Track monthly spent per account
          const accId = tx.accountId;
          if (accId && amt < 0) {
            accountSpentMap[accId] = (accountSpentMap[accId] || 0) + Math.abs(amt);
          }
        }
      });
      setTotalIncome(incomeSum);
      setTotalExpenses(expensesSum);

      if (dbAccounts && dbAccounts.length > 0) {
        const enrichedAccounts = dbAccounts.map((acc: any) => ({
          ...acc,
          monthlySpent: accountSpentMap[acc.id] || 0,
        }));
        setAccountsList(enrichedAccounts);
      } else {
        const enrichedMock = MOCK_ACCOUNTS.map((acc: any) => ({
          ...acc,
          monthlySpent: accountSpentMap[acc.id] || 0,
        }));
        setAccountsList(enrichedMock);
      }
      
      if (dbCategories) {
        // Sum spent for each category in the current fiscal period
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
      }
    } catch (e) {
      // Fallback already set or log
    }
  };

  useEffect(() => {
    loadData();
    // Compute current cycle label based on 25-to-25 logic
    const period = getFiscalPeriod(new Date());
    setFiscalCycle(period.label);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Mutate handlers
  const handleOpenCreate = (type: 'account' | 'category') => {
    setModalType(type);
    setModalMode('create');
    setSelectedItem(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (type: 'account' | 'category', item: any) => {
    setModalType(type);
    setModalMode('edit');
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleOpenCreateTransaction = (defaultType: 'income' | 'expense') => {
    setModalType('transaction');
    setModalMode('create');
    setSelectedItem({ txType: defaultType });
    setModalVisible(true);
  };

  const handleSubmit = async (data: any) => {
    if (modalType === 'account') {
      if (modalMode === 'create') {
        await fetchFromAPI('/api/accounts', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } else {
        await fetchFromAPI(`/api/accounts/${selectedItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
    } else if (modalType === 'category') {
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
    } else if (modalType === 'transaction') {
      if (modalMode === 'create') {
        await fetchFromAPI('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } else {
        await fetchFromAPI(`/api/transactions/${selectedItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      }
    }
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (modalType === 'account') {
      await fetchFromAPI(`/api/accounts/${id}`, {
        method: 'DELETE',
      });
    } else if (modalType === 'category') {
      await fetchFromAPI(`/api/categories/${id}`, {
        method: 'DELETE',
      });
    } else if (modalType === 'transaction') {
      await fetchFromAPI(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
    }
    await loadData();
  };

  // Calculate total wealth
  const totalBalance = accountsList.reduce((acc, curr) => acc + Number(curr.balance), 0);

  // Format categorySpent values to compact text like "12.4K"
  const formatCompact = (numStr: string | number) => {
    const val = Number(numStr);
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}K`;
    }
    return val.toString();
  };

  // Helper for transaction icon rendering
  const renderTxIcon = (description: string, categoryName: string) => {
    const cleanDesc = description.toLowerCase();
    
    if (cleanDesc.includes('youtube')) {
      return (
        <View style={[styles.txIconCircle, { backgroundColor: '#EF4444' }]}>
          <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
        </View>
      );
    }
    
    if (cleanDesc.includes('google') || cleanDesc.includes('gpay')) {
      return (
        <View style={[styles.txIconCircle, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.txIconLetter, { color: '#4285F4', fontWeight: '900' }]}>G</Text>
        </View>
      );
    }
    
    if (cleanDesc.includes('salary')) {
      return (
        <View style={[styles.txIconCircle, { backgroundColor: '#8B5CF6' }]}>
          <Text style={styles.txIconLetter}>S</Text>
        </View>
      );
    }

    // Fallback: category icon
    const IconComponent = getCategoryIcon(categoryName || '');
    return (
      <View style={[styles.txIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }]}>
        <IconComponent size={18} color="#A1A1AA" />
      </View>
    );
  };

  // Helper for formatting transaction dates matching the format in screenshot (e.g. 10 May 2025)
  const formatTxDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      const day = date.getDate();
      const monthsFull = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = monthsFull[date.getMonth()];
      const year = date.getFullYear();
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      return `${dayStr} ${month} ${year}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <AmbientBackground />
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header - Scrolls down */}
        <SafeAreaView style={styles.scrollHeader} edges={['top']}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.cycleLabel}>{fiscalCycle.toUpperCase()}</Text>
              <Text style={styles.title}>Home</Text>
            </View>
            <View style={styles.headerRightActions}>
              <TouchableOpacity 
                style={styles.inboxButton} 
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/clearing')}
              >
                <Inbox size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.8}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop' }} 
                  style={styles.avatarImage} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <BalanceHeaderCard 
            totalBalance={totalBalance}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
          />
        </SafeAreaView>

        {/* Quick Actions row */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => handleOpenCreateTransaction('expense')}
          >
            <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <ArrowDownLeft size={20} color="#F87171" />
            </View>
            <Text style={styles.quickActionLabel}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => handleOpenCreateTransaction('income')}
          >
            <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <ArrowUpRight size={20} color="#34D399" />
            </View>
            <Text style={styles.quickActionLabel}>Receive</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/budgets')}
          >
            <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <Layers size={20} color="#A78BFA" />
            </View>
            <Text style={styles.quickActionLabel}>Add Budget</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionItem}
            activeOpacity={0.8}
            onPress={() => handleOpenCreate('account')}
          >
            <View style={[styles.quickActionIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <CreditCard size={20} color="#60A5FA" />
            </View>
            <Text style={styles.quickActionLabel}>Add Card</Text>
          </TouchableOpacity>
        </View>

        {/* Section Header for Accounts - moved lower */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <View style={styles.sectionHeaderLeft}>
            <CreditCard size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Accounts</Text>
          </View>
          <TouchableOpacity onPress={() => handleOpenCreate('account')} style={styles.addButton}>
            <Plus size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Slider of Debit/Credit Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.accountsCarousel}
          snapToInterval={SCREEN_WIDTH * 0.82 + 16}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {accountsList.map((acc, index) => {
            const cleanName = stripEmoji(acc.name);
            const styleTheme = CARD_BACKGROUNDS[index % CARD_BACKGROUNDS.length];
            
            return (
              <TouchableOpacity
                key={acc.id}
                style={[
                  styles.debitCard,
                  { backgroundColor: styleTheme.bg, borderColor: styleTheme.border }
                ]}
                activeOpacity={0.9}
                onPress={() => handleOpenEdit('account', acc)}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardNameText}>{cleanName}</Text>
                  <Cpu size={32} color="rgba(255,255,255,0.7)" />
                </View>

                <Text style={styles.cardBalance}>
                  Ksh <Text style={styles.monoNumber}>{Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                </Text>

                <View style={styles.cardBottomRow}>
                  <Text style={styles.cardMetricText}>
                    Spent this cycle: Ksh {(acc.monthlySpent || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <Layers size={22} color="rgba(255,255,255,0.4)" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Recent Transactions Card */}
        <View style={styles.recentTransactionsCard}>
          <View style={styles.recentTxHeaderRow}>
            <Text style={styles.recentTxTitle}>Recent transactions</Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/insights')}
            >
              <Text style={styles.seeAllButtonText}>See all</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <Text style={styles.emptyTxText}>No transactions recorded</Text>
          ) : (
            recentTransactions.map((tx: any, idx: number) => {
              const amountVal = Number(tx.amount || 0);
              const isIncome = amountVal > 0;
              const cleanDesc = stripEmoji(tx.description);
              
              // Formatting the amount with + or - prefix
              const absAmount = Math.abs(amountVal);
              const formattedAmount = `${isIncome ? '+' : '-'}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              const amountColor = isIncome ? '#34D399' : '#FFFFFF';

              return (
                <View key={tx.id || idx}>
                  {idx > 0 && <View style={styles.txDivider} />}
                  <View style={styles.recentTxRow}>
                    <View style={styles.txLeftSection}>
                      {renderTxIcon(tx.description, tx.categoryName)}
                      <View style={styles.txTextContainer}>
                        <Text style={styles.txTitle} numberOfLines={1}>{cleanDesc}</Text>
                        <Text style={styles.txDate}>{formatTxDate(tx.timestamp)}</Text>
                      </View>
                    </View>
                    <Text style={[styles.txAmountText, { color: amountColor }]}>
                      {formattedAmount}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* CRUD Form Modal */}
      <FormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalType}
        mode={modalMode}
        initialData={selectedItem}
        accounts={accountsList}
        categories={categoriesList}
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
  mainScrollView: {
    flex: 1,
  },
  mainScrollContent: {
    paddingBottom: 110,
  },
  scrollHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cycleLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#A1A1AA',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  monoNumber: {
    fontFamily: 'Inter',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  accountsCarousel: {
    paddingLeft: 24,
    paddingRight: 8,
    marginBottom: 20,
  },
  debitCard: {
    width: SCREEN_WIDTH * 0.82,
    height: 175,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginRight: 16,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  cardBalance: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMetricText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.65)',
    letterSpacing: 0.2,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inboxButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  budgetsList: {
    paddingHorizontal: 24,
    marginTop: 8,
    gap: 12,
  },
  budgetListCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    marginBottom: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  budgetCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  budgetIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
   budgetCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: 0.2,
  },
  budgetCardRemaining: {
    fontSize: 15,
    fontWeight: '700',
  },
  budgetCardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  budgetCardDetailsText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  budgetProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
    width: '100%',
  },
  budgetProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  spacer: {
    height: 40,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 36, // Increased margin for spacing
    marginBottom: 20, // Increased margin for spacing
    width: '100%',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  quickActionLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  recentTransactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  recentTxHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTxTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  seeAllButtonText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  recentTxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  txLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIconLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  txTextContainer: {
    flex: 1,
    gap: 4,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  txDate: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
  },
  txAmountText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  txDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTxText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
});
