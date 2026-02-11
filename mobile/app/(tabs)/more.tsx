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
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useAccountStore } from '../../src/stores/accountStore';
import { useLinkedAccountStore } from '../../src/stores/linkedAccountStore';
import { usePinStore } from '../../src/stores/pinStore';
import { useNotificationStore } from '../../src/stores/notificationStore';
import { useBillStore } from '../../src/stores/billStore';
import { Card } from '../../src/components/common/Card';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { PinSetupScreen } from '../../src/components/security/PinSetupScreen';
import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius, shadows } from '../../src/theme/spacing';
import api from '../../src/services/api';
import { SideHustle, ChatMessage, LinkedAccount, Notification, Bill } from '../../src/types';

type Tab = 'menu' | 'sidehustles' | 'chat' | 'profile' | 'bankaccounts' | 'security' | 'virtualcard' | 'notifications' | 'helpsupport' | 'billpay';

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
  'Bill Pay': { bg: '#FFF7ED', icon: '#F97316' },
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
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const validTabs: Tab[] = ['menu', 'sidehustles', 'chat', 'profile', 'bankaccounts', 'security', 'virtualcard', 'notifications', 'helpsupport', 'billpay'];
    if (params.tab && validTabs.includes(params.tab as Tab)) {
      return params.tab as Tab;
    }
    return 'menu';
  });

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

  if (activeTab === 'virtualcard') {
    return (
      <VirtualCardScreen
        theme={theme}
        isDarkMode={isDarkMode}
        user={user}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  if (activeTab === 'notifications') {
    return (
      <NotificationsScreen
        theme={theme}
        isDarkMode={isDarkMode}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  if (activeTab === 'helpsupport') {
    return (
      <HelpSupportScreen
        theme={theme}
        isDarkMode={isDarkMode}
        onBack={() => setActiveTab('menu')}
      />
    );
  }

  if (activeTab === 'billpay') {
    return (
      <BillPayScreen
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
            icon="receipt-outline"
            label="Bill Pay"
            subtitle="Manage and pay your bills"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() => setActiveTab('billpay')}
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
            onPress={() => setActiveTab('virtualcard')}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            subtitle="Manage your alerts"
            theme={theme}
            isDarkMode={isDarkMode}
            onPress={() => setActiveTab('notifications')}
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
            onPress={() => setActiveTab('helpsupport')}
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
  const [suggestions, setSuggestions] = useState<string[]>([
    'Check my balance',
    'Show spending',
    'ExtraCash info',
    'What can you do?',
  ]);
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

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setSuggestions([]);

    try {
      const res = await api.post('/chat', { message: userMsg.content });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.data.content,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.data.data.suggestions) {
        setSuggestions(res.data.data.suggestions);
      }
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
            <LinearGradient
              colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}
            >
              <Ionicons name="chatbubble-ellipses" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.chatEmptyTitle, { color: theme.text }]}>
              Welcome to Cayden AI
            </Text>
            <Text
              style={[
                styles.chatEmptySubtitle,
                { color: theme.textSecondary },
              ]}
            >
              Your personal financial assistant. Ask me about your balance, spending, ExtraCash, goals, bills, or anything else!
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
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>Cayden AI</Text>
                </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, opacity: 0.6 }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, opacity: 0.4 }} />
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary, opacity: 0.2 }} />
            </View>
          </View>
        )}

        {/* Suggestion Chips */}
        {!sending && suggestions.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm, paddingHorizontal: spacing.xs }}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => sendMessage(suggestion)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  borderWidth: 1.5,
                  borderColor: theme.primary,
                  backgroundColor: isDarkMode ? `${theme.primary}15` : `${theme.primary}08`,
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 13 }}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
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
            placeholder="Ask Cayden AI anything..."
            placeholderTextColor={theme.textTertiary}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
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

// Virtual Card Screen
function VirtualCardScreen({
  theme,
  isDarkMode,
  user,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  user: any;
  onBack: () => void;
}) {
  const { accounts, fetchAccounts } = useAccountStore();
  const [cardFrozen, setCardFrozen] = useState(false);
  const [showNumber, setShowNumber] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const checking = accounts.find((a) => a.accountType === 'checking');

  // Generate a deterministic card number from accountNumber for display
  const cardNumber = checking?.accountNumber
    ? `4826 ${checking.accountNumber.slice(0, 4)} ${checking.accountNumber.slice(4, 8)} ${checking.accountNumber.slice(-4)}`
    : '4826 **** **** ****';
  const maskedNumber = '4826 **** **** ' + (checking?.accountNumber?.slice(-4) || '****');
  const expiryDate = '12/28';
  const cvv = '***';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>Virtual Card</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Card Visual */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <LinearGradient
            colors={cardFrozen ? ['#6B7280', '#9CA3AF'] : [theme.primaryGradientStart, theme.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: borderRadius.xxl,
              padding: spacing.xl,
              minHeight: 210,
              justifyContent: 'space-between',
              ...shadows.lg,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', letterSpacing: 1 }}>
                CAYDEN
              </Text>
              {cardFrozen && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Ionicons name="snow-outline" size={14} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>FROZEN</Text>
                </View>
              )}
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="wifi" size={24} color="rgba(255,255,255,0.6)" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '600', letterSpacing: 3, marginTop: spacing.sm }}>
                {showNumber ? cardNumber : maskedNumber}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>CARD HOLDER</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                  {user?.firstName?.toUpperCase()} {user?.lastName?.toUpperCase()}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>EXPIRES</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 }}>{expiryDate}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>CVV</Text>
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginTop: 2 }}>{cvv}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Card Actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.lg }}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => setShowNumber(!showNumber)}
          >
            <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? '#3B82F622' : '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                <Ionicons name={showNumber ? 'eye-off-outline' : 'eye-outline'} size={22} color="#3B82F6" />
              </View>
              <Text style={[styles.hustleMetaText, { color: theme.text, fontWeight: '600' }]}>
                {showNumber ? 'Hide' : 'Show'}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => {
              setCardFrozen(!cardFrozen);
              Alert.alert(cardFrozen ? 'Card Unfrozen' : 'Card Frozen', cardFrozen ? 'Your card is now active.' : 'Your card has been temporarily frozen.');
            }}
          >
            <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? '#8B5CF622' : '#F3E8FF', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                <Ionicons name={cardFrozen ? 'flame-outline' : 'snow-outline'} size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.hustleMetaText, { color: theme.text, fontWeight: '600' }]}>
                {cardFrozen ? 'Unfreeze' : 'Freeze'}
              </Text>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Copied!', 'Card number copied to clipboard.')}
          >
            <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? '#10B98122' : '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                <Ionicons name="copy-outline" size={22} color="#10B981" />
              </View>
              <Text style={[styles.hustleMetaText, { color: theme.text, fontWeight: '600' }]}>Copy</Text>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Card Details */}
        <Card variant="elevated" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#EAB30822' : '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="information-circle-outline" size={20} color="#EAB308" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>Card Details</Text>
          </View>
          <InfoRow label="Card Type" value="Visa Debit" theme={theme} />
          <InfoRow label="Status" value={cardFrozen ? 'Frozen' : 'Active'} theme={theme} />
          <InfoRow label="Daily Limit" value="$5,000.00" theme={theme} />
          <InfoRow label="ATM Limit" value="$500.00" theme={theme} />
          <InfoRow label="Network" value="Visa" theme={theme} isLast />
        </Card>

        {/* Spending Controls */}
        <Card variant="elevated" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#EC489922' : '#FCE7F3', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="settings-outline" size={20} color="#EC4899" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>Spending Controls</Text>
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Online Purchases</Text>
            <Switch value={!cardFrozen} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" disabled />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>International Transactions</Text>
            <Switch value={false} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" disabled />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>ATM Withdrawals</Text>
            <Switch value={!cardFrozen} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" disabled />
          </View>
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Notifications Screen
function NotificationsScreen({
  theme,
  isDarkMode,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}) {
  const { notifications, unreadCount, isLoading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [advanceReminders, setAdvanceReminders] = useState(true);
  const [goalMilestones, setGoalMilestones] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotifIcon = (type: string): { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string } => {
    switch (type) {
      case 'transaction':
        return { icon: 'arrow-down-circle', color: '#10B981', bg: isDarkMode ? '#064E3B' : '#D1FAE5' };
      case 'advance':
        return { icon: 'flash', color: '#F59E0B', bg: isDarkMode ? '#78350F' : '#FEF3C7' };
      case 'security':
        return { icon: 'shield-checkmark', color: '#8B5CF6', bg: isDarkMode ? '#8B5CF622' : '#F3E8FF' };
      case 'goal':
        return { icon: 'flag', color: '#3B82F6', bg: isDarkMode ? '#3B82F622' : '#DBEAFE' };
      case 'bill':
        return { icon: 'receipt', color: '#F97316', bg: isDarkMode ? '#F9731622' : '#FFF7ED' };
      default:
        return { icon: 'notifications', color: '#EC4899', bg: isDarkMode ? '#EC489922' : '#FCE7F3' };
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>Read All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ backgroundColor: theme.primary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full }}>
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>{unreadCount} NEW</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notifications List */}
        {notifications.length === 0 && !isLoading && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="notifications-off-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.chatEmptyTitle, { color: theme.text, marginTop: spacing.md }]}>No Notifications</Text>
            <Text style={[styles.chatEmptySubtitle, { color: theme.textSecondary }]}>
              You're all caught up! Notifications will appear here.
            </Text>
          </View>
        )}

        {notifications.map((notif: Notification) => {
          const { icon, color, bg } = getNotifIcon(notif.type);
          return (
            <TouchableOpacity
              key={notif.id}
              activeOpacity={0.8}
              onPress={() => { if (!notif.read) markAsRead(notif.id); }}
            >
              <Card
                variant="elevated"
                style={{
                  marginHorizontal: spacing.lg,
                  marginBottom: spacing.sm,
                  borderRadius: borderRadius.xl,
                  borderLeftWidth: notif.read ? 0 : 3,
                  borderLeftColor: theme.primary,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={icon} size={22} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.hustleTitle, { color: theme.text, flex: 1 }]}>{notif.title}</Text>
                      {!notif.read && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />
                      )}
                    </View>
                    <Text style={[styles.hustleDescription, { color: theme.textSecondary, marginTop: 2 }]}>{notif.message}</Text>
                    <Text style={[styles.hustleMetaText, { color: theme.textTertiary, marginTop: 4 }]}>{getTimeAgo(notif.createdAt)}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}

        {/* Notification Preferences */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          <Text style={[styles.hustleTitle, { color: theme.text, marginBottom: spacing.sm }]}>Preferences</Text>
        </View>

        <Card variant="elevated" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#3B82F622' : '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="phone-portrait-outline" size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>Push Notifications</Text>
          </View>

          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Push Notifications</Text>
            <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Transaction Alerts</Text>
            <Switch value={transactionAlerts} onValueChange={setTransactionAlerts} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Advance Reminders</Text>
            <Switch value={advanceReminders} onValueChange={setAdvanceReminders} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Goal Milestones</Text>
            <Switch value={goalMilestones} onValueChange={setGoalMilestones} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Security Alerts</Text>
            <Switch value={securityAlerts} onValueChange={setSecurityAlerts} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
        </Card>

        <Card variant="elevated" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.xl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#EC489922' : '#FCE7F3', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="mail-outline" size={20} color="#EC4899" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>Email Notifications</Text>
          </View>

          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email Notifications</Text>
            <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Weekly Digest</Text>
            <Switch value={weeklyDigest} onValueChange={setWeeklyDigest} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={[styles.toggleRow, { paddingVertical: spacing.sm }]}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Marketing Emails</Text>
            <Switch value={marketingEmails} onValueChange={setMarketingEmails} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
          </View>
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Help & Support Screen
function HelpSupportScreen({
  theme,
  isDarkMode,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}) {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      question: 'How do I get an ExtraCash advance?',
      answer: 'To get an ExtraCash advance, first link and verify a bank account. Then go to the ExtraCash tab, where you\'ll see your eligibility score. If eligible, select your amount and delivery speed, then tap "Get ExtraCash". Standard delivery is free, while Express has a 5% fee.',
    },
    {
      id: '2',
      question: 'How do I link a bank account?',
      answer: 'Go to More > Bank Accounts and tap "Add Bank Account". Enter your bank name, account holder name, last 4 digits of your account number, and routing number. After linking, you\'ll need to verify the account through micro-deposits.',
    },
    {
      id: '3',
      question: 'What is the eligibility score?',
      answer: 'Your eligibility score (0-100) determines how much ExtraCash you can access. It\'s based on 5 factors: income consistency, average balance, spending patterns, account age, and repayment history. A higher score means more ExtraCash availability.',
    },
    {
      id: '4',
      question: 'How do I set up a PIN?',
      answer: 'Go to More > Security and tap "Set PIN". Choose a 4-digit PIN that you\'ll remember. Your PIN is required for ExtraCash advances over $100 and adds an extra layer of security when you reopen the app.',
    },
    {
      id: '5',
      question: 'How do transfers work?',
      answer: 'You can transfer money between your Cayden checking and savings accounts instantly. From the Home screen, tap "Transfer", select the source and destination accounts, enter the amount, and confirm. Transfers are processed immediately.',
    },
    {
      id: '6',
      question: 'What are Savings Goals?',
      answer: 'Savings Goals help you save for specific targets. Go to the Goals tab to create a goal with a name and target amount. You can add funds anytime and track your progress with visual progress bars.',
    },
    {
      id: '7',
      question: 'How do I freeze my virtual card?',
      answer: 'Go to More > Virtual Card and tap the "Freeze" button. This temporarily disables all card transactions. You can unfreeze it anytime by tapping "Unfreeze".',
    },
  ];

  const contactOptions = [
    {
      icon: 'mail-outline' as const,
      label: 'Email Support',
      value: 'support@caydenbank.com',
      color: '#3B82F6',
      bg: isDarkMode ? '#3B82F622' : '#DBEAFE',
      onPress: () => Linking.openURL('mailto:support@caydenbank.com'),
    },
    {
      icon: 'call-outline' as const,
      label: 'Phone Support',
      value: '1-800-CAYDEN',
      color: '#10B981',
      bg: isDarkMode ? '#064E3B' : '#D1FAE5',
      onPress: () => Linking.openURL('tel:18002293367'),
    },
    {
      icon: 'chatbubble-outline' as const,
      label: 'Live Chat',
      value: 'Available 24/7',
      color: '#8B5CF6',
      bg: isDarkMode ? '#8B5CF622' : '#F3E8FF',
      onPress: () => Alert.alert('Live Chat', 'Connecting to a support agent...'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>Help & Support</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Contact Options */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <Text style={[styles.hustleTitle, { color: theme.text, marginBottom: spacing.md }]}>Contact Us</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {contactOptions.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={{ flex: 1 }}
                activeOpacity={0.8}
                onPress={opt.onPress}
              >
                <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.xl }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: opt.bg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs }}>
                    <Ionicons name={opt.icon} size={24} color={opt.color} />
                  </View>
                  <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13, textAlign: 'center' }}>{opt.label}</Text>
                  <Text style={{ color: theme.textTertiary, fontSize: 11, marginTop: 2, textAlign: 'center' }}>{opt.value}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDarkMode ? '#F59E0B22' : '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="help-circle-outline" size={20} color="#F59E0B" />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>Frequently Asked Questions</Text>
          </View>
        </View>

        {faqs.map((faq) => (
          <TouchableOpacity
            key={faq.id}
            activeOpacity={0.8}
            onPress={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
          >
            <Card
              variant="elevated"
              style={{
                marginHorizontal: spacing.lg,
                marginBottom: spacing.sm,
                borderRadius: borderRadius.xl,
                borderLeftWidth: expandedFaq === faq.id ? 4 : 0,
                borderLeftColor: theme.primary,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.hustleTitle, { color: theme.text, flex: 1, marginRight: spacing.sm }]}>
                  {faq.question}
                </Text>
                <Ionicons
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textTertiary}
                />
              </View>
              {expandedFaq === faq.id && (
                <Text style={[styles.hustleDescription, { color: theme.textSecondary, marginTop: spacing.sm, lineHeight: 20 }]}>
                  {faq.answer}
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        ))}

        {/* App Info */}
        <Card variant="elevated" style={{ marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.xl }}>
          <View style={{ alignItems: 'center', paddingVertical: spacing.md }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: isDarkMode ? `${theme.primary}22` : '#D1FAE5', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm }}>
              <Ionicons name="information-circle-outline" size={30} color={theme.primary} />
            </View>
            <Text style={[styles.hustleTitle, { color: theme.text }]}>Cayden Bank</Text>
            <Text style={[styles.hustleMetaText, { color: theme.textSecondary, marginTop: 4 }]}>Version 1.0.0</Text>
            <Text style={[styles.hustleMetaText, { color: theme.textTertiary, marginTop: 2 }]}>Your money, your way</Text>
          </View>
        </Card>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Bill Pay Screen
function BillPayScreen({
  theme,
  isDarkMode,
  onBack,
}: {
  theme: any;
  isDarkMode: boolean;
  onBack: () => void;
}) {
  const { bills, isLoading, fetchBills, createBill, payBill, deleteBill } = useBillStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [billName, setBillName] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billCategory, setBillCategory] = useState<string>('subscription');
  const [billDueDay, setBillDueDay] = useState('');
  const [billAutoPay, setBillAutoPay] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBills();
    fetchAccounts();
  }, []);

  const checking = accounts.find((a) => a.accountType === 'checking');

  const BILL_CATEGORIES = [
    { key: 'subscription', label: 'Subscription', icon: 'tv-outline' as const, color: '#8B5CF6' },
    { key: 'utility', label: 'Utility', icon: 'flash-outline' as const, color: '#F59E0B' },
    { key: 'rent', label: 'Rent', icon: 'home-outline' as const, color: '#3B82F6' },
    { key: 'insurance', label: 'Insurance', icon: 'shield-outline' as const, color: '#10B981' },
    { key: 'loan', label: 'Loan', icon: 'cash-outline' as const, color: '#EF4444' },
    { key: 'other', label: 'Other', icon: 'receipt-outline' as const, color: '#6B7280' },
  ];

  const getCatInfo = (cat: string) => BILL_CATEGORIES.find((c) => c.key === cat) || BILL_CATEGORIES[5];

  const resetForm = () => {
    setBillName('');
    setBillAmount('');
    setBillCategory('subscription');
    setBillDueDay('');
    setBillAutoPay(false);
    setShowAddForm(false);
  };

  const handleAddBill = async () => {
    if (!billName.trim() || !billAmount.trim() || !billDueDay.trim()) {
      Alert.alert('Missing Fields', 'Please fill in bill name, amount, and due day.');
      return;
    }
    const amount = parseFloat(billAmount);
    const dueDay = parseInt(billDueDay, 10);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      Alert.alert('Invalid Due Day', 'Due day must be between 1 and 31.');
      return;
    }
    if (!checking) {
      Alert.alert('No Account', 'Please set up a checking account first.');
      return;
    }
    setSubmitting(true);
    try {
      await createBill({
        accountId: checking.id,
        name: billName.trim(),
        category: billCategory,
        amount,
        frequency: 'monthly',
        dueDay,
        autoPay: billAutoPay,
      });
      resetForm();
      Alert.alert('Success', 'Bill added successfully!');
    } catch {
      Alert.alert('Error', 'Failed to add bill.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayBill = (bill: Bill) => {
    Alert.alert(
      'Pay Bill',
      `Pay $${bill.amount.toFixed(2)} for ${bill.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay Now',
          onPress: async () => {
            try {
              await payBill(bill.id);
              Alert.alert('Success', `${bill.name} payment of $${bill.amount.toFixed(2)} processed!`);
              fetchBills();
              fetchAccounts();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Payment failed.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteBill = (bill: Bill) => {
    Alert.alert('Delete Bill', `Remove ${bill.name} from your bills?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(bill.id);
          } catch {
            Alert.alert('Error', 'Failed to delete bill.');
          }
        },
      },
    ]);
  };

  const activeBills = bills.filter((b) => b.status === 'active');
  const totalMonthly = activeBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: theme.text }]}>Bill Pay</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        {activeBills.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <LinearGradient
              colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: borderRadius.xxl, padding: spacing.xl, ...shadows.lg }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', letterSpacing: 0.5 }}>MONTHLY BILLS</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: spacing.xs }}>
                ${totalMonthly.toFixed(2)}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.xl }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Active Bills</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{activeBills.length}</Text>
                </View>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Auto-Pay</Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>{activeBills.filter((b) => b.autoPay).length}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Add Bill Button */}
        {!showAddForm && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowAddForm(true)}>
              <LinearGradient
                colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: borderRadius.full, gap: spacing.sm }}
              >
                <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>Add Bill</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Add Bill Form */}
        {showAddForm && (
          <Card variant="elevated" style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.xl, borderLeftWidth: 4, borderLeftColor: theme.primary }}>
            <Text style={[styles.hustleTitle, { color: theme.text, marginBottom: spacing.md }]}>New Bill</Text>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>Bill Name</Text>
              <TextInput
                style={{ backgroundColor: theme.surfaceSecondary, color: theme.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, fontSize: 16 }}
                placeholder="e.g. Netflix, Electric"
                placeholderTextColor={theme.textTertiary}
                value={billName}
                onChangeText={setBillName}
              />
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>Amount</Text>
              <TextInput
                style={{ backgroundColor: theme.surfaceSecondary, color: theme.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, fontSize: 16 }}
                placeholder="$0.00"
                placeholderTextColor={theme.textTertiary}
                value={billAmount}
                onChangeText={setBillAmount}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                  {BILL_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.key}
                      onPress={() => setBillCategory(cat.key)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.full,
                        borderWidth: 2,
                        borderColor: billCategory === cat.key ? cat.color : theme.border,
                        backgroundColor: billCategory === cat.key ? `${cat.color}15` : theme.surfaceSecondary,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons name={cat.icon} size={14} color={billCategory === cat.key ? cat.color : theme.textSecondary} />
                      <Text style={{ color: billCategory === cat.key ? cat.color : theme.textSecondary, fontWeight: '600', fontSize: 12 }}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={{ marginBottom: spacing.sm }}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary, marginBottom: 4 }]}>Due Day (1-31)</Text>
              <TextInput
                style={{ backgroundColor: theme.surfaceSecondary, color: theme.text, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, fontSize: 16 }}
                placeholder="15"
                placeholderTextColor={theme.textTertiary}
                value={billDueDay}
                onChangeText={setBillDueDay}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <View style={[styles.toggleRow, { marginBottom: spacing.md }]}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Auto-Pay</Text>
              <Switch value={billAutoPay} onValueChange={setBillAutoPay} trackColor={{ false: theme.border, true: theme.primary }} thumbColor="#FFFFFF" />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 2, borderColor: theme.border, alignItems: 'center' }} onPress={resetForm}>
                <Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 15 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1 }} onPress={handleAddBill} disabled={submitting} activeOpacity={0.8}>
                <LinearGradient
                  colors={[theme.primaryGradientStart, theme.primaryGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ paddingVertical: spacing.sm, borderRadius: borderRadius.full, alignItems: 'center', opacity: submitting ? 0.6 : 1 }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                    {submitting ? 'Adding...' : 'Add Bill'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && activeBills.length === 0 && !showAddForm && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="receipt-outline" size={64} color={theme.textTertiary} />
            <Text style={[styles.chatEmptyTitle, { color: theme.text, marginTop: spacing.md }]}>No Bills Yet</Text>
            <Text style={[styles.chatEmptySubtitle, { color: theme.textSecondary }]}>
              Add your bills to track payments and never miss a due date.
            </Text>
          </View>
        )}

        {/* Bills List */}
        {activeBills.map((bill) => {
          const catInfo = getCatInfo(bill.category);
          const daysUntilDue = bill.nextDueDate
            ? Math.ceil((new Date(bill.nextDueDate).getTime() - Date.now()) / 86400000)
            : null;
          const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
          const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

          return (
            <Card
              key={bill.id}
              variant="elevated"
              style={{
                marginHorizontal: spacing.lg,
                marginBottom: spacing.sm,
                borderRadius: borderRadius.xl,
                borderLeftWidth: 4,
                borderLeftColor: isOverdue ? '#EF4444' : isDueSoon ? '#F59E0B' : catInfo.color,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isDarkMode ? `${catInfo.color}22` : `${catInfo.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={catInfo.icon} size={22} color={catInfo.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.hustleTitle, { color: theme.text }]}>{bill.name}</Text>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>${bill.amount.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: spacing.sm }}>
                    <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 1, borderRadius: borderRadius.sm, backgroundColor: isDarkMode ? `${catInfo.color}22` : `${catInfo.color}15` }}>
                      <Text style={{ color: catInfo.color, fontSize: 11, fontWeight: '600' }}>
                        {catInfo.label.toUpperCase()}
                      </Text>
                    </View>
                    {bill.autoPay && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <Ionicons name="refresh-circle" size={14} color={theme.primary} />
                        <Text style={{ color: theme.primary, fontSize: 11, fontWeight: '600' }}>AUTO</Text>
                      </View>
                    )}
                  </View>
                  {bill.nextDueDate && (
                    <Text style={[styles.hustleMetaText, {
                      color: isOverdue ? '#EF4444' : isDueSoon ? '#F59E0B' : theme.textTertiary,
                      marginTop: 4,
                      fontWeight: isOverdue || isDueSoon ? '600' : '500',
                    }]}>
                      {isOverdue
                        ? `Overdue by ${Math.abs(daysUntilDue!)} day${Math.abs(daysUntilDue!) > 1 ? 's' : ''}`
                        : isDueSoon
                        ? daysUntilDue === 0 ? 'Due today' : `Due in ${daysUntilDue} day${daysUntilDue! > 1 ? 's' : ''}`
                        : `Due ${new Date(bill.nextDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      }
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm }}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: isDarkMode ? '#064E3B' : '#D1FAE5', gap: 4 }}
                  onPress={() => handlePayBill(bill)}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                  <Text style={{ color: '#10B981', fontWeight: '600', fontSize: 13 }}>Pay Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2', gap: 4 }}
                  onPress={() => handleDeleteBill(bill)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontWeight: '600', fontSize: 13 }}>Remove</Text>
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
