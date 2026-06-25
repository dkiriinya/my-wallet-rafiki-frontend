import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react-native';

interface BalanceHeaderCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}

export function BalanceHeaderCard({ totalBalance, totalIncome, totalExpenses }: BalanceHeaderCardProps) {
  const [isHidden, setIsHidden] = useState(false);

  return (
    <View style={styles.balanceContainer}>
      <View style={styles.headerTitleRow}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <TouchableOpacity 
          onPress={() => setIsHidden(!isHidden)} 
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          {isHidden ? (
            <EyeOff size={16} color="rgba(255, 255, 255, 0.6)" />
          ) : (
            <Eye size={16} color="rgba(255, 255, 255, 0.6)" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.balanceAmount}>
        Ksh{' '}
        <Text style={styles.monoNumber}>
          {isHidden 
            ? '••••••' 
            : totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </Text>

      <View style={styles.indicatorsRow}>
        <View style={styles.indicatorItem}>
          <View style={[styles.indicatorIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <ArrowUpRight size={14} color="#34D399" />
          </View>
          <View style={styles.indicatorTextContainer}>
            <Text style={styles.indicatorLabel}>Income</Text>
            <Text style={styles.indicatorAmount}>
              Ksh{' '}
              <Text style={styles.monoNumber}>
                {isHidden 
                  ? '••••' 
                  : totalIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.indicatorItem}>
          <View style={[styles.indicatorIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
            <ArrowDownRight size={14} color="#F87171" />
          </View>
          <View style={styles.indicatorTextContainer}>
            <Text style={styles.indicatorLabel}>Expenses</Text>
            <Text style={styles.indicatorAmount}>
              Ksh{' '}
              <Text style={styles.monoNumber}>
                {isHidden 
                  ? '••••' 
                  : totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  balanceContainer: {
    backgroundColor: '#1E40AF', // Premium royal blue
    borderRadius: 24,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#1E40AF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: 'Inter',
  },
  monoNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  indicatorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  indicatorIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorTextContainer: {
    justifyContent: 'center',
  },
  indicatorLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  indicatorAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 1,
    fontFamily: 'Inter',
  },
});
