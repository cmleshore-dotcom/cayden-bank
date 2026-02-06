import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useLinkedAccountStore } from '../../src/stores/linkedAccountStore';
import { usePinStore } from '../../src/stores/pinStore';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { PinSetupScreen } from '../../src/components/security/PinSetupScreen';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import api from '../../src/services/api';
import { SideHustle, ChatMessage, LinkedAccount } from '../../src/types';

type Tab = 'menu' | 'sidehustles' | 'chat' | 'profile' | 'bankaccounts' | 'security';

const HUSTLE_CATEGORY_LABELS: Record<string, string> = {
  remote: 'Remote',
  seasonal: 'Seasonal',
  part_time: 'Part-Time',
  gig: 'Gig Work',
  freelance: 'Freelance',
};

const HUSTLE_ACCENT_COLORS: Record<string, string> = {
  remote: '#6366F1',
  seasonal: '#F97316',
  part_time: '#3B82F6',
  gig: '#EC4899',
  freelance: '#8B5CF6',
};

const MENU_ITEM_STYLES: Record<string, { bg: string; icon: string }> = {
  'Side Hustles': { bg: '#E0E7FF', icon: '#6366F1' },
  'Cayden AI Chat': { bg: '#DBEAFE', icon: '#3B82F6' },
  'Profile & Settings': { bg: '#D1FAE5', icon: '#10B981' },
  'Bank Accounts': { bg: '#FEF3C7', icon: '#F59E0B' },
  'Virtual Card': { bg: '#FEFCE8', icon: '#EAB308' },
  'Notifications': { bg: '#FCE7F3', icon: '#EC4899' },
  'Security': { bg: '#F3E8FF', icon: '#8B5CF6' },
  'Help & Support': { bg: '#CCFBF1', icon: '#06B6D4' },
};

export default function MoreScreen() {
  const { user, isDarkMode, toggleDarkMode, logout } = useAuthStore();
  const theme = isDarkMode ? colors.dark : colors.light;
  const [activeTab, setActiveTab] = useState<Tab>('menu');

  if (activeTab === 'sidehustles') {
    return (
      <SideHustleScreen
        theme={theme}
        isDarkMode={isDarkMode}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  if (activeTab === 'chat') {
    return (
      <ChatScreen
        theme={theme}
        isDarkMode={isDarkMode}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  if (activeTab === 'profile') {
    return (
      <ProfileScreen
        theme={theme}
        isDarkMode={isDarkMode}
        user={user}
        toggleDarkMode={toggleDarkMode}
        logout={logout}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  if (activeTab === 'bankaccounts') {
    return (
      <BankAccountsScreen
        theme={theme}
        isDarkMode={isDarkMode}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  if (activeTab === 'security') {
    return (
      <SecuritySettingsScreen
        theme={theme}
        isDarkMode={isDarkMode}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="menu" size={28} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>More</Text>
        </View>

        <View style={styles.menuList}>
          <MenuItem
            icon="briefcase-outline"
            label="Side Hustles"
            subtitle="Find ways to earn extra income"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() => setActiveTab('sidehustles')}
          />
          <MenuItem
            icon="chatbubble-outline"
            label="Cayden AI Chat"
            subtitle="Get help from your financial assistant"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() => setActiveTab('chat')}
          />
          <MenuItem
            icon="person-outline"
            label="Profile & Settings"
            subtitle="Manage your account"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() => setActiveTab('profile')}
          />
          <MenuItem
            icon="business-outline"
            label="Bank Accounts"
            subtitle="Manage linked bank accounts"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() => setActiveTab('bankaccounts')}
          />
          <MenuItem
            icon="card-outline"
            label="Virtual Card"
            subtitle="View your Cayden debit card"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() =>
              Alert.alert('Coming Soon', 'Virtual card management is coming soon!')
            }
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            subtitle="Manage your alerts"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() =>
              Alert.alert(
                'Coming Soon',
                'Notification settings are coming soon!'
              )
            }
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Security"
            subtitle="Password, biometrics, and more"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() => setActiveTab('security')}
          />
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            subtitle="FAQs and contact support"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() =>
              Alert.alert('Help', 'Contact us at support@caydenbank.com')
            }
          />
        </View>

        {/* Dark Mode Toggle */}
        <Card
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
          variant="elevated"
        >
          <View style={[styles.toggleRow, { borderRadius: borderRadius.xl }]}>
            <View style={styles.toggleLeft}>
              <Ionicons
                name={isDarkMode ? 'moon' : 'sunny'}
                size={24}
                color={theme.primary}
              />
              <Text style={[styles.toggleLabel, { color: theme.text }]}>
                Dark Mode
              </Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        {/* Logout */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              borderColor: theme.error,
              marginHorizontal: spacing.lg,
            },
          ]}
          onPress={() => {
            Alert.alert('Logout', 'Are you sure you want to sign out?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/(auth)/login');
                },
              },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.error} />
          <Text style={[styles.logoutText, { color: theme.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  theme,
  isDarkMode,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  theme: any;
  isDarkMode: boolean;
  onPress: () => void;
}) {
  const itemStyle = MENU_ITEM_STYLES[label] || { bg: '#D1FAE5', icon: '#10B981' };
  const iconBg = isDarkMode ? `${itemStyle.icon}22` : itemStyle.bg;

  return (
    <TouchableOpacity
      style={[
        styles.menuItem,
        {
          backgroundColor: theme.surface,
          borderRadius: borderRadius.lg,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.menuIcon,
          {
            backgroundColor: iconBg,
            ...shadows.sm,
          },
        ]}
      >
        <Ionicons name={icon} size={24} color={itemStyle.icon} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.menuSubtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
    </TouchableOpacity>
  );
}

// Side Hustle Sub-screen
function SideHustleScreen({
  theme,
  isDarkMode,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}) {
  const [hustles, setHustles] = useState<SideHustle[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHustles();
  }, [filter]);

  const loadHustles = async () => {
    setLoading(true);
    try {
      const params = filter ? { category: filter } : {};
      const res = await api.get('/sidehustles', { params });
      setHustles(res.data.data);
    } catch {
      // ignore
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>
          Side Hustles
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            filter === null && { ...shadows.sm },
            {
              backgroundColor: filter === null ? theme.primary : theme.surface,
              borderColor: filter === null ? theme.primary : theme.border,
            },
          ]}
          onPress={() => setFilter(null)}
        >
          <Text
            style={{
              color: filter === null ? '#FFFFFF' : theme.text,
              fontWeight: '600',
              fontSize: 13,
            }}
          >
            All
          </Text>
        </TouchableOpacity>
        {Object.entries(HUSTLE_CATEGORY_LABELS).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.filterChip,
              filter === key && { ...shadows.sm },
              {
                backgroundColor:
                  filter === key ? theme.primary : theme.surface,
                borderColor: filter === key ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setFilter(key)}
          >
            <Text
              style={{
                color: filter === key ? '#FFFFFF' : theme.text,
                fontWeight: '600',
                fontSize: 13,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }}>
        {hustles.map((hustle) => {
          const accentColor =
            HUSTLE_ACCENT_COLORS[hustle.category] || theme.primary;
          return (
            <Card
              key={hustle.id}
              variant="elevated"
              style={{
                marginHorizontal: spacing.lg,
                marginBottom: spacing.sm,
                borderRadius: borderRadius.xl,
                borderLeftWidth: 4,
                borderLeftColor: accentColor,
              }}
            >
              <View style={styles.hustleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hustleTitle, { color: theme.text }]}>
                    {hustle.title}
                  </Text>
                  <Text
                    style={[
                      styles.hustleCompany,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {hustle.company}
                  </Text>
                </View>
                <View
                  style={[
                    styles.payBadge,
                    { backgroundColor: isDarkMode ? '#1a3a1a' : '#F0FFF4' },
                  ]}
                >
                  <Text style={[styles.payText, { color: theme.success }]}>
                    {hustle.payRange}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.hustleDescription,
                  { color: theme.textSecondary },
                ]}
                numberOfLines={2}
              >
                {hustle.description}
              </Text>
              <View style={styles.hustleFooter}>
                <View style={styles.hustleMeta}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={theme.textTertiary}
                  />
                  <Text
                    style={[
                      styles.hustleMetaText,
                      { color: theme.textTertiary },
                    ]}
                  >
                    {hustle.location}
                  </Text>
                </View>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: theme.surfaceSecondary },
                  ]}
                >
                  <Text
                    style={[styles.categoryText, { color: theme.textSecondary }]}
                  >
                    {HUSTLE_CATEGORY_LABELS[hustle.category] || hustle.category}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// Chat Sub-screen
function ChatScreen({
  theme,
  isDarkMode,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get('/chat/history');
      setMessages(res.data.data);
    } catch {
      // ignore
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await api.post('/chat', { message: userMsg.content });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.data.content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>
          Cayden AI
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatMessages}
        contentContainerStyle={{ paddingBottom: spacing.md }}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.length === 0 && (
          <View style={styles.chatEmpty}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={64}
              color={theme.textTertiary}
            />
            <Text style={[styles.chatEmptyTitle, { color: theme.text }]}>
              Welcome to Cayden AI
            </Text>
            <Text
              style={[
                styles.chatEmptySubtitle,
                { color: theme.textSecondary },
              ]}
            >
              Ask me about your balance, spending, ExtraCash, goals, or
              anything else!
            </Text>
          </View>
        )}
        {messages.map((msg) => (
          <View key={msg.id}>
            {msg.role === 'user' ? (
              <LinearGradient
                colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.chatBubble, styles.userBubble]}
              >
                <Text style={[styles.chatText, { color: '#FFFFFF' }]}>
                  {msg.content}
                </Text>
              </LinearGradient>
            ) : (
              <View
                style={[
                  styles.chatBubble,
                  styles.assistantBubble,
                  {
                    backgroundColor: theme.surface,
                    ...shadows.sm,
                  },
                ]}
              >
                <Text style={[styles.chatText, { color: theme.text }]}>
                  {msg.content}
                </Text>
              </View>
            )}
          </View>
        ))}
        {sending && (
          <View
            style={[
              styles.chatBubble,
              styles.assistantBubble,
              {
                backgroundColor: theme.surface,
                ...shadows.sm,
              },
            ]}
          >
            <Text style={[styles.chatText, { color: theme.textTertiary }]}>
              Thinking...
            </Text>
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.chatInputContainer,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          <TextInput
            style={[
              styles.chatInput,
              {
                backgroundColor: theme.surfaceSecondary,
                color: theme.text,
              },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textTertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={sending || !input.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendButton}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Profile Sub-screen
function ProfileScreen({
  theme,
  isDarkMode,
  user,
  toggleDarkMode,
  logout,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  user: any;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header with Gradient Band */}
        <View style={styles.profileHeaderWrapper}>
          <LinearGradient
            colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileGradientBand}
          />
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatarWrapper}>
              <LinearGradient
                colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.profileAvatar}
              >
                <Text style={styles.profileAvatarText}>
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Text>
              </LinearGradient>
            </View>
            <Text style={[styles.profileName, { color: theme.text }]}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text
              style={[styles.profileEmail, { color: theme.textSecondary }]}
            >
              {user?.email}
            </Text>
            <View style={styles.verifiedBadgeWrapper}>
              <LinearGradient
                colors={['#10B981', '#34D399']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.verifiedIconCircle}
              >
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.verifiedText, { color: theme.success }]}>
                Verified
              </Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <Card
          variant="elevated"
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
        >
          <InfoRow
            label="Phone"
            value={user?.phone || 'Not set'}
            theme={theme}
          />
          <InfoRow
            label="Member Since"
            value={
              user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'N/A'
            }
            theme={theme}
          />
          <InfoRow
            label="KYC Status"
            value={user?.kycStatus?.toUpperCase() || 'PENDING'}
            theme={theme}
            isLast
          />
        </Card>

        {/* App Info */}
        <Card
          variant="elevated"
          style={{ marginHorizontal: spacing.lg, marginTop: spacing.md }}
        >
          <InfoRow label="App Version" value="1.0.0" theme={theme} />
          <InfoRow
            label="Account Type"
            value="Cayden Checking"
            theme={theme}
            isLast
          />
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
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
        styles.infoRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border },
      ]}
    >
      <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}


// Bank Accounts Sub-screen
function BankAccountsScreen({
  theme,
  isDarkMode,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}) {
  const {
    linkedAccounts,
    isLoading,
    fetchLinkedAccounts,
    linkAccount,
    verifyAccount,
    setPrimary,
    unlinkAccount,
  } = useLinkedAccountStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [last4, setLast4] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const resetForm = () => {
    setBankName('');
    setAccountHolderName('');
    setLast4('');
    setRoutingNumber('');
    setAccountType('checking');
    setShowAddForm(false);
  };

  const handleAddAccount = async () => {
    if (!bankName.trim() || !accountHolderName.trim() || !last4.trim() || !routingNumber.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (last4.length !== 4 || !/^\d{4}$/.test(last4)) {
      Alert.alert('Invalid Input', 'Last 4 digits must be exactly 4 numbers.');
      return;
    }
    if (routingNumber.length !== 9 || !/^\d{9}$/.test(routingNumber)) {
      Alert.alert('Invalid Input', 'Routing number must be exactly 9 digits.');
      return;
    }
    setSubmitting(true);
    try {
      await linkAccount({
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumberLast4: last4.trim(),
        routingNumber: routingNumber.trim(),
        accountType,
      });
      resetForm();
      Alert.alert('Success', 'Bank account linked successfully!');
    } catch {
      Alert.alert('Error', 'Failed to link bank account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = (accountId: string) => {
    Alert.alert('Verify Account', 'Start micro-deposit verification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Verify',
        onPress: async () => {
          try {
            await verifyAccount(accountId);
            Alert.alert('Success', 'Account verification initiated!');
          } catch {
            Alert.alert('Error', 'Verification failed. Please try again.');
          }
        },
      },
    ]);
  };

  const handleSetPrimary = (accountId: string) => {
    Alert.alert('Set Primary', 'Make this your primary bank account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Set Primary',
        onPress: async () => {
          try {
            await setPrimary(accountId);
            Alert.alert('Success', 'Primary account updated!');
          } catch {
            Alert.alert('Error', 'Failed to update primary account.');
          }
        },
      },
    ]);
  };

  const handleRemove = (accountId: string) => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to unlink this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await unlinkAccount(accountId);
              Alert.alert('Success', 'Bank account removed.');
            } catch {
              Alert.alert('Error', 'Failed to remove account.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return { bg: isDarkMode ? '#064E3B' : '#D1FAE5', text: '#10B981' };
      case 'pending':
        return { bg: isDarkMode ? '#78350F' : '#FEF3C7', text: '#F59E0B' };
      case 'failed':
        return { bg: isDarkMode ? '#7F1D1D' : '#FEE2E2', text: '#EF4444' };
      default:
        return { bg: theme.surfaceSecondary, text: theme.textSecondary };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>
          Bank Accounts
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Add Account Button */}
        {!showAddForm && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowAddForm(true)}
            >
              <LinearGradient
                colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.md,
                  borderRadius: borderRadius.full,
                  gap: spacing.sm,
                }}
              >
                <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                  Add Bank Account
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Inline Add Form */}
        {showAddForm && (
          <Card
            variant="elevated"
            style={{
              marginHorizontal: spacing.lg,
              marginBottom: spacing.md,
              borderRadius: borderRadius.xl,
              borderLeftWidth: 4,
              borderLeftColor: theme.primary,
            }}
          >
            <Text style={[styles.hustleTitle, { color: theme.text, marginBottom: spacing.md }]}>
              Link New Account
            </Text>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>
                Bank Name
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  fontSize: 16,
                }}
                placeholder="e.g. Chase, Wells Fargo"
                placeholderTextColor={theme.textTertiary}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>
                Account Holder Name
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  fontSize: 16,
                }}
                placeholder="Full name on account"
                placeholderTextColor={theme.textTertiary}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
              />
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>
                Last 4 Digits
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  fontSize: 16,
                }}
                placeholder="1234"
                placeholderTextColor={theme.textTertiary}
                value={last4}
                onChangeText={setLast4}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>
                Routing Number
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.text,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.lg,
                  fontSize: 16,
                }}
                placeholder="9 digit routing number"
                placeholderTextColor={theme.textTertiary}
                value={routingNumber}
                onChangeText={setRoutingNumber}
                keyboardType="number-pad"
                maxLength={9}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>
                Account Type
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.lg,
                    borderWidth: 2,
                    borderColor: accountType === 'checking' ? theme.primary : theme.border,
                    backgroundColor: accountType === 'checking'
                      ? (isDarkMode ? `${theme.primary}22` : '#EEF2FF')
                      : theme.surfaceSecondary,
                    alignItems: 'center',
                  }}
                  onPress={() => setAccountType('checking')}
                >
                  <Text
                    style={{
                      color: accountType === 'checking' ? theme.primary : theme.textSecondary,
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    Checking
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.lg,
                    borderWidth: 2,
                    borderColor: accountType === 'savings' ? theme.primary : theme.border,
                    backgroundColor: accountType === 'savings'
                      ? (isDarkMode ? `${theme.primary}22` : '#EEF2FF')
                      : theme.surfaceSecondary,
                    alignItems: 'center',
                  }}
                  onPress={() => setAccountType('savings')}
                >
                  <Text
                    style={{
                      color: accountType === 'savings' ? theme.primary : theme.textSecondary,
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    Savings
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  borderWidth: 2,
                  borderColor: theme.border,
                  alignItems: 'center',
                }}
                onPress={resetForm}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 15 }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={handleAddAccount}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    paddingVertical: spacing.sm,
                    borderRadius: borderRadius.full,
                    alignItems: 'center',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    {submitting ? 'Linking...' : 'Link Account'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Account List */}
        {isLoading && linkedAccounts.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="hourglass-outline" size={48} color={theme.textTertiary} />
            <Text style={[styles.chatEmptyTitle, { color: theme.text, marginTop: spacing.md }]}>
              Loading accounts...
            </Text>
          </View>
        )}

        {!isLoading && linkedAccounts.length === 0 && !showAddForm && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="wallet-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.chatEmptyTitle, { color: theme.text, marginTop: spacing.md }]}>
              No Linked Accounts
            </Text>
            <Text
              style={[
                styles.chatEmptySubtitle,
                { color: theme.textSecondary, marginTop: spacing.xs },
              ]}
            >
              Link a bank account to enable transfers, ExtraCash advances, and more.
            </Text>
          </View>
        )}

        {linkedAccounts.map((account: LinkedAccount) => {
          const statusColors = getStatusColor(account.verificationStatus);
          return (
            <Card
              key={account.id}
              variant="elevated"
              style={{
                marginHorizontal: spacing.lg,
                marginBottom: spacing.sm,
                borderRadius: borderRadius.xl,
                borderLeftWidth: 4,
                borderLeftColor: account.isPrimary ? theme.primary : theme.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons name="business-outline" size={20} color={theme.primary} />
                    <Text style={[styles.hustleTitle, { color: theme.text }]}>
                      {account.bankName}
                    </Text>
                  </View>
                  <Text style={[styles.hustleCompany, { color: theme.textSecondary, marginTop: 4 }]}>
                    {account.accountHolderName}
                  </Text>
                </View>
                {account.isPrimary && (
                  <LinearGradient
                    colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                      PRIMARY
                    </Text>
                  </LinearGradient>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="card-outline" size={14} color={theme.textTertiary} />
                  <Text style={[styles.hustleMetaText, { color: theme.textTertiary }]}>
                    {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} ****{account.accountNumberLast4}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: borderRadius.sm,
                    backgroundColor: statusColors.bg,
                  }}
                >
                  <Text style={{ color: statusColors.text, fontSize: 11, fontWeight: '700' }}>
                    {account.verificationStatus.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm }}>
                {account.verificationStatus === 'pending' && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.full,
                      backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5',
                      gap: 4,
                    }}
                    onPress={() => handleVerify(account.id)}
                  >
                    <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
                    <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 13 }}>
                      Verify
                    </Text>
                  </TouchableOpacity>
                )}
                {account.verificationStatus === 'verified' && !account.isPrimary && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.full,
                      backgroundColor: isDarkMode ? `${theme.primary}22` : '#EEF2FF',
                      gap: 4,
                    }}
                    onPress={() => handleSetPrimary(account.id)}
                  >
                    <Ionicons name="star-outline" size={16} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>
                      Set Primary
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.xs,
                    borderRadius: borderRadius.full,
                    backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2',
                    gap: 4,
                  }}
                  onPress={() => handleRemove(account.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        })}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Security Settings Sub-screen
function SecuritySettingsScreen({
  theme,
  isDarkMode,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}) {
  const { hasPin, checkPinStatus, removePin } = usePinStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [showPinSetup, setShowPinSetup] = useState(false);
  const [removePinPassword, setRemovePinPassword] = useState('');
  const [removingPin, setRemovingPin] = useState(false);
  const [showRemovePinInput, setShowRemovePinInput] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Mismatch', 'New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to change password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRemovePin = async () => {
    if (!removePinPassword.trim()) {
      Alert.alert('Required', 'Please enter your password to remove PIN.');
      return;
    }
    setRemovingPin(true);
    try {
      await removePin(removePinPassword);
      Alert.alert('Success', 'Your PIN has been removed.');
      setRemovePinPassword('');
      setShowRemovePinInput(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Failed to remove PIN. Please check your password.';
      Alert.alert('Error', message);
    } finally {
      setRemovingPin(false);
    }
  };

  if (showPinSetup) {
    return (
      <PinSetupScreen
        onComplete={() => {
          setShowPinSetup(false);
          checkPinStatus();
        }}
        onCancel={() => setShowPinSetup(false)}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>
          Security Settings
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Change Password Section */}
        <Card
          variant="elevated"
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            borderRadius: borderRadius.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDarkMode ? '#8B5CF622' : '#F3E8FF',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="key-outline" size={20} color="#8B5CF6" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>
              Change Password
            </Text>
          </View>

          <Input
            label="Current Password"
            placeholder="Enter current password"
            isPassword
            leftIcon="lock-closed-outline"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <Input
            label="New Password"
            placeholder="Enter new password"
            isPassword
            leftIcon="lock-open-outline"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Input
            label="Confirm New Password"
            placeholder="Re-enter new password"
            isPassword
            leftIcon="checkmark-circle-outline"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
          />

          <Button
            title={changingPassword ? 'Updating...' : 'Update Password'}
            onPress={handleChangePassword}
            loading={changingPassword}
            disabled={changingPassword}
          />
        </Card>

        {/* PIN Management Section */}
        <Card
          variant="elevated"
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            borderRadius: borderRadius.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDarkMode ? '#3B82F622' : '#DBEAFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="keypad-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>
              PIN Management
            </Text>
          </View>

          {/* PIN Status */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.md,
              backgroundColor: isDarkMode
                ? (hasPin ? '#064E3B' : '#7F1D1D')
                : (hasPin ? '#D1FAE5' : '#FEE2E2'),
              borderRadius: borderRadius.lg,
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons
                name={hasPin ? 'shield-checkmark' : 'shield-outline'}
                size={20}
                color={hasPin ? '#10B981' : '#EF4444'}
              />
              <Text
                style={{
                  color: hasPin ? '#10B981' : '#EF4444',
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                PIN {hasPin ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>

          <Button
            title={hasPin ? 'Change PIN' : 'Set PIN'}
            onPress={() => setShowPinSetup(true)}
            variant="outline"
            style={{ marginBottom: spacing.sm }}
          />

          {hasPin && !showRemovePinInput && (
            <Button
              title="Remove PIN"
              onPress={() => setShowRemovePinInput(true)}
              variant="ghost"
              textStyle={{ color: theme.error }}
            />
          )}

          {hasPin && showRemovePinInput && (
            <View style={{ marginTop: spacing.sm }}>
              <Input
                label="Enter Password to Remove PIN"
                placeholder="Your account password"
                isPassword
                leftIcon="lock-closed-outline"
                value={removePinPassword}
                onChangeText={setRemovePinPassword}
              />
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowRemovePinInput(false);
                      setRemovePinPassword('');
                    }}
                    variant="secondary"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    title={removingPin ? 'Removing...' : 'Confirm Remove'}
                    onPress={handleRemovePin}
                    loading={removingPin}
                    disabled={removingPin}
                    variant="outline"
                    textStyle={{ color: theme.error }}
                    style={{ borderColor: theme.error }}
                  />
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Session Info Section */}
        <Card
          variant="elevated"
          style={{
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            borderRadius: borderRadius.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDarkMode ? '#10B98122' : '#D1FAE5',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="time-outline" size={20} color="#10B981" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>
              Session Info
            </Text>
          </View>

          <InfoRow
            label="Auto-logout"
            value="5 minutes of inactivity"
            theme={theme}
          />
          <InfoRow
            label="PIN Lock"
            value={hasPin ? 'Enabled' : 'Disabled'}
            theme={theme}
            isLast
          />
        </Card>

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
    gap: spacing.sm,
  },
  title: {
    ...typography.h1,
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
  menuList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    ...typography.bodyBold,
  },
  menuSubtitle: {
    ...typography.small,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  toggleLabel: {
    ...typography.bodyBold,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    gap: spacing.sm,
  },
  logoutText: {
    ...typography.bodyBold,
  },
  // Side Hustle styles
  filterScroll: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    maxHeight: 44,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  hustleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hustleTitle: {
    ...typography.bodyBold,
  },
  hustleCompany: {
    ...typography.caption,
    marginTop: 2,
  },
  payBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  payText: {
    ...typography.captionBold,
  },
  hustleDescription: {
    ...typography.caption,
    marginTop: spacing.sm,
  },
  hustleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  hustleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hustleMetaText: {
    ...typography.small,
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.small,
    fontWeight: '600',
  },
  // Chat styles
  chatMessages: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  chatEmpty: {
    alignItems: 'center',
    paddingTop: 100,
  },
  chatEmptyTitle: {
    ...typography.h3,
    marginTop: spacing.md,
  },
  chatEmptySubtitle: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  chatText: {
    ...typography.caption,
    lineHeight: 20,
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  chatInput: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Profile styles
  profileHeaderWrapper: {
    position: 'relative',
  },
  profileGradientBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  profileAvatarWrapper: {
    borderRadius: 52,
    padding: 4,
    backgroundColor: '#FFFFFF',
    marginBottom: spacing.md,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  profileName: {
    ...typography.h2,
  },
  profileEmail: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  verifiedBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: 6,
  },
  verifiedIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    ...typography.captionBold,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoLabel: {
    ...typography.caption,
  },
  infoValue: {
    ...typography.captionBold,
  },
});
