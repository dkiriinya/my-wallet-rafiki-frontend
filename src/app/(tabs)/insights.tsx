import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, BarChart } from 'lucide-react-native';
import { fetchFromAPI } from '@/utils/api';
import { getFiscalPeriod } from '@/utils/fiscal';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_BUDGET_STATS = {
  totalBudget: 65000,
  totalSpent: 27100,
  categories: [
    { name: 'Living Expenses', budget: 40000, spent: 12400, color: '#1C1C1E' },
    { name: 'Transportation', budget: 15000, spent: 6800, color: '#8E8E93' },
    { name: 'Entertainment', budget: 10000, spent: 7900, color: '#AEAEB2' },
  ]
};

export default function Insights() {
  const [stats, setStats] = useState(MOCK_BUDGET_STATS);
  const [fiscalCycle, setFiscalCycle] = useState('Current Cycle');

  useEffect(() => {
    // Compute current cycle label
    const period = getFiscalPeriod(new Date());
    setFiscalCycle(period.label);

    const loadData = async () => {
      try {
        const dbCategories = await fetchFromAPI('/api/categories');
        if (dbCategories && dbCategories.length > 0) {
          // Format into stats structure
          const formatted = dbCategories.map((c: any, index: number) => {
            const colors = ['#1C1C1E', '#8E8E93', '#AEAEB2', '#E5E5EA'];
            return {
              name: c.name,
              budget: Number(c.monthlyBudget),
              spent: 0, // In standard setup, would fetch spent from backend API
              color: colors[index % colors.length]
            };
          });
          
          setStats({
            totalBudget: formatted.reduce((acc: number, curr: any) => acc + curr.budget, 0),
            totalSpent: 0,
            categories: formatted
          });
        }
      } catch (e) {
        // Fallback already set
      }
    };
    loadData();
  }, []);

  const totalSpent = stats.totalSpent || stats.categories.reduce((acc, c) => acc + c.spent, 0);
  const totalBudget = stats.totalBudget;
  const utilizationPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />
      
      {/* Top 30% - Deep Black Header */}
      <View style={styles.blackHeader}>
        <SafeAreaView style={styles.safeHeader} edges={['top']}>
          <Text style={styles.cycleLabel}>{fiscalCycle.toUpperCase()}</Text>
          <Text style={styles.title}>Insights</Text>
          
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>Total Allocated Budget</Text>
            <Text style={styles.summaryValue}>
              Ksh <Text style={styles.monoNumber}>{totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom 70% - Soft Off-white Content */}
      <ScrollView
        style={styles.whiteContent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Overlapping Overview Card */}
        <View style={[styles.card, styles.overlappingCard]}>
          <View style={styles.cardHeader}>
            <TrendingUp size={20} color="#1C1C1E" />
            <Text style={styles.cardTitle}>Utilization Index</Text>
          </View>
          
          <View style={styles.utilizationContainer}>
            <View style={styles.utilizationBig}>
              <Text style={styles.utilizationValue}>
                <Text style={styles.monoNumber}>{utilizationPct.toFixed(1)}</Text>%
              </Text>
              <Text style={styles.utilizationLabel}>Of budget exhausted</Text>
            </View>
            
            <View style={styles.utilizationMeta}>
              <Text style={styles.metaText}>
                Spent: Ksh <Text style={styles.monoNumber}>{totalSpent.toLocaleString()}</Text>
              </Text>
              <Text style={styles.metaText}>
                Rem: Ksh <Text style={styles.monoNumber}>{(totalBudget - totalSpent).toLocaleString()}</Text>
              </Text>
            </View>
          </View>
          
          <View style={styles.bigProgressTrack}>
            <View style={[styles.bigProgressFill, { width: `${Math.min(utilizationPct, 100)}%` }]} />
          </View>
        </View>

        {/* Custom Premium Chart Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BarChart size={20} color="#1C1C1E" />
            <Text style={styles.cardTitle}>Budget Distribution</Text>
          </View>

          <View style={styles.chartContainer}>
            {stats.categories.map((cat: any) => {
              const spent = cat.spent || 0;
              const budget = cat.budget || 0;
              const pct = budget > 0 ? (spent / budget) * 100 : 0;
              
              return (
                <View key={cat.name} style={styles.chartBarGroup}>
                  <View style={styles.chartBarLabelGroup}>
                    <Text style={styles.chartBarName}>{cat.name}</Text>
                    <Text style={styles.chartBarPercent}>
                      <Text style={styles.monoNumber}>{pct.toFixed(0)}%</Text>
                    </Text>
                  </View>
                  
                  {/* Custom Stacked Bar Layout */}
                  <View style={styles.barVisualContainer}>
                    <View style={styles.barVisualTrack}>
                      <View style={[styles.barVisualFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: cat.color || '#1C1C1E' }]} />
                    </View>
                    <Text style={styles.barVisualText}>
                      Ksh <Text style={styles.monoNumber}>{spent.toLocaleString()}</Text> of <Text style={styles.monoNumber}>{budget.toLocaleString()}</Text>
                    </Text>
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
  summaryContainer: {
    marginTop: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
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
  utilizationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  utilizationBig: {
    gap: 2,
  },
  utilizationValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  utilizationLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  utilizationMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6E6E73',
  },
  bigProgressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E5EA',
    overflow: 'hidden',
  },
  bigProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1C1C1E',
  },
  chartContainer: {
    gap: 20,
  },
  chartBarGroup: {
    gap: 6,
  },
  chartBarLabelGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartBarName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  chartBarPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  barVisualContainer: {
    gap: 4,
  },
  barVisualTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
    overflow: 'hidden',
  },
  barVisualFill: {
    height: '100%',
    borderRadius: 6,
  },
  barVisualText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'right',
  },
  spacer: {
    height: 40,
  },
});
