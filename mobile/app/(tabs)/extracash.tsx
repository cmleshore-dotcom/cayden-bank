import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useAdvanceStore } from '../../src/stores/advanceStore';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { formatDate } from '../../src/utils/dateHelpers';

export default function ExtraCashScreen() {
  const { isDarkMode } = useAuthStore();
  const {
    eligibility,
    advances,
    isLoading,
    checkEligibility,
    requestAdvance,
    fetchAdvances,
    repayAdvance,
  } = useAdvanceStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [amount, setAmount] = useState(25);
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>(
    'standard'
  );
  const [tip, setTip] = useState(0);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    checkEligibility();
    fetchAdvances();
  }, []);

  const fee =
    deliverySpeed === 'express'
      ? parseFloat((amount * 0.05).toFixed(2))
      : 0;

  const handleRequest = async () => {
    Alert.alert(
      'Confirm ExtraCash',
      `Amount: ${formatCurrency(amount)}\nDelivery: ${
        deliverySpeed === 'express' ? 'Express (instant)' : 'Standard (1-3 days)'
      }\nFee: ${formatCurrency(fee)}\nTip: ${formatCurrency(tip)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setRequesting(true);
            try {
              await requestAdvance(amount, deliverySpeed, tip);
              Alert.alert('Success', 'Your ExtraCash advance has been requested!');
            } catch (err: any) {
              Alert.alert(
                'Error',
                err.response?.data?.message || 'Failed to request advance'
              );
            } finally {
              setRequesting(false);
            }
          },
        },
      ]
    );
  };

  const handleRepay = (advanceId: string) => {
    Alert.alert('Repay Advance', 'Are you sure you want to repay this advance?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Repay',
        onPress: async () => {
          try {
            await repayAdvance(advanceId);
            Alert.alert('Success', 'Advance repaid successfully!');
            checkEligibility();
          } catch (err: any) {
            Alert.alert(
              'Error',
              err.response?.data?.message || 'Failed to repay'
            );
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with gradient icon */}
        <View style={styles.headerSection}>
          <LinearGradient
            colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIconCircle}
          >
            <Ionicons name="flash" size={30} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.title, { color: theme.text }]}>ExtraCash</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Get an advance on your next paycheck
          </Text>
        </View>

        {/* Linked Bank Requirement Banner */}
        {eligibility && !eligibility.hasLinkedBank && (
          <Card variant="elevated" style={[styles.cardSpacing, { marginBottom: spacing.md }]}>
            <View style={styles.bankBannerContent}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bankBannerIcon}
              >
                <Ionicons name="business-outline" size={24} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.bankBannerTitle, { color: theme.text }]}>
                Link a Bank Account
              </Text>
              <Text style={[styles.bankBannerText, { color: theme.textSecondary }]}>
                To borrow money with ExtraCash, you need to link and verify an external bank account first.
              </Text>
              <TouchableOpacity
                style={[styles.bankBannerButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push({ pathname: '/(tabs)/more', params: { tab: 'bankaccounts' } })}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.bankBannerButtonText}>
                  Go to Bank Accounts
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Eligibility Status */}
        <Card variant="elevated" style={styles.cardSpacing}>
          <View style={styles.eligibilityHeader}>
            <Text style={[styles.eligibilityTitle, { color: theme.text }]}>
              Your Eligibility
            </Text>
            <View
              style={[
                styles.scoreBadge,
                {
                  backgroundColor: eligibility?.eligible
                    ? isDarkMode
                      ? '#1a3a2a'
                      : '#ECFDF5'
                    : isDarkMode
                    ? '#3a1a1a'
                    : '#FEF2F2',
                },
              ]}
            >
              <Text
                style={[
                  styles.scoreText,
                  {
                    color: eligibility?.eligible
                      ? theme.success
                      : theme.error,
                  },
                ]}
              >
                {eligibility?.score || 0}
              </Text>
              <Text
                style={[
                  styles.scoreOutOf,
                  {
                    color: eligibility?.eligible
                      ? theme.success
                      : theme.error,
                  },
                ]}
              >
                /100
              </Text>
            </View>
          </View>

          {/* Factor Bars */}
          {eligibility?.factors && (
            <View style={styles.factorsContainer}>
              <FactorBar
                label="Income"
                value={eligibility.factors.incomeConsistency}
                theme={theme}
              />
              <FactorBar
                label="Balance"
                value={eligibility.factors.averageBalance}
                theme={theme}
              />
              <FactorBar
                label="Spending"
                value={eligibility.factors.spendingPatterns}
                theme={theme}
              />
              <FactorBar
                label="Account Age"
                value={eligibility.factors.accountAge}
                theme={theme}
              />
              <FactorBar
                label="Repayment"
                value={eligibility.factors.repaymentHistory}
                theme={theme}
              />
            </View>
          )}

          <Text style={[styles.eligibilityMessage, { color: theme.textSecondary }]}>
            {eligibility?.message}
          </Text>
        </Card>

        {/* Request Form — only show if eligible AND has a linked bank account */}
        {eligibility?.eligible && eligibility?.hasLinkedBank && (
          <Card
            variant="elevated"
            style={[styles.cardSpacing, { marginTop: spacing.md }]}
          >
            <Text style={[styles.formTitle, { color: theme.text }]}>
              Request an Advance
            </Text>

            {/* Amount Display */}
            <View style={styles.amountDisplay}>
              <Text style={[styles.amountValue, { color: theme.primary }]}>
                {formatCurrency(amount)}
              </Text>
              <Text style={[styles.amountRange, { color: theme.textTertiary }]}>
                $25 - {formatCurrency(eligibility.maxAmount)}
              </Text>
            </View>

            {/* Amount Slider */}
            <View style={styles.sliderContainer}>
              <TouchableOpacity
                onPress={() => setAmount(Math.max(25, amount - 25))}
                style={[
                  styles.sliderButton,
                  {
                    backgroundColor: theme.surface,
                    ...shadows.sm,
                  },
                ]}
              >
                <Ionicons name="remove" size={20} color={theme.primary} />
              </TouchableOpacity>
              <View style={[styles.sliderTrack, { backgroundColor: theme.surfaceSecondary }]}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${((amount - 25) / (eligibility.maxAmount - 25)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <TouchableOpacity
                onPress={() =>
                  setAmount(Math.min(eligibility.maxAmount, amount + 25))
                }
                style={[
                  styles.sliderButton,
                  {
                    backgroundColor: theme.surface,
                    ...shadows.sm,
                  },
                ]}
              >
                <Ionicons name="add" size={20} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Quick Amount Buttons */}
            <View style={styles.quickAmounts}>
              {[50, 100, 200, eligibility.maxAmount].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[
                    styles.quickAmountBtn,
                    {
                      backgroundColor:
                        amount === a ? theme.primary : theme.surfaceSecondary,
                      borderColor: amount === a ? theme.primary : 'transparent',
                    },
                    amount === a && shadows.colored(theme.primary),
                  ]}
                  onPress={() => setAmount(a)}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      { color: amount === a ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    ${a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Delivery Speed */}
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.text, marginTop: spacing.xl },
              ]}
            >
              Delivery Speed
            </Text>
            <View style={styles.deliveryOptions}>
              {/* Standard Option */}
              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  {
                    borderColor:
                      deliverySpeed === 'standard'
                        ? theme.primary
                        : theme.border,
                    borderWidth: deliverySpeed === 'standard' ? 3 : 1,
                    backgroundColor:
                      deliverySpeed === 'standard'
                        ? isDarkMode
                          ? '#1a3a1a'
                          : '#F0FFF4'
                        : theme.surface,
                  },
                  deliverySpeed === 'standard' && shadows.md,
                ]}
                onPress={() => setDeliverySpeed('standard')}
              >
                <View style={styles.deliveryRadioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor:
                          deliverySpeed === 'standard'
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    {deliverySpeed === 'standard' && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                    )}
                  </View>
                </View>
                <Ionicons name="time-outline" size={24} color={theme.primary} />
                <Text style={[styles.deliveryLabel, { color: theme.text }]}>
                  Standard
                </Text>
                <Text
                  style={[
                    styles.deliveryDetail,
                    { color: theme.textSecondary },
                  ]}
                >
                  1-3 business days
                </Text>
                <Text style={[styles.deliveryFee, { color: theme.success }]}>
                  FREE
                </Text>
              </TouchableOpacity>

              {/* Express Option */}
              <TouchableOpacity
                style={[
                  styles.deliveryOption,
                  {
                    borderColor:
                      deliverySpeed === 'express'
                        ? theme.primary
                        : theme.border,
                    borderWidth: deliverySpeed === 'express' ? 3 : 1,
                    backgroundColor:
                      deliverySpeed === 'express'
                        ? isDarkMode
                          ? '#1a3a1a'
                          : '#F0FFF4'
                        : theme.surface,
                  },
                  deliverySpeed === 'express' && shadows.md,
                ]}
                onPress={() => setDeliverySpeed('express')}
              >
                <View style={styles.deliveryRadioRow}>
                  <View
                    style={[
                      styles.radioOuter,
                      {
                        borderColor:
                          deliverySpeed === 'express'
                            ? theme.primary
                            : theme.border,
                      },
                    ]}
                  >
                    {deliverySpeed === 'express' && (
                      <View
                        style={[
                          styles.radioInner,
                          { backgroundColor: theme.primary },
                        ]}
                      />
                    )}
                  </View>
                </View>
                <Ionicons name="flash" size={24} color={theme.warning} />
                <Text style={[styles.deliveryLabel, { color: theme.text }]}>
                  Express
                </Text>
                <Text
                  style={[
                    styles.deliveryDetail,
                    { color: theme.textSecondary },
                  ]}
                >
                  Instant
                </Text>
                <Text style={[styles.deliveryFee, { color: theme.warning }]}>
                  5% fee
                </Text>
              </TouchableOpacity>
            </View>

            {/* Optional Tip */}
            <Text
              style={[
                styles.sectionLabel,
                { color: theme.text, marginTop: spacing.xl },
              ]}
            >
              Leave a Tip (Optional)
            </Text>
            <View style={styles.quickAmounts}>
              {[0, 1, 3, 5].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.quickAmountBtn,
                    {
                      backgroundColor:
                        tip === t ? theme.primary : theme.surfaceSecondary,
                      borderColor: tip === t ? theme.primary : 'transparent',
                    },
                    tip === t && shadows.colored(theme.primary),
                  ]}
                  onPress={() => setTip(t)}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      { color: tip === t ? '#FFFFFF' : theme.text },
                    ]}
                  >
                    {t === 0 ? 'None' : `$${t}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Summary */}
            <View
              style={[
                styles.summary,
                {
                  backgroundColor: theme.surfaceSecondary,
                  ...shadows.sm,
                },
              ]}
            >
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Advance Amount
                </Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {formatCurrency(amount)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Delivery Fee
                </Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {formatCurrency(fee)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Optional Tip
                </Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {formatCurrency(tip)}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryRow,
                  styles.totalRow,
                  { borderTopColor: theme.border },
                ]}
              >
                <Text style={[styles.totalLabel, { color: theme.text }]}>
                  Total Repayment
                </Text>
                <Text style={[styles.totalValue, { color: theme.primary }]}>
                  {formatCurrency(amount + fee + tip)}
                </Text>
              </View>
            </View>

            <Button
              title="Get ExtraCash"
              onPress={handleRequest}
              loading={requesting}
              size="large"
              style={{ marginTop: spacing.lg }}
            />
          </Card>
        )}

        {/* Advance History */}
        {advances.length > 0 && (
          <View style={{ marginTop: spacing.xl }}>
            <Text
              style={[
                styles.historyTitle,
                { color: theme.text, paddingHorizontal: spacing.lg },
              ]}
            >
              Advance History
            </Text>
            {advances.map((adv) => (
              <Card
                key={adv.id}
                variant="elevated"
                style={[styles.cardSpacing, { marginTop: spacing.sm }]}
              >
                <View style={styles.advanceRow}>
                  <View>
                    <Text style={[styles.advanceAmount, { color: theme.text }]}>
                      {formatCurrency(adv.amount)}
                    </Text>
                    <Text
                      style={[
                        styles.advanceDate,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {formatDate(adv.createdAt)}
                    </Text>
                  </View>
                  <View style={styles.advanceRight}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            adv.status === 'repaid'
                              ? isDarkMode
                                ? '#1a3a2a'
                                : '#ECFDF5'
                              : adv.status === 'overdue'
                              ? isDarkMode
                                ? '#3a1a1a'
                                : '#FEF2F2'
                              : isDarkMode
                              ? '#1a2a3a'
                              : '#EFF6FF',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          adv.status === 'repaid'
                            ? 'checkmark-circle'
                            : adv.status === 'overdue'
                            ? 'alert-circle'
                            : 'time'
                        }
                        size={12}
                        color={
                          adv.status === 'repaid'
                            ? theme.success
                            : adv.status === 'overdue'
                            ? theme.error
                            : theme.info
                        }
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              adv.status === 'repaid'
                                ? theme.success
                                : adv.status === 'overdue'
                                ? theme.error
                                : theme.info,
                          },
                        ]}
                      >
                        {adv.status.toUpperCase()}
                      </Text>
                    </View>
                    {['funded', 'repayment_scheduled', 'overdue'].includes(
                      adv.status
                    ) && (
                      <TouchableOpacity
                        onPress={() => handleRepay(adv.id)}
                        style={[
                          styles.repayBtn,
                          { backgroundColor: isDarkMode ? '#1a3a2a' : '#ECFDF5' },
                        ]}
                      >
                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
                          Repay
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function FactorBar({
  label,
  value,
  theme,
}: {
  label: string;
  value: number;
  theme: any;
}) {
  return (
    <View style={factorStyles.container}>
      <View style={factorStyles.labelRow}>
        <Text style={[factorStyles.label, { color: theme.textSecondary }]}>
          {label}
        </Text>
        <Text style={[factorStyles.value, { color: theme.text }]}>
          {value}%
        </Text>
      </View>
      <View
        style={[factorStyles.track, { backgroundColor: theme.surfaceSecondary }]}
      >
        <View
          style={[
            factorStyles.fill,
            {
              width: `${value}%`,
              backgroundColor:
                value >= 70
                  ? theme.success
                  : value >= 40
                  ? theme.warning
                  : theme.error,
            },
          ]}
        />
      </View>
    </View>
  );
}

const factorStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  value: {
    ...typography.caption,
    fontWeight: '700',
  },
  track: {
    height: 12,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 9999,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  headerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    marginTop: spacing.md,
  },
  subtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  cardSpacing: {
    marginHorizontal: spacing.lg,
  },
  eligibilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  eligibilityTitle: {
    ...typography.h4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  scoreOutOf: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  factorsContainer: {
    marginBottom: spacing.md,
  },
  eligibilityMessage: {
    ...typography.caption,
    textAlign: 'center',
  },
  formTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  amountDisplay: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  amountValue: {
    ...typography.hero,
  },
  amountRange: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  sliderButton: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 12,
    borderRadius: 9999,
    marginHorizontal: spacing.md,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 9999,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  quickAmountBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    alignItems: 'center',
    borderWidth: 0,
  },
  quickAmountText: {
    ...typography.captionBold,
  },
  sectionLabel: {
    ...typography.label,
    marginBottom: spacing.md,
  },
  deliveryOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  deliveryOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  deliveryRadioRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  deliveryLabel: {
    ...typography.captionBold,
    marginTop: spacing.xs,
  },
  deliveryDetail: {
    ...typography.small,
    marginTop: 2,
  },
  deliveryFee: {
    ...typography.captionBold,
    marginTop: spacing.xs,
  },
  summary: {
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.caption,
  },
  summaryValue: {
    ...typography.captionBold,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginBottom: 0,
    marginTop: spacing.xs,
  },
  totalLabel: {
    ...typography.bodyBold,
  },
  totalValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  historyTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  advanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  advanceAmount: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  advanceDate: {
    ...typography.small,
    marginTop: 4,
  },
  advanceRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  repayBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  bankBannerContent: {
    alignItems: 'center',
  },
  bankBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  bankBannerTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  bankBannerText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  bankBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  bankBannerButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
