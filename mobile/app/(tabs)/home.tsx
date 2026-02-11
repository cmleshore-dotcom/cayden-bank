import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useAccountStore } from '../../src/stores/accountStore';
import { useAdvanceStore } from '../../src/stores/advanceStore';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { Card } from '../../src/components/common/Card';
import { CaydenLogo } from '../../src/components/common/CaydenLogo';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { formatRelativeDate, formatDate, formatTime } from '../../src/utils/dateHelpers';
import { Transaction, Account } from '../../src/types';

type HomeView = 'dashboard' | 'transactions' | 'accountDetail';

export default function HomeScreen() {
  const { user, isDarkMode } = useAuthStore();
  const { accounts, transactions, pagination, fetchAccounts, fetchTransactions, deposit, transfer, isLoading } =
    useAccountStore();
  const { eligibility, checkEligibility } = useAdvanceStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [activeView, setActiveView] = useState<HomeView>('dashboard');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Transfer state
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDirection, setTransferDirection] = useState<'checking_to_savings' | 'savings_to_checking'>('checking_to_savings');
  const [transferring, setTransferring] = useState(false);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositAccountType, setDepositAccountType] = useState<'checking' | 'savings'>('checking');
  const [depositing, setDepositing] = useState(false);

  // Transaction filter state
  const [txnFilter, setTxnFilter] = useState<string | null>(null);
  const [txnPage, setTxnPage] = useState(1);

  const loadData = useCallback(async () => {
    await Promise.all([fetchAccounts(), fetchTransactions(), checkEligibility(), fetchNotifications()]);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const checking = accounts.find((a) => a.accountType === 'checking');
  const savings = accounts.find((a) => a.accountType === 'savings');
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const getTransactionIcon = (txn: Transaction): keyof typeof Ionicons.glyphMap => {
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
      case 'refund':
        return 'refresh-circle';
      default:
        return 'ellipse';
    }
  };

  // Transfer handler
  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than $0.');
      return;
    }
    if (!checking || !savings) {
      Alert.alert('Missing Account', 'You need both a checking and savings account to transfer.');
      return;
    }

    const fromAccount = transferDirection === 'checking_to_savings' ? checking : savings;
    const toAccount = transferDirection === 'checking_to_savings' ? savings : checking;

    if (amount > fromAccount.balance) {
      Alert.alert('Insufficient Funds', `Your ${fromAccount.accountType} account only has ${formatCurrency(fromAccount.balance)}.`);
      return;
    }

    Alert.alert(
      'Confirm Transfer',
      `Transfer ${formatCurrency(amount)} from ${fromAccount.accountType} to ${toAccount.accountType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Transfer',
          onPress: async () => {
            setTransferring(true);
            try {
              await transfer(fromAccount.id, toAccount.id, amount);
              Alert.alert('Success', `${formatCurrency(amount)} transferred successfully!`);
              setShowTransferModal(false);
              setTransferAmount('');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Transfer failed. Please try again.');
            } finally {
              setTransferring(false);
            }
          },
        },
      ]
    );
  };

  // Deposit handler
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than $0.');
      return;
    }

    const targetAccount = depositAccountType === 'checking' ? checking : savings;
    if (!targetAccount) {
      Alert.alert('No Account', `You don't have a ${depositAccountType} account.`);
      return;
    }

    Alert.alert(
      'Confirm Deposit',
      `Deposit ${formatCurrency(amount)} into your ${depositAccountType} account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit',
          onPress: async () => {
            setDepositing(true);
            try {
              await deposit(targetAccount.id, amount, depositDescription || 'Mobile deposit');
              Alert.alert('Success', `${formatCurrency(amount)} deposited successfully!`);
              setShowDepositModal(false);
              setDepositAmount('');
              setDepositDescription('');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Deposit failed. Please try again.');
            } finally {
              setDepositing(false);
            }
          },
        },
      ]
    );
  };

  // Load filtered transactions for See All
  const loadTransactions = async (filter?: string | null, page?: number) => {
    const params: any = { page: page || 1, limit: 20 };
    if (filter) params.category = filter;
    await fetchTransactions(params);
  };

  // === Transaction History View ===
  if (activeView === 'transactions') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => { setActiveView('dashboard'); setTxnFilter(null); loadData(); }}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: theme.text }]}>All Transactions</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { key: null, label: 'All' },
            { key: 'deposit', label: 'Deposits' },
            { key: 'purchase', label: 'Purchases' },
            { key: 'transfer', label: 'Transfers' },
            { key: 'advance', label: 'Advances' },
            { key: 'repayment', label: 'Repayments' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.key || 'all'}
              style={[
                styles.filterChip,
                {
                  backgroundColor: txnFilter === cat.key ? theme.primary : theme.surface,
                  borderColor: txnFilter === cat.key ? theme.primary : theme.border,
                },
                txnFilter === cat.key && shadows.sm,
              ]}
              onPress={() => {
                setTxnFilter(cat.key);
                setTxnPage(1);
                loadTransactions(cat.key, 1);
              }}
            >
              <Text style={{
                color: txnFilter === cat.key ? '#FFFFFF' : theme.text,
                fontWeight: '600',
                fontSize: 13,
              }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {transactions.map((txn) => (
            <Card
              key={txn.id}
              variant="elevated"
              style={{
                marginHorizontal: spacing.lg,
                marginBottom: spacing.sm,
                borderRadius: borderRadius.xl,
              }}
            >
              <View style={styles.transactionItem}>
                <View
                  style={[
                    styles.txnIconContainer,
                    {
                      backgroundColor:
                        txn.type === 'credit'
                          ? isDarkMode ? '#1a3a2a' : '#ECFDF5'
                          : isDarkMode ? '#3a1a1a' : '#FEF2F2',
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
                  <Text style={[styles.txnDescription, { color: theme.text }]} numberOfLines={1}>
                    {txn.description}
                  </Text>
                  <Text style={[styles.txnDate, { color: theme.textTertiary }]}>
                    {formatDate(txn.createdAt)} at {formatTime(txn.createdAt)}
                  </Text>
                  {txn.spendingCategory && (
                    <View style={[styles.txnCategoryBadge, { backgroundColor: isDarkMode ? theme.surfaceSecondary : '#F1F5F9' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textSecondary }}>
                        {txn.spendingCategory.charAt(0).toUpperCase() + txn.spendingCategory.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.txnAmount,
                      { color: txn.type === 'credit' ? theme.success : theme.text },
                    ]}
                  >
                    {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.textTertiary, marginTop: 2 }}>
                    Bal: {formatCurrency(txn.balanceAfter)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          {transactions.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No Transactions</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                {txnFilter ? 'No transactions match this filter.' : 'No transactions yet.'}
              </Text>
            </View>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  { backgroundColor: txnPage > 1 ? theme.primary : theme.surfaceSecondary },
                ]}
                onPress={() => {
                  if (txnPage > 1) {
                    const newPage = txnPage - 1;
                    setTxnPage(newPage);
                    loadTransactions(txnFilter, newPage);
                  }
                }}
                disabled={txnPage <= 1}
              >
                <Ionicons name="chevron-back" size={18} color={txnPage > 1 ? '#FFFFFF' : theme.textTertiary} />
              </TouchableOpacity>
              <Text style={[styles.pageText, { color: theme.text }]}>
                Page {txnPage} of {pagination.totalPages}
              </Text>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  { backgroundColor: txnPage < pagination.totalPages ? theme.primary : theme.surfaceSecondary },
                ]}
                onPress={() => {
                  if (txnPage < pagination.totalPages) {
                    const newPage = txnPage + 1;
                    setTxnPage(newPage);
                    loadTransactions(txnFilter, newPage);
                  }
                }}
                disabled={txnPage >= pagination.totalPages}
              >
                <Ionicons name="chevron-forward" size={18} color={txnPage < pagination.totalPages ? '#FFFFFF' : theme.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // === Account Detail View ===
  if (activeView === 'accountDetail' && selectedAccount) {
    const acctTransactions = transactions.filter((t) => t.accountId === selectedAccount.id);
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.subHeader}>
          <TouchableOpacity onPress={() => { setActiveView('dashboard'); loadData(); }}>
            <Ionicons name="chevron-back" size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.subTitle, { color: theme.text }]}>
            {selectedAccount.accountType === 'checking' ? 'Checking' : 'Savings'} Account
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Account Balance Hero */}
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <LinearGradient
              colors={
                selectedAccount.accountType === 'checking'
                  ? [theme.primaryGradientStart, theme.primaryGradientEnd]
                  : ['#3B82F6', '#1D4ED8']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: borderRadius.xxl,
                padding: spacing.xl,
                ...shadows.lg,
              }}
            >
              <View style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)' }} />
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>
                {selectedAccount.accountType === 'checking' ? 'CHECKING' : 'SAVINGS'} BALANCE
              </Text>
              <Text style={{ color: '#FFFFFF', fontSize: 42, fontWeight: '800', marginTop: spacing.xs, letterSpacing: -1 }}>
                {formatCurrency(selectedAccount.balance)}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: spacing.xl }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Account</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                    ****{selectedAccount.accountNumber.slice(-4)}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Routing</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                    {selectedAccount.routingNumber}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>Status</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                    {selectedAccount.status.charAt(0).toUpperCase() + selectedAccount.status.slice(1)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick Actions for Account */}
          <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => setShowDepositModal(true)}>
              <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? '#10B98122' : '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                  <Ionicons name="arrow-down-circle" size={22} color="#10B981" />
                </View>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>Deposit</Text>
              </Card>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => setShowTransferModal(true)}>
              <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? '#3B82F622' : '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                  <Ionicons name="swap-horizontal" size={22} color="#3B82F6" />
                </View>
                <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>Transfer</Text>
              </Card>
            </TouchableOpacity>
          </View>

          {/* Account Details */}
          <Card variant="elevated" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.xl }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#F59E0B22' : '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="information-circle-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={{ ...typography.captionBold, color: theme.text }}>Account Details</Text>
            </View>
            <DetailRow label="Account Type" value={selectedAccount.accountType === 'checking' ? 'Checking' : 'Savings'} theme={theme} />
            <DetailRow label="Account Number" value={`****${selectedAccount.accountNumber.slice(-4)}`} theme={theme} />
            <DetailRow label="Routing Number" value={selectedAccount.routingNumber} theme={theme} />
            <DetailRow label="Round-Up Savings" value={selectedAccount.roundUpEnabled ? 'Enabled' : 'Disabled'} theme={theme} />
            <DetailRow label="Opened" value={formatDate(selectedAccount.createdAt)} theme={theme} isLast />
          </Card>

          {/* Recent Transactions for this Account */}
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
            <Text style={{ ...typography.h4, color: theme.text }}>Recent Activity</Text>
          </View>

          {acctTransactions.slice(0, 10).map((txn) => (
            <Card
              key={txn.id}
              variant="elevated"
              style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: borderRadius.xl }}
            >
              <View style={styles.transactionItem}>
                <View
                  style={[
                    styles.txnIconContainer,
                    {
                      backgroundColor:
                        txn.type === 'credit'
                          ? isDarkMode ? '#1a3a2a' : '#ECFDF5'
                          : isDarkMode ? '#3a1a1a' : '#FEF2F2',
                    },
                  ]}
                >
                  <Ionicons name={getTransactionIcon(txn)} size={22} color={txn.type === 'credit' ? theme.success : theme.error} />
                </View>
                <View style={styles.txnDetails}>
                  <Text style={[styles.txnDescription, { color: theme.text }]} numberOfLines={1}>{txn.description}</Text>
                  <Text style={[styles.txnDate, { color: theme.textTertiary }]}>{formatRelativeDate(txn.createdAt)}</Text>
                </View>
                <Text style={[styles.txnAmount, { color: txn.type === 'credit' ? theme.success : theme.text }]}>
                  {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                </Text>
              </View>
            </Card>
          ))}

          {acctTransactions.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
              <Ionicons name="receipt-outline" size={48} color={theme.textTertiary} />
              <Text style={[styles.emptySubtext, { color: theme.textSecondary, marginTop: spacing.sm }]}>
                No transactions for this account
              </Text>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // === Main Dashboard View ===
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/more')}
              style={{ position: 'relative' }}
            >
              <Ionicons name="notifications-outline" size={26} color={theme.text} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <CaydenLogo size={52} />
          </View>
        </View>

        {/* Balance Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (checking) {
              setSelectedAccount(checking);
              fetchTransactions({ accountId: checking.id });
              setActiveView('accountDetail');
            }
          }}
        >
          <Card style={styles.balanceCardOuter} variant="hero">
            <LinearGradient
              colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.balanceCard}
            >
              <View style={styles.decorativeCircle} />

              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>
                {formatCurrency(totalBalance)}
              </Text>
              <View style={styles.accountRow}>
                <TouchableOpacity
                  style={styles.accountItem}
                  onPress={() => {
                    if (checking) {
                      setSelectedAccount(checking);
                      fetchTransactions({ accountId: checking.id });
                      setActiveView('accountDetail');
                    }
                  }}
                >
                  <Text style={styles.accountLabel}>Checking</Text>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(checking?.balance || 0)}
                  </Text>
                </TouchableOpacity>
                {savings && (
                  <TouchableOpacity
                    style={styles.accountItem}
                    onPress={() => {
                      setSelectedAccount(savings);
                      fetchTransactions({ accountId: savings.id });
                      setActiveView('accountDetail');
                    }}
                  >
                    <Text style={styles.accountLabel}>Savings</Text>
                    <Text style={styles.accountBalance}>
                      {formatCurrency(savings.balance)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </Card>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="arrow-down-circle"
            label="Deposit"
            color="#00A86B"
            bgColor={isDarkMode ? '#00A86B22' : '#D4EDDA'}
            onPress={() => setShowDepositModal(true)}
          />
          <QuickActionButton
            icon="swap-horizontal"
            label="Transfer"
            color="#1B5E20"
            bgColor={isDarkMode ? '#1B5E2022' : '#C8E6C9'}
            onPress={() => setShowTransferModal(true)}
          />
          <QuickActionButton
            icon="cash-outline"
            label="ExtraCash"
            color="#007A4D"
            bgColor={isDarkMode ? '#007A4D22' : '#B2DFDB'}
            onPress={() => router.push('/(tabs)/extracash')}
          />
          <QuickActionButton
            icon="card-outline"
            label="Card"
            color="#F59E0B"
            bgColor={isDarkMode ? '#F59E0B22' : '#FEF3C7'}
            onPress={() => router.push('/(tabs)/more')}
          />
        </View>

        {/* ExtraCash Banner */}
        {eligibility?.eligible && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/extracash')}
          >
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
          </TouchableOpacity>
        )}

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity
            onPress={() => {
              setTxnFilter(null);
              setTxnPage(1);
              loadTransactions(null, 1);
              setActiveView('transactions');
            }}
          >
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
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                No transactions yet
              </Text>
            </View>
          )}
        </Card>

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Transfer Money</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Direction Selector */}
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Direction</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      {
                        borderColor: transferDirection === 'checking_to_savings' ? theme.primary : theme.border,
                        backgroundColor: transferDirection === 'checking_to_savings'
                          ? isDarkMode ? `${theme.primary}22` : '#EEF2FF' : theme.surface,
                      },
                    ]}
                    onPress={() => setTransferDirection('checking_to_savings')}
                  >
                    <Ionicons name="arrow-forward" size={16} color={transferDirection === 'checking_to_savings' ? theme.primary : theme.textSecondary} />
                    <Text style={{ color: transferDirection === 'checking_to_savings' ? theme.primary : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
                      Checking to Savings
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      {
                        borderColor: transferDirection === 'savings_to_checking' ? theme.primary : theme.border,
                        backgroundColor: transferDirection === 'savings_to_checking'
                          ? isDarkMode ? `${theme.primary}22` : '#EEF2FF' : theme.surface,
                      },
                    ]}
                    onPress={() => setTransferDirection('savings_to_checking')}
                  >
                    <Ionicons name="arrow-back" size={16} color={transferDirection === 'savings_to_checking' ? theme.primary : theme.textSecondary} />
                    <Text style={{ color: transferDirection === 'savings_to_checking' ? theme.primary : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
                      Savings to Checking
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* From / To Info */}
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                <Card variant="elevated" style={{ borderRadius: borderRadius.xl }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textTertiary, letterSpacing: 0.5 }}>FROM</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 2 }}>
                        {transferDirection === 'checking_to_savings' ? 'Checking' : 'Savings'}
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
                        {formatCurrency(
                          (transferDirection === 'checking_to_savings' ? checking?.balance : savings?.balance) || 0
                        )}
                      </Text>
                    </View>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? `${theme.primary}22` : '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="arrow-forward" size={20} color={theme.primary} />
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textTertiary, letterSpacing: 0.5 }}>TO</Text>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 2 }}>
                        {transferDirection === 'checking_to_savings' ? 'Savings' : 'Checking'}
                      </Text>
                      <Text style={{ fontSize: 14, color: theme.textSecondary, marginTop: 2 }}>
                        {formatCurrency(
                          (transferDirection === 'checking_to_savings' ? savings?.balance : checking?.balance) || 0
                        )}
                      </Text>
                    </View>
                  </View>
                </Card>
              </View>

              {/* Amount Input */}
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Amount</Text>
                <View style={[styles.amountInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.amountPrefix, { color: theme.primary }]}>$</Text>
                  <TextInput
                    style={[styles.amountInput, { color: theme.text }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textTertiary}
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  {[25, 50, 100, 250].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickAmountButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                      onPress={() => setTransferAmount(amt.toString())}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>${amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Transfer Button */}
              <View style={{ paddingHorizontal: spacing.lg }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleTransfer}
                  disabled={transferring || !transferAmount}
                >
                  <LinearGradient
                    colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.actionButton, { opacity: transferring || !transferAmount ? 0.5 : 1 }]}
                  >
                    <Ionicons name="swap-horizontal" size={22} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>
                      {transferring ? 'Transferring...' : 'Transfer'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDepositModal(false)}>
                <Ionicons name="close" size={28} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Deposit Funds</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* Account Selector */}
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Deposit To</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                  <TouchableOpacity
                    style={[
                      styles.directionButton,
                      {
                        borderColor: depositAccountType === 'checking' ? theme.primary : theme.border,
                        backgroundColor: depositAccountType === 'checking'
                          ? isDarkMode ? `${theme.primary}22` : '#EEF2FF' : theme.surface,
                      },
                    ]}
                    onPress={() => setDepositAccountType('checking')}
                  >
                    <Ionicons name="wallet-outline" size={16} color={depositAccountType === 'checking' ? theme.primary : theme.textSecondary} />
                    <Text style={{ color: depositAccountType === 'checking' ? theme.primary : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
                      Checking
                    </Text>
                  </TouchableOpacity>
                  {savings && (
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        {
                          borderColor: depositAccountType === 'savings' ? theme.primary : theme.border,
                          backgroundColor: depositAccountType === 'savings'
                            ? isDarkMode ? `${theme.primary}22` : '#EEF2FF' : theme.surface,
                        },
                      ]}
                      onPress={() => setDepositAccountType('savings')}
                    >
                      <Ionicons name="cash-outline" size={16} color={depositAccountType === 'savings' ? theme.primary : theme.textSecondary} />
                      <Text style={{ color: depositAccountType === 'savings' ? theme.primary : theme.textSecondary, fontWeight: '600', fontSize: 13 }}>
                        Savings
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Current Balance */}
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                <Card variant="elevated" style={{ borderRadius: borderRadius.xl }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.textTertiary, letterSpacing: 0.5 }}>
                        CURRENT BALANCE
                      </Text>
                      <Text style={{ fontSize: 28, fontWeight: '800', color: theme.text, marginTop: 4 }}>
                        {formatCurrency((depositAccountType === 'checking' ? checking?.balance : savings?.balance) || 0)}
                      </Text>
                    </View>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDarkMode ? '#10B98122' : '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="arrow-down-circle" size={28} color="#10B981" />
                    </View>
                  </View>
                </Card>
              </View>

              {/* Amount Input */}
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Amount</Text>
                <View style={[styles.amountInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.amountPrefix, { color: theme.primary }]}>$</Text>
                  <TextInput
                    style={[styles.amountInput, { color: theme.text }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textTertiary}
                    value={depositAmount}
                    onChangeText={setDepositAmount}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  {[50, 100, 250, 500].map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.quickAmountButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                      onPress={() => setDepositAmount(amt.toString())}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>${amt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Note (optional)</Text>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                  ]}
                  placeholder="e.g. Paycheck, Gift, Refund"
                  placeholderTextColor={theme.textTertiary}
                  value={depositDescription}
                  onChangeText={setDepositDescription}
                />
              </View>

              {/* Deposit Button */}
              <View style={{ paddingHorizontal: spacing.lg }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleDeposit}
                  disabled={depositing || !depositAmount}
                >
                  <LinearGradient
                    colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.actionButton, { opacity: depositing || !depositAmount ? 0.5 : 1 }]}
                  >
                    <Ionicons name="arrow-down-circle" size={22} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>
                      {depositing ? 'Depositing...' : 'Deposit'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({
  label,
  value,
  theme,
  isLast = false,
}: {
  label: string;
  value: string;
  theme: any;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: spacing.sm,
        },
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
      ]}
    >
      <Text style={{ ...typography.caption, color: theme.textSecondary }}>{label}</Text>
      <Text style={{ ...typography.captionBold, color: theme.text }}>{value}</Text>
    </View>
  );
}

function QuickActionButton({
  icon,
  label,
  color,
  bgColor,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  bgColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.7}>
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
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
  txnCategoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.h4,
    marginTop: spacing.md,
  },
  emptySubtext: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  subTitle: {
    ...typography.h3,
  },
  filterScroll: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    borderWidth: 1,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageText: {
    ...typography.captionBold,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  amountPrefix: {
    fontSize: 32,
    fontWeight: '800',
    marginRight: spacing.xs,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
  },
  quickAmountButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
  },
  descriptionInput: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    marginTop: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...shadows.md,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
