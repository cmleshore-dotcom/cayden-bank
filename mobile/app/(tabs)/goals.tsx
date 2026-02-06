import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/authStore';
import { useGoalStore } from '../../src/stores/goalStore';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import { formatCurrency } from '../../src/utils/formatCurrency';

const GOAL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'piggy-bank': 'wallet',
  vacation: 'airplane',
  car: 'car',
  home: 'home',
  education: 'school',
  emergency: 'shield-checkmark',
  gift: 'gift',
  custom: 'flag',
};

const GOAL_GRADIENTS: Record<string, [string, string]> = {
  vacation: ['#3B82F6', '#06B6D4'],
  car: ['#8B5CF6', '#6366F1'],
  home: ['#10B981', '#34D399'],
  education: ['#F97316', '#F59E0B'],
  emergency: ['#EF4444', '#F97316'],
  gift: ['#EC4899', '#F472B6'],
  'piggy-bank': ['#10B981', '#06B6D4'],
  custom: ['#10B981', '#06B6D4'],
};

export default function GoalsScreen() {
  const { isDarkMode } = useAuthStore();
  const { goals, isLoading, fetchGoals, createGoal, fundGoal, deleteGoal } =
    useGoalStore();
  const theme = isDarkMode ? colors.dark : colors.light;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [goalName, setGoalName] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [fundAmount, setFundAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = async () => {
    if (!goalName || !goalAmount) {
      Alert.alert('Error', 'Please fill in name and target amount');
      return;
    }
    const amount = parseFloat(goalAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setCreating(true);
    try {
      await createGoal({ name: goalName, targetAmount: amount });
      setShowCreateModal(false);
      setGoalName('');
      setGoalAmount('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to create goal');
    } finally {
      setCreating(false);
    }
  };

  const handleFund = async () => {
    const amount = parseFloat(fundAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setFunding(true);
    try {
      await fundGoal(selectedGoalId, amount);
      setShowFundModal(false);
      setFundAmount('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to fund goal');
    } finally {
      setFunding(false);
    }
  };

  const handleDelete = (goalId: string, goalName: string) => {
    Alert.alert('Delete Goal', `Are you sure you want to delete "${goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteGoal(goalId),
      },
    ]);
  };

  const getGoalGradient = (icon: string): [string, string] => {
    return GOAL_GRADIENTS[icon] || ['#10B981', '#06B6D4'];
  };

  if (isLoading && goals.length === 0) {
    return <LoadingSpinner fullScreen />;
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="flag" size={28} color={theme.primary} />
            <Text style={[styles.title, { color: theme.text }]}>Goals</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.addButton, shadows.colored(theme.primary)]}
            >
              <Ionicons name="add" size={26} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary, marginHorizontal: spacing.lg },
              ]}
            >
              Active Goals
            </Text>
            {activeGoals.map((goal) => {
              const gradientColors = getGoalGradient(goal.icon);
              return (
                <Card
                  key={goal.id}
                  variant="elevated"
                  style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm }}
                >
                  <View style={styles.goalHeader}>
                    <View style={styles.goalLeft}>
                      <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.goalIcon}
                      >
                        <Ionicons
                          name={GOAL_ICONS[goal.icon] || 'flag'}
                          size={26}
                          color="#FFFFFF"
                        />
                      </LinearGradient>
                      <View>
                        <Text style={[styles.goalName, { color: theme.text }]}>
                          {goal.name}
                        </Text>
                        <Text
                          style={[
                            styles.goalMeta,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {formatCurrency(goal.currentAmount)} of{' '}
                          {formatCurrency(goal.targetAmount)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDelete(goal.id, goal.name)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={theme.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View
                      style={[
                        styles.progressTrack,
                        { backgroundColor: theme.surfaceSecondary },
                      ]}
                    >
                      <LinearGradient
                        colors={gradientColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(goal.progress, 100)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.progressText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {goal.progress.toFixed(1)}%
                    </Text>
                  </View>

                  <Button
                    title="Add Funds"
                    variant="outline"
                    size="small"
                    onPress={() => {
                      setSelectedGoalId(goal.id);
                      setShowFundModal(true);
                    }}
                    style={{ marginTop: spacing.sm }}
                  />
                </Card>
              );
            })}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={{ marginTop: spacing.md }}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.textSecondary, marginHorizontal: spacing.lg },
              ]}
            >
              Completed
            </Text>
            {completedGoals.map((goal) => (
              <Card
                key={goal.id}
                variant="elevated"
                style={{
                  marginHorizontal: spacing.lg,
                  marginBottom: spacing.sm,
                  backgroundColor: isDarkMode ? '#0a2a1a' : '#F0FDF4',
                }}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalLeft}>
                    <LinearGradient
                      colors={['#10B981', '#34D399']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.completedIcon}
                    >
                      <Ionicons
                        name="checkmark"
                        size={22}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                    <View style={{ marginLeft: spacing.sm }}>
                      <Text style={[styles.goalName, { color: theme.text }]}>
                        {goal.name}
                      </Text>
                      <Text
                        style={[
                          styles.goalMeta,
                          { color: theme.success },
                        ]}
                      >
                        {formatCurrency(goal.targetAmount)} reached!
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="flag-outline" size={80} color={theme.textTertiary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No goals yet
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: theme.textSecondary }]}
            >
              Start saving for something special
            </Text>
            <Button
              title="Create Your First Goal"
              onPress={() => setShowCreateModal(true)}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      {/* Create Goal Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.dragHandle}>
              <View style={[styles.dragHandleBar, { backgroundColor: theme.border }]} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Create New Goal
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Goal Name"
              placeholder="e.g., Vacation Fund"
              value={goalName}
              onChangeText={setGoalName}
              leftIcon="flag-outline"
            />
            <Input
              label="Target Amount"
              placeholder="e.g., 1000"
              value={goalAmount}
              onChangeText={setGoalAmount}
              keyboardType="decimal-pad"
              leftIcon="cash-outline"
            />

            <Button
              title="Create Goal"
              onPress={handleCreate}
              loading={creating}
              size="large"
            />
          </View>
        </View>
      </Modal>

      {/* Fund Goal Modal */}
      <Modal visible={showFundModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <View style={styles.dragHandle}>
              <View style={[styles.dragHandleBar, { backgroundColor: theme.border }]} />
            </View>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Add Funds
              </Text>
              <TouchableOpacity onPress={() => setShowFundModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Amount"
              placeholder="Enter amount"
              value={fundAmount}
              onChangeText={setFundAmount}
              keyboardType="decimal-pad"
              leftIcon="cash-outline"
            />

            <Button
              title="Fund Goal"
              onPress={handleFund}
              loading={funding}
              size="large"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...typography.captionBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  completedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    ...typography.bodyBold,
  },
  goalMeta: {
    ...typography.small,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.small,
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  dragHandle: {
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  dragHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
  },
});
