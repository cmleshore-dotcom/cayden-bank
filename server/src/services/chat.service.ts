import db from '../config/database';

interface ChatResponse {
  role: 'assistant';
  content: string;
  suggestions?: string[];
}

export async function processMessage(
  userId: string,
  message: string
): Promise<ChatResponse> {
  // Save user message
  await db('chat_messages').insert({
    user_id: userId,
    role: 'user',
    content: message,
  });

  // Generate AI response with context-aware logic
  const { content, suggestions } = await generateResponse(userId, message);

  // Save assistant response
  await db('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content,
  });

  return { role: 'assistant', content, suggestions };
}

async function generateResponse(
  userId: string,
  message: string
): Promise<{ content: string; suggestions: string[] }> {
  const lowerMessage = message.toLowerCase().trim();

  // Balance inquiry
  if (
    lowerMessage.includes('balance') ||
    lowerMessage.includes('how much') ||
    lowerMessage.includes('money') ||
    lowerMessage.includes('account')
  ) {
    const accounts = await db('accounts').where({ user_id: userId });
    const checking = accounts.find((a) => a.account_type === 'checking');
    const savings = accounts.find((a) => a.account_type === 'savings');
    const total = accounts.reduce((sum, a) => sum + parseFloat(a.balance), 0);

    let response = `Here's your account overview:\n\n`;
    if (checking) {
      response += `Checking: $${parseFloat(checking.balance).toFixed(2)}\n`;
    }
    if (savings) {
      response += `Savings: $${parseFloat(savings.balance).toFixed(2)}\n`;
    }
    response += `\nTotal: $${total.toFixed(2)}`;

    if (checking && parseFloat(checking.balance) < 200) {
      response += `\n\nHeads up - your checking balance is getting low. Consider transferring funds or checking your ExtraCash eligibility.`;
    }

    return {
      content: response,
      suggestions: ['Show my spending', 'Check ExtraCash', 'View my goals'],
    };
  }

  // ExtraCash / Advance inquiry
  if (
    lowerMessage.includes('extracash') ||
    lowerMessage.includes('advance') ||
    lowerMessage.includes('borrow') ||
    lowerMessage.includes('loan') ||
    lowerMessage.includes('cash advance')
  ) {
    const advances = await db('advances')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');

    const activeAdvance = advances.find((a) =>
      ['pending', 'approved', 'funded', 'repayment_scheduled'].includes(a.status)
    );

    if (activeAdvance) {
      let response = `You currently have an active ExtraCash advance of $${parseFloat(activeAdvance.amount).toFixed(2)} (${activeAdvance.status}).`;
      if (activeAdvance.repayment_date) {
        response += `\n\nRepayment due: ${new Date(activeAdvance.repayment_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`;
      }
      return {
        content: response,
        suggestions: ['Repay my advance', 'Check my balance', 'View bills'],
      };
    }

    const response = `ExtraCash lets you get an advance of $25-$500 with no interest!\n\nHow it works:\n- Your eligibility is based on income consistency, balance history, and spending patterns\n- Standard delivery is free (1-3 days)\n- Express delivery has a 5% fee but is instant\n- Repayment is due in 14 days\n\nHead to the ExtraCash tab to check your eligibility and request an advance.`;

    return {
      content: response,
      suggestions: ['Check my balance', 'Show spending', 'View side hustles'],
    };
  }

  // Spending / Budget inquiry
  if (
    lowerMessage.includes('spending') ||
    lowerMessage.includes('budget') ||
    lowerMessage.includes('spend') ||
    lowerMessage.includes('expenses') ||
    lowerMessage.includes('category')
  ) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const spending = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('accounts.user_id', userId)
      .where('transactions.type', 'debit')
      .where('transactions.category', 'purchase')
      .where('transactions.created_at', '>=', startOfMonth)
      .sum('transactions.amount as total')
      .first();

    const categoryBreakdown = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('accounts.user_id', userId)
      .where('transactions.type', 'debit')
      .where('transactions.category', 'purchase')
      .where('transactions.created_at', '>=', startOfMonth)
      .whereNotNull('transactions.spending_category')
      .groupBy('transactions.spending_category')
      .select(
        'transactions.spending_category as category',
        db.raw('SUM(transactions.amount) as total')
      )
      .orderBy('total', 'desc');

    const total = parseFloat(spending?.total || '0');
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const dailyAvg = dayOfMonth > 0 ? total / dayOfMonth : 0;
    const projected = dailyAvg * daysInMonth;

    let response = `This month's spending summary:\n\n`;
    response += `Total spent: $${total.toFixed(2)}\n`;
    response += `Daily average: $${dailyAvg.toFixed(2)}\n`;
    response += `Projected monthly: $${projected.toFixed(2)}\n`;

    if (categoryBreakdown.length > 0) {
      response += `\nTop categories:\n`;
      for (const cat of categoryBreakdown.slice(0, 4)) {
        const emoji = getCategoryEmoji(cat.category);
        response += `${emoji} ${cat.category}: $${parseFloat(cat.total).toFixed(2)}\n`;
      }
    }

    if (projected > 3000) {
      response += `\nYou're on pace to spend more than usual. Consider reviewing your subscriptions or setting a spending goal.`;
    }

    return {
      content: response,
      suggestions: ['View my goals', 'Check bills', 'Show transactions'],
    };
  }

  // Goals inquiry
  if (
    lowerMessage.includes('goal') ||
    lowerMessage.includes('save') ||
    lowerMessage.includes('saving')
  ) {
    const goals = await db('goals').where({ user_id: userId, status: 'active' });

    if (goals.length === 0) {
      return {
        content: "You don't have any active savings goals yet! Setting goals is a great way to build financial discipline.\n\nTry creating a goal in the Goals tab - start small, like saving for a new gadget or an emergency fund.",
        suggestions: ['Create a goal', 'Check my balance', 'View side hustles'],
      };
    }

    let response = `You have ${goals.length} active goal${goals.length > 1 ? 's' : ''}:\n\n`;
    let totalSaved = 0;
    let totalTarget = 0;

    for (const g of goals) {
      const current = parseFloat(g.current_amount);
      const target = parseFloat(g.target_amount);
      const progress = ((current / target) * 100).toFixed(0);
      totalSaved += current;
      totalTarget += target;

      const progressBar = getProgressBar(parseInt(progress));
      response += `${g.name}\n${progressBar} ${progress}%\n$${current.toFixed(2)} / $${target.toFixed(2)}\n\n`;
    }

    response += `Total saved: $${totalSaved.toFixed(2)} of $${totalTarget.toFixed(2)}`;

    return {
      content: response,
      suggestions: ['Fund a goal', 'Show my spending', 'Check balance'],
    };
  }

  // Transaction inquiry
  if (
    lowerMessage.includes('transaction') ||
    lowerMessage.includes('history') ||
    lowerMessage.includes('recent') ||
    lowerMessage.includes('purchase') ||
    lowerMessage.includes('bought')
  ) {
    const recentTxns = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('accounts.user_id', userId)
      .orderBy('transactions.created_at', 'desc')
      .limit(5)
      .select('transactions.*');

    if (recentTxns.length === 0) {
      return {
        content: 'No recent transactions found. Your transaction history will appear here as you use your account.',
        suggestions: ['Check balance', 'Make a deposit', 'View ExtraCash'],
      };
    }

    let response = 'Here are your most recent transactions:\n\n';
    for (const t of recentTxns) {
      const sign = t.type === 'credit' ? '+' : '-';
      const date = new Date(t.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      response += `${sign}$${parseFloat(t.amount).toFixed(2)} - ${t.description} (${date})\n`;
    }

    return {
      content: response,
      suggestions: ['Show spending summary', 'Check balance', 'View bills'],
    };
  }

  // Bills inquiry
  if (
    lowerMessage.includes('bill') ||
    lowerMessage.includes('payment') ||
    lowerMessage.includes('subscription') ||
    lowerMessage.includes('due')
  ) {
    try {
      const bills = await db('bills').where({ user_id: userId, status: 'active' });

      if (bills.length === 0) {
        return {
          content: "You don't have any bills set up yet. You can add bills in the Bill Pay section to track your recurring payments and never miss a due date!",
          suggestions: ['Add a bill', 'Check balance', 'View spending'],
        };
      }

      const totalMonthly = bills.reduce((sum, b) => sum + parseFloat(b.amount), 0);
      let response = `You have ${bills.length} active bill${bills.length > 1 ? 's' : ''}:\n\n`;

      for (const bill of bills) {
        const dueInfo = bill.next_due_date
          ? `Due ${new Date(bill.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : '';
        response += `- ${bill.name}: $${parseFloat(bill.amount).toFixed(2)} ${dueInfo}\n`;
      }

      response += `\nMonthly total: $${totalMonthly.toFixed(2)}`;

      return {
        content: response,
        suggestions: ['Pay a bill', 'Check balance', 'View spending'],
      };
    } catch {
      return {
        content: "Bill Pay is a new feature! You can set up and track your recurring bills. Head to the Bill Pay section in the More tab.",
        suggestions: ['Check balance', 'View spending', 'ExtraCash info'],
      };
    }
  }

  // Side hustle inquiry
  if (
    lowerMessage.includes('side hustle') ||
    lowerMessage.includes('job') ||
    lowerMessage.includes('earn') ||
    lowerMessage.includes('gig') ||
    lowerMessage.includes('extra income') ||
    lowerMessage.includes('freelance')
  ) {
    const hustles = await db('side_hustles')
      .where({ is_active: true })
      .limit(3);

    let response = "Looking to earn extra income? Here are some opportunities:\n\n";
    for (const h of hustles) {
      response += `- ${h.title} (${h.company}): ${h.pay_range}\n`;
    }
    response += "\nCheck out the Side Hustles section in the More tab for the full list with details and application links!";

    return {
      content: response,
      suggestions: ['Check balance', 'View ExtraCash', 'Set a goal'],
    };
  }

  // Transfer inquiry
  if (
    lowerMessage.includes('transfer') ||
    lowerMessage.includes('move money') ||
    lowerMessage.includes('send money')
  ) {
    return {
      content: "You can transfer money between your Cayden accounts instantly!\n\nFrom the Home screen:\n1. Tap the Transfer button\n2. Choose source and destination\n3. Enter the amount\n4. Confirm\n\nTransfers between your checking and savings are instant and free.",
      suggestions: ['Check balance', 'View transactions', 'ExtraCash info'],
    };
  }

  // PIN / Security inquiry
  if (
    lowerMessage.includes('pin') ||
    lowerMessage.includes('security') ||
    lowerMessage.includes('password') ||
    lowerMessage.includes('safe') ||
    lowerMessage.includes('protect')
  ) {
    return {
      content: "Your account security features:\n\n- PIN Lock: 4-digit PIN for app access\n- Auto-Logout: 5 min inactivity timeout\n- PIN Required: For ExtraCash over $100\n- AES-256 Encryption: For linked bank data\n- Rate Limiting: Protects against brute force\n\nManage settings in More > Security.",
      suggestions: ['Check balance', 'View notifications', 'Help'],
    };
  }

  // Card inquiry
  if (
    lowerMessage.includes('card') ||
    lowerMessage.includes('debit') ||
    lowerMessage.includes('virtual card') ||
    lowerMessage.includes('freeze')
  ) {
    return {
      content: "Your Cayden virtual debit card lets you make online purchases and ATM withdrawals.\n\nFeatures:\n- Show/hide card number\n- Freeze/unfreeze instantly\n- $5,000 daily spending limit\n- $500 ATM withdrawal limit\n\nManage your card in More > Virtual Card.",
      suggestions: ['Check balance', 'View transactions', 'View spending'],
    };
  }

  // Thank you / positive
  if (
    lowerMessage.includes('thank') ||
    lowerMessage.includes('thanks') ||
    lowerMessage.includes('awesome') ||
    lowerMessage.includes('great')
  ) {
    const user = await db('users').where({ id: userId }).first();
    return {
      content: `You're welcome, ${user?.first_name || 'friend'}! I'm always here to help with your finances. Is there anything else you'd like to know?`,
      suggestions: ['Check balance', 'Show spending', 'View goals'],
    };
  }

  // Help
  if (
    lowerMessage.includes('help') ||
    lowerMessage.includes('what can you') ||
    lowerMessage.includes('feature') ||
    lowerMessage === 'menu'
  ) {
    return {
      content: "I'm Cayden AI, your personal financial assistant! Here's what I can help with:\n\n- Check your account balance\n- Analyze your spending habits\n- Track your savings goals\n- Learn about ExtraCash advances\n- View recent transactions\n- Manage bills and payments\n- Find side hustle opportunities\n- Security & card info\n\nJust ask me anything about your finances!",
      suggestions: ['Check balance', 'Show spending', 'ExtraCash info', 'View goals'],
    };
  }

  // Greeting
  if (
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi') ||
    lowerMessage.includes('hey') ||
    lowerMessage.includes('sup') ||
    lowerMessage.includes('yo') ||
    lowerMessage.match(/^(good\s)?(morning|afternoon|evening)/)
  ) {
    const user = await db('users').where({ id: userId }).first();
    const hour = new Date().getHours();
    const greeting =
      hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return {
      content: `${greeting}, ${user?.first_name || 'there'}! I'm Cayden AI, your personal financial assistant. How can I help you today?`,
      suggestions: ['Check my balance', 'Show spending', 'ExtraCash info', 'What can you do?'],
    };
  }

  // Default response
  return {
    content: "I'm not sure I understand that, but I'm always learning! I can help you with your account balance, spending analysis, ExtraCash advances, savings goals, bills, and more.\n\nTry one of the suggestions below or ask me something specific!",
    suggestions: ['Check balance', 'Show spending', 'ExtraCash info', 'What can you do?'],
  };
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    food: '🍔',
    transport: '🚗',
    entertainment: '🎬',
    shopping: '🛍️',
    bills: '📄',
    health: '💊',
    education: '📚',
    other: '📦',
  };
  return emojis[category] || '📦';
}

function getProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

export async function getChatHistory(userId: string, limit: number = 50) {
  const messages = await db('chat_messages')
    .where({ user_id: userId })
    .orderBy('created_at', 'asc')
    .limit(limit);

  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.created_at,
  }));
}
