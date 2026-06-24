import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { History, AlertTriangle } from 'lucide-react-native';
import { fetchFromAPI } from '@/utils/api';
import { getFiscalPeriod } from '@/utils/fiscal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_TRANSACTIONS = [
  { id: 'tx-1', description: 'Grocery Purchase Naivas', amount: '-4500.00', categoryName: 'Living Expenses', timestamp: '2026-06-25T14:30:00Z', needsReview: false, mpesaCode: 'QRT9920MKA' },
  { id: 'tx-2', description: 'KPLC Tokens', amount: '-1200.00', categoryName: 'Living Expenses', timestamp: '2026-06-24T18:10:00Z', needsReview: false, mpesaCode: 'QRT1183LLA' },
  { id: 'tx-3', description: 'Uber Ride', amount: '-850.00', categoryName: 'Transportation', timestamp: '2026-06-23T11:20:00Z', needsReview: false, mpesaCode: 'QRS2219KLS' },
  { id: 'tx-4', description: 'Salary Deposit', amount: '120000.00', categoryName: 'Salary', timestamp: '2026-06-22T06:00:00Z', needsReview: false, mpesaCode: 'QRR1019MOP' },
  { id: 'tx-5', description: 'P2P Transfer to 0712345678', amount: '-1500.00', categoryName: 'Uncategorized', timestamp: '2026-06-24T18:45:00Z', needsReview: true, mpesaCode: 'QRT7829JKY' },
];

export default function Ledger() {
  const [transactionsList, setTransactionsList] = useState(MOCK_TRANSACTIONS);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const allTx = await fetchFromAPI('/api/transactions');
      if (allTx && allTx.length > 0) {
        // Fetch categories to map category name
        const dbCategories = await fetchFromAPI('/api/categories');
        const catMap = new Map(dbCategories.map((c: any) => [c.id, c.name]));
        
        const formatted = allTx.map((t: any) => ({
          ...t,
          categoryName: t.categoryId ? catMap.get(t.categoryId) || 'Categorized' : 'Uncategorized'
        }));
        setTransactionsList(formatted);
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

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />
      
      {/* Top 30% - Deep Black Header */}
      <View style={styles.blackHeader}>
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <Text style={styles.sectionLabel}>HISTORICAL LOGS</Text>
          <Text style={styles.title}>The Ledger</Text>
          
          <View style={styles.ledgerStats}>
            <Text style={styles.statsLabel}>Total Logged Actions</Text>
            <Text style={styles.statsValue}>
              <Text style={styles.monoNumber}>{transactionsList.length}</Text> Records
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
        {/* Overlapping Transaction Log Card */}
        <View style={[styles.card, styles.overlappingCard]}>
          <View style={styles.cardHeader}>
            <History size={20} color="#1C1C1E" />
            <Text style={styles.cardTitle}>Audit Trail</Text>
          </View>

          <View style={styles.ledgerList}>
            {transactionsList.map((tx, index) => {
              const isExpense = Number(tx.amount) < 0;
              const fiscalPeriod = getFiscalPeriod(tx.timestamp);
              
              return (
                <View 
                  key={tx.id} 
                  style={[
                    styles.txItem, 
                    index === transactionsList.length - 1 && styles.lastTxItem
                  ]}
                >
                  <View style={styles.txLeft}>
                    <View style={styles.titleRow}>
                      <Text style={styles.txDesc} numberOfLines={1}>{tx.description}</Text>
                      {tx.needsReview && (
                        <View style={styles.reviewBadge}>
                          <AlertTriangle size={10} color="#FF9500" />
                          <Text style={styles.reviewBadgeText}>REVIEW</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={styles.txSubtext}>
                      {formatDate(tx.timestamp)} • {tx.categoryName}
                    </Text>
                    
                    {/* Display the computed 25-to-25 fiscal period label */}
                    <Text style={styles.fiscalBadge}>
                      Fiscal Cycle: <Text style={styles.boldMono}>{fiscalPeriod.label}</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: isExpense ? '#FF3B30' : '#34C759' }]}>
                      {isExpense ? '-' : '+'}<Text style={styles.monoNumber}>{Math.abs(Number(tx.amount)).toLocaleString()}</Text>
                    </Text>
                    {tx.mpesaCode && (
                      <Text style={styles.codeText}>{tx.mpesaCode}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
  ledgerStats: {
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
  ledgerList: {
    gap: 16,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  lastTxItem: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  txLeft: {
    flex: 1,
    gap: 4,
    paddingRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  reviewBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FF9500',
  },
  txSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  fiscalBadge: {
    fontSize: 11,
    color: '#6E6E73',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  codeText: {
    fontSize: 10,
    fontFamily: 'JetBrainsMono',
    color: '#AEAEB2',
  },
  spacer: {
    height: 40,
  },
});
