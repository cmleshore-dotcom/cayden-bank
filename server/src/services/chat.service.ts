import db from '../config/database';

interface ChatResponse {
  role: 'assistant';
  content: string;
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

  // Generate AI response (rule-based for now)
  const response = await generateResponse(userId, message);

  // Save assistant response
  await db('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content: response,
  });

  return { role: 'assistant', content: response };
}

async function generateResponse(
  userId: string,
  message: string
): Promise<string> {
  const lowerMessage = message.toLowerCase();

  // Balance inquiry
  if (
    lowerMessage.includes('balance') ||
    lowerMessage.includes('how much') ||
    lowerMessage.includes('money')
  ) {
    const accounts = await db('accounts').where({ user_id: userId });
    const checking = accounts.find((a) => a.account_type === 'checking');
    const savings = accounts.find((a) => a.account_type === 'savings');

    let response = "Here's your account summary:\n\n";
    if (checking) {
      response += `Checking: $${parseFloat(checking.balance).toFixed(2)}\n`;
    }
    if (savings) {
      response += `Savings: $${parseFloat(savings.balance).toFixed(2)}\n`;
    }
    response +=
      '\nWould you like to know more about your spending or ExtraCash eligibility?';
    return response;
  }

  // ExtraCash / Advance inquiry
  if (
    lowerMessage.includes('extracash') ||
    lowerMessage.includes('advance') ||
    lowerMessage.includes('borrow') ||
    lowerMessage.includes('loan')
  ) {
    return "ExtraCash lets you get an advance of up to $500 with no interest! Your eligibility is based on your income consistency, account balance, spending patterns, and repayment history.\n\nTo check your eligibility, go to the ExtraCash tab in the app. If you qualify, you can choose standard (free, 1-3 days) or express (5% fee, instant) delivery.";
  }

  // Spending / Budget inquiry
  if (
    lowerMessage.includes('spending') ||
    lowerMessage.includes('budget') ||
    lowerMessage.includes('spend')
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

    const total = parseFloat(spending?.total || '0');
    return `This month, you've spent $${total.toFixed(2)} so far. Check the Budget tab for a full breakdown by category. I can also help you set up a savings goal to manage your spending better!`;
  }

  // Goals inquiry
  if (
    lowerMessage.includes('goal') ||
    lowerMessage.includes('save') ||
    lowerMessage.includes('saving')
  ) {
    const goals = await db('goals').where({ user_id: userId, status: 'active' });

    if (goals.length === 0) {
      return "You don't have any active savings goals yet. You can create one in the Goals tab! Setting a goal helps you save consistently - try starting with a small target and building up.";
    }

    let response = `You have ${goals.length} active goal(s):\n\n`;
    for (const g of goals) {
      const progress = (
        (parseFloat(g.current_amount) / parseFloat(g.target_amount)) *
        100
      ).toFixed(1);
      response += `- ${g.name}: $${parseFloat(g.current_amount).toFixed(2)} / $${parseFloat(g.target_amount).toFixed(2)} (${progress}%)\n`;
    }
    response += '\nKeep it up! Would you like to fund one of your goals?';
    return response;
  }

  // Transaction inquiry
  if (
    lowerMessage.includes('transaction') ||
    lowerMessage.includes('history') ||
    lowerMessage.includes('recent')
  ) {
    const recentTxns = await db('transactions')
      .join('accounts', 'transactions.account_id', 'accounts.id')
      .where('accounts.user_id', userId)
      .orderBy('transactions.created_at', 'desc')
      .limit(5)
      .select('transactions.*');

    if (recentTxns.length === 0) {
      return 'No recent transactions found. Your transaction history will appear here as you use your account.';
    }

    let response = 'Here are your 5 most recent transactions:\n\n';
    for (const t of recentTxns) {
      const sign = t.type === 'credit' ? '+' : '-';
      response += `${sign}$${parseFloat(t.amount).toFixed(2)} - ${t.description}\n`;
    }
    return response;
  }

  // Side hustle inquiry
  if (
    lowerMessage.includes('side hustle') ||
    lowerMessage.includes('job') ||
    lowerMessage.includes('earn') ||
    lowerMessage.includes('gig')
  ) {
    return "Looking to earn extra income? Check out our Side Hustles board in the More tab! We have opportunities for gig work, freelancing, remote jobs, and seasonal positions. From food delivery to tutoring, there's something for everyone.";
  }

  // Help
  if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
    return "I'm Cayden AI, your financial assistant! Here's what I can help with:\n\n- Check your account balance\n- Review your spending habits\n- Learn about ExtraCash advances\n- Track your savings goals\n- View recent transactions\n- Find side hustle opportunities\n\nJust ask me anything about your finances!";
  }

  // Greeting
  if (
    lowerMessage.includes('hello') ||
    lowerMessage.includes('hi') ||
    lowerMessage.includes('hey')
  ) {
    const user = await db('users').where({ id: userId }).first();
    return `Hey ${user?.first_name || 'there'}! I'm Cayden AI, your personal financial assistant. How can I help you today?`;
  }

  // Default response
  return "I'm not sure I understand that. I can help you with your account balance, spending analysis, ExtraCash advances, savings goals, and more. Try asking me about one of those topics!";
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
