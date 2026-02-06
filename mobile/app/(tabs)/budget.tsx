import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { useBudgetStore } from '../../src/stores/budgetStore';
import { Card } from '../../src/components/common/Card';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { formatCurrency } from '../../src/utils/formatCurrency';
import { getMonthName } from '../../src/utils/dateHelpers';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant',
  transport: 'car',
  entertainment: 'game-controller',
  shopping: 'bag-handle',
  bills: 'receipt',
  health: 'heart',
  education: 'school',
  other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FF6384',
  '#C9CBCF',
];

export default function BudgetScreen() {
  const { isDarkMode } = useAuthStore();
  const {
    spending,
    incomeExpense,
    prediction,
    isLoading,
    fetchSpending,
    fetchIncomeExpense,
    fetchPrediction,
  } = useBudgetStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  useEffect(() => {
    fetchSpending();
    fetchIncomeExpense();
    fetchPrediction();
  }, []);

  if (isLoading && !spending) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with gradient icon */}
        <View style={styles.header}>
          <LinearGradient
            colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIconCircle}
          >
            <Ionicons name="pie-chart" size={22} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.title, { color: theme.text }]}>Budget</Text>
        </View>

        {/* Monthly Spending Overview */}
        <Card variant="elevated" style={styles.cardSpacing}>
          {/* Gradient Header Band */}
          <View style={styles.gradientHeaderWrapper}>
            <LinearGradient
              colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
              <Text style={styles.gradientHeaderMonth}>
                {spending ? getMonthName(spending.month) : 'This Month'}
              </Text>
              <Text style={styles.gradientHeaderAmount}>
                {formatCurrency(spending?.totalSpent || 0)}
              </Text>
              <Text style={styles.gradientHeaderLabel}>total spent</Text>
            </LinearGradient>
          </View>

          {/* Simple Bar Chart */}
          {spending?.categories && spending.categories.length > 0 && (
            <View style={styles.chartContainer}>
              {spending.categories
                .sort((a, b) => b.total - a.total)
                .map((cat, index) => {
                  const catColor =
                    CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                  return (
                    <View key={cat.category} style={styles.barRow}>
                      <View style={styles.barLabel}>
                        <View
                          style={[
                            styles.categoryIconCircle,
                            { backgroundColor: catColor + '20' },
                          ]}
                        >
                          <Ionicons
                            name={
                              CATEGORY_ICONS[cat.category] ||
                              'ellipsis-horizontal'
                            }
                            size={14}
                            color={catColor}
                          />
                        </View>
                        <Text
                          style={[
                            styles.barLabelText,
                            { color: theme.text },
                          ]}
                        >
                          {cat.category.charAt(0).toUpperCase() +
                            cat.category.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.barTrack,
                            { backgroundColor: theme.surfaceSecondary },
                          ]}
                        >
                          <View
                            style={[
                              styles.barFill,
                              {
                                width: `${cat.percentage}%`,
                                backgroundColor: catColor,
                              },
                            ]}
                          />
                        </View>
                        <Text
                          style={[
                            styles.barAmount,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {formatCurrency(cat.total)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          )}

          {(!spending?.categories || spending.categories.length === 0) && (
            <View style={styles.emptyChart}>
              <Ionicons
                name="analytics-outline"
                size={48}
                color={theme.textTertiary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No spending data yet
              </Text>
            </View>
          )}
        </Card>

        {/* Prediction Card */}
        {prediction && (
          <Card
            variant="elevated"
            style={[styles.cardSpacing, { marginTop: spacing.md }]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Month-End Prediction
            </Text>

            <View style={styles.predictionGrid}>
              <View
                style={[
                  styles.predictionItem,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.predictionLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Daily Average
                </Text>
                <Text style={[styles.predictionValue, { color: theme.text }]}>
                  {formatCurrency(prediction.dailyAverageSpend)}
                </Text>
              </View>
              <View
                style={[
                  styles.predictionItem,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.predictionLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Days Left
                </Text>
                <Text style={[styles.predictionValue, { color: theme.text }]}>
                  {prediction.daysRemaining}
                </Text>
              </View>
              <View
                style={[
                  styles.predictionItem,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.predictionLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Predicted Spend
                </Text>
                <Text
                  style={[styles.predictionValue, { color: theme.warning }]}
                >
                  {formatCurrency(prediction.predictedMonthlySpend)}
                </Text>
              </View>
              <View
                style={[
                  styles.predictionItem,
                  { backgroundColor: theme.surfaceSecondary },
                ]}
              >
                <Text
                  style={[
                    styles.predictionLabel,
                    { color: theme.textSecondary },
                  ]}
                >
                  Predicted Balance
                </Text>
                <Text
                  style={[
                    styles.predictionValue,
                    {
                      color:
                        prediction.predictedEndOfMonthBalance >= 0
                          ? theme.success
                          : theme.error,
                    },
                  ]}
                >
                  {formatCurrency(prediction.predictedEndOfMonthBalance)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Income vs Expense */}
        {incomeExpense.length > 0 && (
          <Card
            variant="elevated"
            style={[styles.cardSpacing, { marginTop: spacing.md }]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Income vs Expenses
            </Text>

            {incomeExpense.map((ie) => (
              <View
                key={ie.month}
                style={[
                  styles.ieRow,
                  { borderBottomColor: theme.border },
                ]}
              >
                <Text style={[styles.ieMonth, { color: theme.text }]}>
                  {getMonthName(ie.month)}
                </Text>
                <View style={styles.ieValues}>
                  <View style={styles.ieItem}>
                    <Ionicons
                      name="arrow-down-circle"
                      size={14}
                      color={theme.success}
                    />
                    <Text
                      style={[styles.ieAmount, { color: theme.success }]}
                    >
                      {formatCurrency(ie.income)}
                    </Text>
                  </View>
                  <View style={styles.ieItem}>
                    <Ionicons
                      name="arrow-up-circle"
                      size={14}
                      color={theme.error}
                    />
                    <Text style={[styles.ieAmount, { color: theme.error }]}>
                      {formatCurrency(ie.expenses)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.netBadge,
                      {
                        backgroundColor:
                          ie.net >= 0 ? theme.success : theme.error,
                      },
                    ]}
                  >
                    <Text style={styles.netBadgeText}>
                      {ie.net >= 0 ? '+' : ''}
                      {formatCurrency(ie.net)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
  },
  cardSpacing: {
    marginHorizontal: spacing.lg,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.md,
  },
  /* Gradient Header Band inside Monthly Spending card */
  gradientHeaderWrapper: {
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  gradientHeader: {
    height: 80,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  gradientHeaderMonth: {
    ...typography.label,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  gradientHeaderAmount: {
    ...typography.amount,
    color: '#FFFFFF',
  },
  gradientHeaderLabel: {
    ...typography.label,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
  },
  /* Category Bar Chart */
  chartContainer: {
    marginTop: spacing.sm,
  },
  barRow: {
    marginBottom: spacing.md,
  },
  barLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: spacing.sm,
  },
  categoryIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barLabelText: {
    ...typography.caption,
    fontWeight: '600',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  barTrack: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 8,
  },
  barAmount: {
    ...typography.small,
    fontWeight: '700',
    width: 70,
    textAlign: 'right',
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  /* Prediction Grid */
  predictionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  predictionItem: {
    width: '46%',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  predictionLabel: {
    ...typography.small,
  },
  predictionValue: {
    ...typography.h4,
    marginTop: 4,
  },
  /* Income vs Expense */
  ieRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  ieMonth: {
    ...typography.captionBold,
    marginBottom: spacing.sm,
  },
  ieValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  ieItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ieAmount: {
    ...typography.caption,
    fontWeight: '600',
  },
  netBadge: {
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
  },
  netBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
