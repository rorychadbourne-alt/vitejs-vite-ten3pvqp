import { useState, useEffect } from 'react';
import { supabase } from './supabase.ts'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'


interface Session {
  user: {
    id: string;
    user_metadata: {
      name: string;
      email: string;
      avatar_url?: string;
    };
  };
}

interface GratitudeEntry {
  id: string;
  user_id: string;
  community_id: string;
  content: string;
  prompt_question: string;
  created_at: string;
  likes: number;
  user_name: string;
  user_email: string;
  liked_by_user: boolean;
  community_name: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  member_count: number;
  is_member: boolean;
  is_admin: boolean;
  current_streak: number;
  longest_streak: number;
  last_community_post_date: string | null;
  members_posted_today: string[];
  all_members_posted_today: boolean;
}

interface CommunityInvite {
  id: string;
  community_id: string;
  community_name: string;
  invited_by_name: string;
  invited_by_email: string;
  created_at: string;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_post_date: string | null;
}

const GRATITUDE_PROMPTS = [
  'What made you smile today?',
  'Who are you grateful for and why?',
  "What's something beautiful you noticed today?",
  'What challenge are you grateful to have overcome?',
  'What small moment brought you joy today?',
  'What skill or ability are you thankful to have?',
  "What's something in nature you're grateful for?",
  'Who showed you kindness recently?',
  "What's a memory that makes you feel grateful?",
  'What opportunity are you thankful for?',
];

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  // Get current session and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session as Session | null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session as Session | null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Show login form if no session
  if (!session) {
    return (
      <div style={{ maxWidth: 420, margin: '50px auto' }}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          socialLayout="horizontal"
        />
      </div>
    );
  }

  // Mock/demo state for logged-in user
  const [loading] = useState(false);
  const [gratitudeText, setGratitudeText] = useState('');
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [pendingInvites, setPendingInvites] = useState<CommunityInvite[]>([]);
  const [userStreak, setUserStreak] = useState<UserStreak>({
    current_streak: 0,
    longest_streak: 0,
    last_post_date: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [todaysPrompt, setTodaysPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'feed' | 'communities'>('feed');
  const [selectedCommunity, setSelectedCommunity] = useState<string>('all');
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCommunityId, setInviteCommunityId] = useState<string>('');

  // Form states
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityDescription, setNewCommunityDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    // Generate today's prompt based on date
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const promptIndex = dayOfYear % GRATITUDE_PROMPTS.length;
    setTodaysPrompt(GRATITUDE_PROMPTS[promptIndex]);

    if (session) {
      loadData();
    }
  }, [session]);

  const loadData = async () => {
    await Promise.all([
      loadCommunities(),
      loadEntries(),
      loadPendingInvites(),
      loadUserStreak(),
    ]);
  };

  const loadUserStreak = async () => {
    // Mock user streak data
    setUserStreak({
      current_streak: 5,
      longest_streak: 12,
      last_post_date: new Date(Date.now() - 86400000).toISOString(), // yesterday
    });
  };

  const loadCommunities = async () => {
    setSampleCommunities();
  };

  const setSampleCommunities = () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    const sampleCommunities: Community[] = [
      {
        id: '1',
        name: 'Family Circle',
        description: 'Share gratitude with family members',
        created_by: session?.user.id || '',
        created_at: new Date().toISOString(),
        member_count: 5,
        is_member: true,
        is_admin: true,
        current_streak: 8,
        longest_streak: 15,
        last_community_post_date: yesterday,
        members_posted_today: ['demo-user', 'user2'],
        all_members_posted_today: false,
      },
      {
        id: '2',
        name: 'Work Friends',
        description: 'Gratitude sharing with colleagues',
        created_by: 'other-user',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        member_count: 8,
        is_member: true,
        is_admin: false,
        current_streak: 12,
        longest_streak: 22,
        last_community_post_date: today,
        members_posted_today: [
          'demo-user',
          'user2',
          'user3',
          'user4',
          'user5',
          'user6',
          'user7',
          'user8',
        ],
        all_members_posted_today: true,
      },
      {
        id: '3',
        name: 'Mindfulness Group',
        description: 'Daily gratitude and mindfulness practice',
        created_by: 'another-user',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        member_count: 12,
        is_member: false,
        is_admin: false,
        current_streak: 3,
        longest_streak: 7,
        last_community_post_date: today,
        members_posted_today: ['user1', 'user2'],
        all_members_posted_today: false,
      },
    ];
    setCommunities(sampleCommunities);
  };

  const loadPendingInvites = async () => {
    const sampleInvites: CommunityInvite[] = [
      {
        id: '1',
        community_id: '4',
        community_name: 'Book Club Gratitude',
        invited_by_name: 'Sarah Johnson',
        invited_by_email: 'sarah@example.com',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ];
    setPendingInvites(sampleInvites);
  };

  const loadEntries = async () => {
    setSampleEntries();
  };

  const setSampleEntries = () => {
    const sampleEntries: GratitudeEntry[] = [
      {
        id: '1',
        user_id: session?.user.id || '',
        community_id: '1',
        content:
          "I'm grateful for the warm cup of coffee this morning and the peaceful sunrise I witnessed.",
        prompt_question: 'What made you smile today?',
        created_at: new Date().toISOString(),
        likes: 3,
        user_name: session?.user.user_metadata.name || 'You',
        user_email: session?.user.user_metadata.email || '',
        liked_by_user: false,
        community_name: 'Family Circle',
      },
      {
        id: '2',
        user_id: 'other-user',
        community_id: '2',
        content:
          'Grateful for my friend Sarah who listened to me vent about work today. True friendship is priceless.',
        prompt_question: 'Who are you grateful for and why?',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        likes: 5,
        user_name: 'Emma Johnson',
        user_email: 'emma@example.com',
        liked_by_user: true,
        community_name: 'Work Friends',
      },
    ];
    setEntries(sampleEntries);
  };

  const hasPostedToday = (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return entries.some(
      (entry) =>
        entry.user_id === userId && entry.created_at.split('T')[0] === today
    );
  };

  const hasUserPostedTodayToCommunity = (
    communityId: string,
    userId: string
  ) => {
    const today = new Date().toISOString().split('T')[0];
    return entries.some(
      (entry) =>
        entry.user_id === userId &&
        entry.community_id === communityId &&
        entry.created_at.split('T')[0] === today
    );
  };

  const updateStreaks = (communityId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    // Update user streak
    const newUserStreak = { ...userStreak };
    if (newUserStreak.last_post_date === yesterday) {
      // Continuing streak
      newUserStreak.current_streak += 1;
    } else if (newUserStreak.last_post_date === today) {
      // Already posted today, don't change streak
      return;
    } else {
      // Starting new streak
      newUserStreak.current_streak = 1;
    }

    if (newUserStreak.current_streak > newUserStreak.longest_streak) {
      newUserStreak.longest_streak = newUserStreak.current_streak;
    }
    newUserStreak.last_post_date = today;
    setUserStreak(newUserStreak);

    // Update community streaks
    setCommunities((prev) =>
      prev.map((community) => {
        if (community.id !== communityId) return community;

        const updatedMembersPostedToday = [...community.members_posted_today];
        if (!updatedMembersPostedToday.includes(session.user.id)) {
          updatedMembersPostedToday.push(session.user.id);
        }

        const allMembersPosted =
          updatedMembersPostedToday.length === community.member_count;
        let newCommunityStreak = community.current_streak;

        if (
          allMembersPosted &&
          community.last_community_post_date === yesterday
        ) {
          // Everyone posted and we're continuing the streak
          newCommunityStreak += 1;
        } else if (
          allMembersPosted &&
          community.last_community_post_date !== today
        ) {
          // Everyone posted but streak was broken, start new streak
          newCommunityStreak = 1;
        }

        const newLongestStreak =
          newCommunityStreak > community.longest_streak
            ? newCommunityStreak
            : community.longest_streak;

        return {
          ...community,
          members_posted_today: updatedMembersPostedToday,
          all_members_posted_today: allMembersPosted,
          current_streak: newCommunityStreak,
          longest_streak: newLongestStreak,
          last_community_post_date: allMembersPosted
            ? today
            : community.last_community_post_date,
        };
      })
    );
  };

  const submitGratitude = async () => {
    if (!gratitudeText.trim() || !session || selectedCommunity === 'all')
      return;

    setSubmitting(true);

    const newEntry: GratitudeEntry = {
      id: Date.now().toString(),
      user_id: session.user.id,
      community_id: selectedCommunity,
      content: gratitudeText.trim(),
      prompt_question: todaysPrompt,
      created_at: new Date().toISOString(),
      likes: 0,
      user_name: session.user.user_metadata.name,
      user_email: session.user.user_metadata.email,
      liked_by_user: false,
      community_name:
        communities.find((c) => c.id === selectedCommunity)?.name || 'Unknown',
    };

    setEntries((prev) => [newEntry, ...prev]);
    updateStreaks(selectedCommunity);
    setGratitudeText('');
    setSubmitting(false);
  };

  const createCommunity = async () => {
    if (!newCommunityName.trim() || !session) return;

    const newCommunity: Community = {
      id: Date.now().toString(),
      name: newCommunityName.trim(),
      description: newCommunityDescription.trim(),
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      member_count: 1,
      is_member: true,
      is_admin: true,
      current_streak: 0,
      longest_streak: 0,
      last_community_post_date: null,
      members_posted_today: [],
      all_members_posted_today: false,
    };

    setCommunities((prev) => [newCommunity, ...prev]);
    setNewCommunityName('');
    setNewCommunityDescription('');
    setShowCreateCommunity(false);
  };

  const inviteToCompletely = async () => {
    if (!inviteEmail.trim() || !inviteCommunityId) return;
    alert(`Invitation sent to ${inviteEmail}!`);
    setInviteEmail('');
    setShowInviteModal(false);
  };

  const joinCommunity = async (communityId: string) => {
    setCommunities((prev) =>
      prev.map((c) =>
        c.id === communityId
          ? { ...c, is_member: true, member_count: c.member_count + 1 }
          : c
      )
    );
  };

  const acceptInvite = async (
    inviteId: string,
    communityId: string,
    communityName: string
  ) => {
    setPendingInvites((prev) =>
      prev.filter((invite) => invite.id !== inviteId)
    );
    setCommunities((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === communityId);
      if (existingIndex >= 0) {
        return prev.map((c) =>
          c.id === communityId
            ? { ...c, is_member: true, member_count: c.member_count + 1 }
            : c
        );
      } else {
        const newCommunity: Community = {
          id: communityId,
          name: communityName,
          description: '',
          created_by: 'other-user',
          created_at: new Date().toISOString(),
          member_count: 1,
          is_member: true,
          is_admin: false,
          current_streak: 0,
          longest_streak: 0,
          last_community_post_date: null,
          members_posted_today: [],
          all_members_posted_today: false,
        };
        return [newCommunity, ...prev];
      }
    });
  };

  const declineInvite = async (inviteId: string) => {
    setPendingInvites((prev) =>
      prev.filter((invite) => invite.id !== inviteId)
    );
  };

  const toggleLike = async (entryId: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              likes: entry.liked_by_user ? entry.likes - 1 : entry.likes + 1,
              liked_by_user: !entry.liked_by_user,
            }
          : entry
      )
    );
  };

  const signOut = async () => {
    console.log('Signing out...');
  };

  const signInWithGoogle = async () => {
    console.log('Signing in...');
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>Loading...</div>;
  }

  if (!session) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🙏</div>
        <h1 style={{ fontSize: '32px', marginBottom: '16px', color: '#2d3748' }}>Gratitude Journal</h1>
        <p style={{ fontSize: '16px', color: '#718096', marginBottom: '32px' }}>Share gratitude with your trusted circles</p>
        <button 
          onClick={signInWithGoogle} 
          style={{
            background: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🔑 Sign in with Google
        </button>
      </div>
    );
  }

  const filteredEntries =
    selectedCommunity === 'all'
      ? entries.filter((entry) =>
          communities.some((c) => c.id === entry.community_id && c.is_member)
        )
      : entries.filter((entry) => entry.community_id === selectedCommunity);

  const userCommunities = communities.filter((c) => c.is_member);
  const userPostedToday = hasPostedToday(session.user.id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '✨';
    if (streak >= 3) return '🌟';
    return '💫';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🙏</span>
            <h1 className="text-gray-900 text-xl font-semibold m-0">
              Gratitude Journal
            </h1>
          </div>

          {/* Personal Streak Display */}
          <div className="flex items-center gap-6">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              userPostedToday 
                ? 'bg-green-50 border-green-300' 
                : 'bg-orange-50 border-orange-300'
            }`}>
              <span className="text-base">
                {getStreakEmoji(userStreak.current_streak)}
              </span>
              <div className="text-sm font-medium">
                <div className={userPostedToday ? 'text-green-700' : 'text-orange-700'}>
                  {userStreak.current_streak} day streak
                </div>
                <div className="text-xs text-gray-600">
                  Best: {userStreak.longest_streak} days
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {session.user.user_metadata.name}
                </div>
                <div className="text-xs text-gray-600">
                  {session.user.user_metadata.email}
                </div>
              </div>
              <button 
                onClick={signOut} 
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-4xl mx-auto px-5">
        <div className="flex border-b border-gray-200 mt-5">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-3 text-base font-medium cursor-pointer border-b-2 transition-colors ${
              activeTab === 'feed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 Gratitude Feed
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            className={`px-6 py-3 text-base font-medium cursor-pointer border-b-2 transition-colors relative ${
              activeTab === 'communities'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            👥 Communities
            {pendingInvites.length > 0 && (
              <span className="absolute -top-1 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                {pendingInvites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-8">
        {activeTab === 'feed' && (
          <>
            {/* Community Streaks Overview */}
            {userCommunities.length > 0 && (
              <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-200">
                <h3 className="text-gray-800 text-lg font-semibold mb-4 flex items-center gap-2">
                  🔥 Community Streaks
                </h3>
                <div className="space-y-3">
                  {userCommunities.map((community) => {
                    const userPostedToCommunity = hasUserPostedTodayToCommunity(
                      community.id,
                      session.user.id
                    );
                    return (
                      <div
                        key={community.id}
                        className={`flex justify-between items-center p-3 rounded-lg border ${
                          community.all_members_posted_today
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            {community.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {community.members_posted_today.length}/
                            {community.member_count} posted today
                            {!userPostedToCommunity && (
                              <span className="text-red-600 font-medium">
                                {' '}(you haven't posted)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-1 text-base font-semibold ${
                            community.all_members_posted_today
                              ? 'text-green-700'
                              : 'text-gray-800'
                          }`}>
                            <span>
                              {getStreakEmoji(community.current_streak)}
                            </span>
                            {community.current_streak} days
                          </div>
                          <div className="text-xs text-gray-500">
                            Best: {community.longest_streak}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Community Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by community:
              </label>
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white cursor-pointer min-w-48"
              >
                <option value="all">All My Communities</option>
                {userCommunities.map((community) => (
                  <option key={community.id} value={community.id}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Today's Prompt Card */}
            {userCommunities.length > 0 && (
              <div className="bg-white rounded-2xl p-8 mb-8 shadow-sm border border-gray-200">
                <div className="text-center mb-6">
                  <div className="text-3xl mb-4">✨</div>
                  <h2 className="text-gray-800 text-lg font-semibold mb-2">
                    Today's Gratitude Prompt
                  </h2>
                  <p className="text-gray-600 text-base leading-relaxed mb-2 italic">
                    "{todaysPrompt}"
                  </p>
                  {selectedCommunity !== 'all' ? (
                    <p className="text-gray-600 text-sm">
                      Sharing to:{' '}
                      <strong>
                        {
                          userCommunities.find(
                            (c) => c.id === selectedCommunity
                          )?.name
                        }
                      </strong>
                    </p>
                  ) : (
                    <p className="text-red-600 text-sm font-medium">
                      Select a community below to share your gratitude
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  {selectedCommunity === 'all' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose community to share to: *
                      </label>
                      <select
                        value={selectedCommunity}
                        onChange={(e) => setSelectedCommunity(e.target.value)}
                        className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg text-base bg-white cursor-pointer outline-none focus:border-blue-500"
                      >
                        <option value="all">Select a community...</option>
                        {userCommunities.map((community) => (
                          <option key={community.id} value={community.id}>
                            {community.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <textarea
                    value={gratitudeText}
                    onChange={(e) => setGratitudeText(e.target.value)}
                    placeholder="Share what you're grateful for..."
                    className="w-full min-h-32 p-4 border-2 border-gray-200 rounded-xl text-base resize-y outline-none bg-gray-50 focus:border-blue-500 transition-colors"
                  />
                </div>

                <button
                  onClick={submitGratitude}
                  disabled={
                    !gratitudeText.trim() ||
                    submitting ||
                    selectedCommunity === 'all'
                  }
                  className={`w-full py-4 px-8 text-base font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                    gratitudeText.trim() && selectedCommunity !== 'all'
                      ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin"></div>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <span>💝</span>
                      {selectedCommunity === 'all'
                        ? 'Select a community to share'
                        : 'Share Your Gratitude'}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* No communities state */}
            {userCommunities.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center mb-8 shadow-sm border border-gray-200">
                <div className="text-5xl mb-4">👥</div>
                <h2 className="text-gray-800 text-xl font-semibold mb-2">
                  No Communities Yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Create or join a community to start sharing gratitude!
                </p>
                <button
                  onClick={() => setActiveTab('communities')}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-blue-600 transition-colors"
                >
                  Manage Communities
                </button>
              </div>
            )}

            {/* Community Feed */}
            {filteredEntries.length > 0 && (
              <div>
                <h3 className="text-gray-800 text-xl font-semibold mb-5 flex items-center gap-2">
                  <span>🌟</span>
                  {selectedCommunity === 'all'
                    ? 'All Communities Feed'
                    : `${
                        userCommunities.find((c) => c.id === selectedCommunity)
                          ?.name
                      } Feed`}
                </h3>

                <div className="space-y-4">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-sm font-semibold text-gray-800 mb-1">
                            {entry.user_name}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatDate(entry.created_at)} at{' '}
                            {formatTime(entry.created_at)} •{' '}
                            {entry.community_name}
                          </div>
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-medium">
                          Daily Prompt
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 italic mb-3 p-3 bg-gray-50 rounded-lg border-l-3 border-blue-500">
                        "{entry.prompt_question}"
                      </div>

                      <p className="text-gray-800 text-base leading-relaxed mb-4">
                        {entry.content}
                      </p>

                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleLike(entry.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 ${
                            entry.liked_by_user ? 'text-red-500' : 'text-gray-600'
                          }`}
                        >
                          <span className="text-base">
                            {entry.liked_by_user ? '❤️' : '🤍'}
                          </span>
                          {entry.likes} {entry.likes === 1 ? 'heart' : 'hearts'}
                        </button>

                        {entry.user_id === session.user.id && (
                          <div className="text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded">
                            Your Entry
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No entries state */}
            {filteredEntries.length === 0 && userCommunities.length > 0 && (
              <div className="text-center py-12 text-gray-600">
                <div className="text-5xl mb-4">🌱</div>
                <p>
                  No gratitude entries yet in{' '}
                  {selectedCommunity === 'all'
                    ? 'your communities'
                    : userCommunities.find((c) => c.id === selectedCommunity)
                        ?.name}
                  . Be the first to share!
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'communities' && (
          <>
            {/* Pending Invites */}
            {pendingInvites.length > 0 && (
              <div className="mb-8">
                <h3 className="text-gray-800 text-xl font-semibold mb-5 flex items-center gap-2">
                  <span>📬</span>
                  Pending Invitations
                </h3>
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="bg-white rounded-xl p-5 shadow-sm border-2 border-yellow-300"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-base font-semibold text-gray-800 mb-1">
                            {invite.community_name}
                          </div>
                          <div className="text-sm text-gray-600 mb-2">
                            Invited by {invite.invited_by_name} (
                            {invite.invited_by_email})
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(invite.created_at)} at{' '}
                            {formatTime(invite.created_at)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              acceptInvite(
                                invite.id,
                                invite.community_id,
                                invite.community_name
                              )
                            }
                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineInvite(invite.id)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Communities */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-gray-800 text-xl font-semibold flex items-center gap-2">
                  <span>👥</span>
                  My Communities
                </h3>
                <button
                  onClick={() => setShowCreateCommunity(true)}
                  className="bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <span>➕</span>
                  Create Community
                </button>
              </div>

              <div className="space-y-4">
                {userCommunities.map((community) => {
                  const userPostedToCommunity = hasUserPostedTodayToCommunity(
                    community.id,
                    session.user.id
                  );
                  return (
                    <div
                      key={community.id}
                      className={`bg-white rounded-xl p-6 shadow-sm border-2 ${
                        community.all_members_posted_today
                          ? 'border-green-300'
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Streak Header */}
                      <div className={`flex justify-between items-center mb-4 p-3 rounded-lg border ${
                        community.all_members_posted_today
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div>
                          <div className={`flex items-center gap-2 text-lg font-semibold mb-1 ${
                            community.all_members_posted_today
                              ? 'text-green-700'
                              : 'text-gray-800'
                          }`}>
                            <span>
                              {getStreakEmoji(community.current_streak)}
                            </span>
                            {community.current_streak} Day Community Streak
                          </div>
                          <div className={`text-sm ${
                            community.all_members_posted_today
                              ? 'text-green-700'
                              : 'text-gray-600'
                          }`}>
                            {community.members_posted_today.length}/
                            {community.member_count} posted today
                            {community.all_members_posted_today &&
                              ' - Streak continues! 🎉'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-600">
                            Record: {community.longest_streak} days
                          </div>
                          {!userPostedToCommunity && (
                            <div className="text-xs text-red-600 font-medium mt-1">
                              You need to post!
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-gray-800 text-lg font-semibold mb-2">
                            {community.name}
                          </h4>
                          {community.description && (
                            <p className="text-gray-600 text-sm mb-3">
                              {community.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{community.member_count} members</span>
                            <span>
                              Created {formatDate(community.created_at)}
                            </span>
                            {community.is_admin && (
                              <span className="text-blue-600 font-medium">
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {community.is_admin && (
                            <button
                              onClick={() => {
                                setInviteCommunityId(community.id);
                                setShowInviteModal(true);
                              }}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 transition-colors"
                            >
                              Invite
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCommunity(community.id);
                              setActiveTab('feed');
                            }}
                            className="bg-green-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-600 transition-colors"
                          >
                            View Feed
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Discover Communities */}
            <div>
              <h3 className="text-gray-800 text-xl font-semibold mb-5 flex items-center gap-2">
                <span>🔍</span>
                Discover Communities
              </h3>

              <div className="space-y-4">
                {communities
                  .filter((c) => !c.is_member)
                  .map((community) => (
                    <div
                      key={community.id}
                      className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-gray-800 text-lg font-semibold mb-2">
                            {community.name}
                          </h4>
                          {community.description && (
                            <p className="text-gray-600 text-sm mb-3">
                              {community.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            <span>{community.member_count} members</span>
                            <span>
                              Created {formatDate(community.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <span>
                              {getStreakEmoji(community.current_streak)}
                            </span>
                            <span>
                              {community.current_streak} day streak (best:{' '}
                              {community.longest_streak})
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => joinCommunity(community.id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full max-h-screen overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800 text-xl font-semibold">
                Create New Community
              </h2>
              <button
                onClick={() => {
                  setShowCreateCommunity(false);
                  setNewCommunityName('');
                  setNewCommunityDescription('');
                }}
                className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Community Name *
              </label>
              <input
                type="text"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                placeholder="e.g., Family Circle, Work Friends, Book Club"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={newCommunityDescription}
                onChange={(e) => setNewCommunityDescription(e.target.value)}
                placeholder="Brief description of your community's purpose..."
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:border-blue-500 transition-colors resize-y"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateCommunity(false);
                  setNewCommunityName('');
                  setNewCommunityDescription('');
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createCommunity}
                disabled={!newCommunityName.trim()}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                  newCommunityName.trim() 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                Create Community
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800 text-xl font-semibold">
                Invite to Community
              </h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteCommunityId('');
                }}
                className="text-2xl text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="mb-2 text-sm text-gray-600">
              Inviting to:{' '}
              <strong>
                {communities.find((c) => c.id === inviteCommunityId)?.name}
              </strong>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-base outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteCommunityId('');
                }}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={inviteToCompletely}
                disabled={!inviteEmail.trim()}
                className={`px-6 py-3 rounded-lg text-base font-medium transition-colors ${
                  inviteEmail.trim() 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}