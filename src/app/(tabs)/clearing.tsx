import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, RefreshControl, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Inbox, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react-native';
import { fetchFromAPI } from '@/utils/api';

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

  const loadData = async () => {
    try {
      const allTx = await fetchFromAPI('/api/transactions');
      if (allTx) {
        const pending = allTx.filter((t: any) => t.needsReview === true);
        setReviewQueue(pending);
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
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />
      
      {/* Top 30% - Deep Black Header */}
      <View style={styles.blackHeader}>
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <Text style={styles.sectionLabel}>QUEUE TRIAGE</Text>
          <Text style={styles.title}>Clearing House</Text>
          
          <View style={styles.queueStats}>
            <Text style={styles.statsLabel}>Pending Webhook Feeds</Text>
            <Text style={styles.statsValue}>
              <Text style={styles.monoNumber}>{reviewQueue.length}</Text> Transactions
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
        {/* Overlapping Queue Header Card */}
        <View style={[styles.card, styles.overlappingCard]}>
          <View style={styles.cardHeader}>
            <Inbox size={20} color="#1C1C1E" />
            <Text style={styles.cardTitle}>Inbox Transactions</Text>
          </View>
          
          {reviewQueue.length === 0 ? (
            <View style={styles.emptyContainer}>
              <CheckCircle2 size={48} color="#34C759" />
              <Text style={styles.emptyTitle}>All Clear!</Text>
              <Text style={styles.emptySubtitle}>All ingested transactions have been audited and assigned to budgets.</Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {reviewQueue.map((tx) => {
                const isSelected = selectedTxId === tx.id;
                const isExpense = Number(tx.amount) < 0;
                
                return (
                  <View key={tx.id} style={styles.queueItem}>
                    <TouchableOpacity 
                      style={styles.queueItemMain} 
                      onPress={() => setSelectedTxId(isSelected ? null : tx.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.txMeta}>
                        <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                        <Text style={styles.txCode}>
                          M-Pesa Code: <Text style={styles.monoNumber}>{tx.mpesaCode || 'N/A'}</Text>
                        </Text>
                      </View>
                      
                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, { color: isExpense ? '#FF3B30' : '#34C759' }]}>
                          {isExpense ? '-' : '+'}<Text style={styles.monoNumber}>{Math.abs(Number(tx.amount)).toLocaleString()}</Text>
                        </Text>
                        <ChevronRight size={16} color="#8E8E93" style={{ transform: [{ rotate: isSelected ? '90deg' : '0deg' }] }} />
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Category Assignment Pane */}
                    {isSelected && (
                      <View style={styles.assignmentPane}>
                        <Text style={styles.paneLabel}>Assign Fiscal Category</Text>
                        <View style={styles.categoryPills}>
                          {categoriesList.map((cat) => (
                            <TouchableOpacity
                              key={cat.id}
                              style={styles.catPill}
                              onPress={() => handleClearTransaction(tx.id, cat.id)}
                            >
                              <Text style={styles.catPillText}>{cat.name}</Text>
                            </TouchableOpacity>
                          ))}
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
  sectionLabel: {
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
  queueStats: {
    marginTop: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  monoNumber: {
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
  },
  whiteContent: {
    flex: 1,
    backgroundColor: '#F6F6F5',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  queueList: {
    gap: 12,
  },
  queueItem: {
    backgroundColor: '#F6F6F5',
    borderRadius: 16,
    overflow: 'hidden',
  },
  queueItemMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  txMeta: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  txCode: {
    fontSize: 12,
    color: '#8E8E93',
  },
  txRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  assignmentPane: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5EA',
    gap: 10,
  },
  paneLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
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
