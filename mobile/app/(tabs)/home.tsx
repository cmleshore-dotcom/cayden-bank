import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { useAccountStore } from '../../src/stores/accountStore';
import { useAdvanceStore } from '../../src/stores/advanceStore';
import { Card } from '../../src/components/common/Card';
import { CaydenLogo } from '../../src/components/common/CaydenLogo';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { formatRelativeDate } from '../../src/utils/dateHelpers';
import { Transaction } from '../../src/types';

export default function HomeScreen() {
  const { user, isDarkMode } = useAuthStore();
  const { accounts, transactions, fetchAccounts, fetchTransactions, isLoading } =
    useAccountStore();
  const { eligibility, checkEligibility } = useAdvanceStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const loadData = useCallback(async () => {
    await Promise.all([fetchAccounts(), fetchTransactions(), checkEligibility()]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const checking = accounts.find((a) => a.accountType === 'checking');
  const savings = accounts.find((a) => a.accountType === 'savings');
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const getTransactionIcon = (txn: Transaction) => {
    switch (txn.category) {
      case 'deposit':
        return 'arrow-down-circle';
      case 'purchase':
        return 'cart';
      case 'transfer':
        return 'swap-horizontal';
      case 'advance':
        return 'cash';
      case 'repayment':
        return 'return-up-back';
      case 'round_up':
        return 'trending-up';
      default:
        return 'ellipse';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              Good {getTimeOfDay()},
            </Text>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.firstName || 'User'}
            </Text>
          </View>
          <CaydenLogo size={52} />
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCardOuter} variant="hero">
          <LinearGradient
            colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            {/* Decorative circle */}
            <View style={styles.decorativeCircle} />

            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(totalBalance)}
            </Text>
            <View style={styles.accountRow}>
              <View style={styles.accountItem}>
                <Text style={styles.accountLabel}>Checking</Text>
                <Text style={styles.accountBalance}>
                  {formatCurrency(checking?.balance || 0)}
                </Text>
              </View>
              {savings && (
                <View style={styles.accountItem}>
                  <Text style={styles.accountLabel}>Savings</Text>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(savings.balance)}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="arrow-down-circle"
            label="Deposit"
            color="#00A86B"
            bgColor="#D4EDDA"
          />
          <QuickActionButton
            icon="swap-horizontal"
            label="Transfer"
            color="#1B5E20"
            bgColor="#C8E6C9"
          />
          <QuickActionButton
            icon="cash-outline"
            label="ExtraCash"
            color="#007A4D"
            bgColor="#B2DFDB"
          />
          <QuickActionButton
            icon="card-outline"
            label="Card"
            color="#F59E0B"
            bgColor="#FEF3C7"
          />
        </View>

        {/* ExtraCash Banner */}
        {eligibility?.eligible && (
          <Card
            style={[
              styles.extraCashBanner,
              { backgroundColor: isDarkMode ? '#0a2a0a' : '#F0FFF4' },
            ]}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerLeft}>
                <View
                  style={[
                    styles.bannerIconCircle,
                    { backgroundColor: theme.primaryLight },
                  ]}
                >
                  <Ionicons name="flash" size={18} color="#FFFFFF" />
                </View>
                <View style={styles.bannerText}>
                  <Text style={[styles.bannerTitle, { color: theme.text }]}>
                    ExtraCash Available
                  </Text>
                  <Text
                    style={[
                      styles.bannerSubtitle,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Up to {formatCurrency(eligibility.maxAmount)}
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.textSecondary}
              />
            </View>
          </Card>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: theme.primary }]}>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <Card variant="elevated" style={styles.transactionCard}>
          {transactions.slice(0, 8).map((txn, index) => (
            <View
              key={txn.id}
              style={[
                styles.transactionItem,
                index < Math.min(transactions.length, 8) - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.txnIconContainer,
                  {
                    backgroundColor:
                      txn.type === 'credit'
                        ? isDarkMode
                          ? '#1a3a2a'
                          : '#ECFDF5'
                        : isDarkMode
                        ? '#3a1a1a'
                        : '#FEF2F2',
                  },
                ]}
              >
                <Ionicons
                  name={getTransactionIcon(txn)}
                  size={22}
                  color={txn.type === 'credit' ? theme.success : theme.error}
                />
              </View>
              <View style={styles.txnDetails}>
                <Text
                  style={[styles.txnDescription, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {txn.description}
                </Text>
                <Text
                  style={[styles.txnDate, { color: theme.textTertiary }]}
                >
                  {formatRelativeDate(txn.createdAt)}
                </Text>
              </View>
              <Text
                style={[
                  styles.txnAmount,
                  {
                    color:
                      txn.type === 'credit' ? theme.success : theme.text,
                  },
                ]}
              >
                {txn.type === 'credit' ? '+' : '-'}
                {formatCurrency(txn.amount)}
              </Text>
            </View>
          ))}
          {transactions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons
                name="receipt-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No transactions yet
              </Text>
            </View>
          )}
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionButton({
  icon,
  label,
  color,
  bgColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
}) {
  return (
    <TouchableOpacity style={styles.quickAction}>
      <View style={[styles.quickActionIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: {
    ...typography.label,
  },
  userName: {
    ...typography.h2,
  },
  profileIconWrapper: {
    borderRadius: 28,
    ...shadows.md,
  },
  profileIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  balanceCardOuter: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  balanceCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  balanceLabel: {
    ...typography.label,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    ...typography.amount,
    color: '#FFFFFF',
    marginTop: spacing.xs,
  },
  accountRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.xl,
  },
  accountItem: {},
  accountLabel: {
    ...typography.small,
    color: 'rgba(255,255,255,0.6)',
  },
  accountBalance: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  quickActionLabel: {
    ...typography.small,
    fontWeight: '700',
  },
  extraCashBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    marginLeft: spacing.md,
  },
  bannerTitle: {
    ...typography.captionBold,
  },
  bannerSubtitle: {
    ...typography.small,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
  },
  seeAll: {
    ...typography.captionBold,
  },
  transactionCard: {
    marginHorizontal: spacing.lg,
    ...shadows.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  txnIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  txnDetails: {
    flex: 1,
  },
  txnDescription: {
    ...typography.captionBold,
  },
  txnDate: {
    ...typography.small,
    marginTop: 2,
  },
  txnAmount: {
    ...typography.captionBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
});
