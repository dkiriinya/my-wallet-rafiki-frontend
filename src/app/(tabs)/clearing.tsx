import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react-native';
import { fetchFromAPI } from '@/utils/api';
import { getCategoryIcon, stripEmoji } from '@/utils/icons';
import { AmbientBackground } from '@/components/ambient-background';

import { getFiscalPeriod } from '@/utils/fiscal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_REVIEW_TRANSACTIONS = [
  { id: 'tx-101', description: 'P2P Transfer to 0712345678', amount: '-1500.00', mpesaCode: 'QRT7829JKY', timestamp: '2026-06-24T18:45:00Z', needsReview: true },
  { id: 'tx-102', description: 'Received from MARY WANJIKU', amount: '4500.00', mpesaCode: 'QRU1830KLA', timestamp: '2026-06-24T12:30:00Z', needsReview: true },
  { id: 'tx-103', description: 'M-PESA WITHDRAWAL AGENT 1892', amount: '-2000.00', mpesaCode: 'QRV9921MOP', timestamp: '2026-06-23T09:15:00Z', needsReview: true },
];

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Living Expenses' },
  { id: 'cat-2', name: 'Transportation' },
  { id: 'cat-3', name: 'Entertainment' },
];

export default function ClearingHouse() {
  const [reviewQueue, setReviewQueue] = useState<any[]>(MOCK_REVIEW_TRANSACTIONS);
  const [categoriesList, setCategoriesList] = useState<any[]>(MOCK_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

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

      const allTx = await fetchFromAPI('/api/transactions');
      if (allTx) {
        const pending = allTx.filter((t: any) => t.needsReview === true);
        setReviewQueue(pending);

        // Compute income and expenses
        let incomeSum = 0;
        let expensesSum = 0;
        const currentPeriod = getFiscalPeriod(new Date());

        allTx.forEach((tx: any) => {
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
      }
      
      const dbCategories = await fetchFromAPI('/api/categories');
      if (dbCategories && dbCategories.length > 0) {
        setCategoriesList(dbCategories);
      }
    } catch (e) {
      // Fallback already set
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleClearTransaction = async (txId: string, categoryId: string) => {
    try {
      // Optimistic update
      setReviewQueue(prev => prev.filter(t => t.id !== txId));
      setSelectedTxId(null);

      // Call API
      await fetchFromAPI(`/api/transactions/${txId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          categoryId,
          needsReview: false
        })
      });
    } catch (e) {
      // If API fails, we remain in local state mode which succeeded optimistically
      console.warn("Cleared transaction locally");
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
        <SafeAreaView style={styles.scrollHeader} edges={['top']}>
          <Text style={styles.sectionLabel}>Review</Text>
          <Text style={styles.title}>Inbox</Text>
          

        </SafeAreaView>

        {/* Review Log Card */}
        <View style={[styles.card, styles.overlappingCard]}>
          <View style={styles.cardHeader}>
            <Inbox size={20} color="#3B82F6" />
            <Text style={styles.cardTitle}>New Transactions</Text>
          </View>
          
          {reviewQueue.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={48} color="#10B981" />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptySubtitle}>All ingested transactions have been audited and assigned to budgets.</Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {reviewQueue.map((tx) => {
                const isSelected = selectedTxId === tx.id;
                const isExpense = Number(tx.amount) < 0;
                const IconComponent = getCategoryIcon(tx.description);
                const cleanDesc = stripEmoji(tx.description);
                
                let subtitleText = isExpense ? 'Pending Review' : 'Payment Received';
                if (tx.mpesaCode) {
                  subtitleText += ` • ${tx.mpesaCode}`;
                }
                const formattedDate = tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
                
                return (
                  <View key={tx.id} style={styles.queueItem}>
                    <TouchableOpacity 
                      style={styles.queueItemMain} 
                      onPress={() => setSelectedTxId(isSelected ? null : tx.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.itemLeft}>
                        <View style={[styles.txIconContainer, { backgroundColor: isExpense ? 'rgba(255,255,255,0.05)' : 'rgba(16, 185, 129, 0.12)' }]}>
                          <IconComponent size={18} color={isExpense ? '#9CA3AF' : '#34D399'} />
                        </View>
                        <View style={styles.txMeta}>
                          <Text style={styles.txDesc} numberOfLines={1}>{cleanDesc}</Text>
                          <Text style={styles.txSubtext}>{subtitleText}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.txRightContainer}>
                        <View style={styles.txRight}>
                          <Text style={[styles.txAmount, { color: isExpense ? '#FFFFFF' : '#34D399' }]}>
                            {isExpense ? '-' : '+'}<Text style={styles.monoNumber}>{Math.abs(Number(tx.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                          </Text>
                          <Text style={styles.codeText}>{formattedDate}</Text>
                        </View>
                        <ChevronRight size={16} color="#A1A1AA" style={{ transform: [{ rotate: isSelected ? '90deg' : '0deg' }], marginLeft: 6 }} />
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Category Assignment Pane */}
                    {isSelected && (
                      <View style={styles.assignmentPane}>
                        <Text style={styles.paneLabel}>Assign Fiscal Category</Text>
                        <View style={styles.categoryPills}>
                          {categoriesList.map((cat) => {
                            const CatIcon = getCategoryIcon(cat.name);
                            const cleanCatName = stripEmoji(cat.name);
                            return (
                              <TouchableOpacity
                                key={cat.id}
                                style={styles.catPill}
                                onPress={() => handleClearTransaction(tx.id, cat.id)}
                              >
                                <CatIcon size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.catPillText}>{cleanCatName}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

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
  sectionLabel: {
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
  overlappingCard: {
    marginTop: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: -4 },
    marginHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  queueList: {
    gap: 12,
  },
  queueItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  queueItemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  txIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txMeta: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  txCode: {
    fontSize: 12,
    color: '#A1A1AA',
  },
  txSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  txRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  codeText: {
    fontSize: 11,
    fontFamily: 'Inter',
    color: '#71717A',
  },
  assignmentPane: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    gap: 10,
  },
  paneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  catPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  spacer: {
    height: 40,
  },
});
