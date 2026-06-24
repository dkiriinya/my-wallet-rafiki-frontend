import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, PiggyBank, Flame } from 'lucide-react-native';
import { fetchFromAPI } from '@/utils/api';
import { getFiscalPeriod } from '@/utils/fiscal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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

export default function CommandCenter() {
  const [accountsList, setAccountsList] = useState(MOCK_ACCOUNTS);
  const [categoriesList, setCategoriesList] = useState<any[]>(MOCK_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [fiscalCycle, setFiscalCycle] = useState('Current Cycle');

  const loadData = async () => {
    try {
      const dbAccounts = await fetchFromAPI('/api/accounts');
      if (dbAccounts && dbAccounts.length > 0) {
        setAccountsList(dbAccounts);
      }
      
      const dbCategories = await fetchFromAPI('/api/categories');
      if (dbCategories && dbCategories.length > 0) {
        // Compute spent from mock transactions or api
        const formattedCategories = dbCategories.map((c: any) => ({
          ...c,
          spent: '0.00', // Default spent for new db
        }));
        setCategoriesList(formattedCategories);
      }
    } catch (e) {
      // Fallback already set
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

  // Calculate total wealth
  const totalBalance = accountsList.reduce((acc, curr) => acc + Number(curr.balance), 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />
      
      {/* Top 30% - Deep Black Header */}
      <View style={styles.blackHeader}>
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <Text style={styles.cycleLabel}>{fiscalCycle.toUpperCase()}</Text>
          <Text style={styles.title}>Command Center</Text>
          
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>Total Liquidity</Text>
            <Text style={styles.balanceAmount}>
              Ksh <Text style={styles.monoNumber}>{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom 70% - Soft Off-white Content */}
      <ScrollView
        style={styles.whiteContent}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B0B0C" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Account List Card (Overlapping) */}
        <View style={[styles.card, styles.overlappingCard]}>
          <View style={styles.cardHeader}>
            <Wallet size={20} color="#1C1C1E" />
            <Text style={styles.cardTitle}>Liquidity Accounts</Text>
          </View>
          
          <View style={styles.cardBody}>
            {accountsList.map((acc, index) => (
              <View key={acc.id} style={[styles.itemRow, index === accountsList.length - 1 && styles.lastItemRow]}>
                <Text style={styles.itemName}>{acc.name}</Text>
                <Text style={styles.itemValue}>
                  Ksh <Text style={styles.monoNumber}>{Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Budget Allocation Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <PiggyBank size={20} color="#1C1C1E" />
            <Text style={styles.cardTitle}>Fiscal Budgets</Text>
          </View>
          
          <View style={styles.cardBody}>
            {categoriesList.length === 0 ? (
              <Text style={styles.emptyText}>No budget categories defined yet.</Text>
            ) : (
              categoriesList.map((cat, index) => {
                const spent = Number(cat.spent || 0);
                const budget = Number(cat.monthlyBudget || 0);
                const pct = budget > 0 ? Math.min(spent / budget, 1) : 0;
                
                return (
                  <View key={cat.id} style={[styles.budgetRow, index === categoriesList.length - 1 && styles.lastItemRow]}>
                    <View style={styles.budgetMeta}>
                      <Text style={styles.itemName}>{cat.name}</Text>
                      <Text style={styles.budgetFraction}>
                        Ksh <Text style={styles.monoNumber}>{spent.toLocaleString()}</Text> of <Text style={styles.monoNumber}>{budget.toLocaleString()}</Text>
                      </Text>
                    </View>
                    
                    {/* ProgressBar */}
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct * 100}%`, backgroundColor: pct >= 0.9 ? '#FF3B30' : '#1C1C1E' }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Fiscal Cycle Alert Indicator */}
        <View style={[styles.card, styles.cycleCard]}>
          <View style={styles.cardHeader}>
            <Flame size={20} color="#FF9500" />
            <Text style={[styles.cardTitle, { color: '#FF9500' }]}>Fiscal Month Bounds</Text>
          </View>
          <Text style={styles.cycleDescription}>
            Transactions created on or after the <Text style={styles.boldMono}>25th</Text> automatically roll into the upcoming cycle budget. Dates up to the <Text style={styles.boldMono}>24th</Text> bind to the current active cycle.
          </Text>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F5',
  },
  blackHeader: {
    height: SCREEN_HEIGHT * 0.32,
    backgroundColor: '#0B0B0C',
    paddingHorizontal: 24,
  },
  safeHeader: {
    flex: 1,
    justifyContent: 'center',
  },
  cycleLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 12,
    color: '#8E8E93',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  balanceContainer: {
    marginTop: 5,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  monoNumber: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
  },
  boldMono: {
    fontFamily: 'JetBrainsMono-Bold',
    fontWeight: '700',
  },
  whiteContent: {
    flex: 1,
    backgroundColor: '#F6F6F5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Room for floating tab bar
  },
  overlappingCard: {
    marginTop: -40,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -4 },
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cycleCard: {
    backgroundColor: '#FFF9F0',
    borderColor: '#FFECC7',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  cardBody: {
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  lastItemRow: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  itemValue: {
    fontSize: 15,
    color: '#1C1C1E',
  },
  budgetRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  budgetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetFraction: {
    fontSize: 13,
    color: '#6E6E73',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  cycleDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6E6E73',
  },
  emptyText: {
    color: '#8E8E93',
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 10,
  },
  spacer: {
    height: 40,
  },
});
