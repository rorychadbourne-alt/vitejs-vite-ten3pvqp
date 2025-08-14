import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function App() {
  const [session, setSession] = useState<any>(null)

  // Get current session and listen for changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // Show login form if no session
  if (!session) {
    return (
      <div style={{ maxWidth: 420, margin: '50px auto' }}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']} // or [] for only email/password
          socialLayout="horizontal"
        />
      </div>
    )
  }

  // Show your main app once logged in
  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {session.user.email}!</h1>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{ padding: '8px 12px', background: '#ccc', border: 'none', cursor: 'pointer' }}
      >
        Sign Out
      </button>

      {/* Your real app content goes here */}
      <p>Here’s where your prompts, communities, etc. would load.</p>
    </div>
  )
}

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
  members_posted_today: string[]; // array of user IDs who posted today
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

function App() {
  // Mock session for demo
  const [session] = useState<Session>({
    user: {
      id: 'demo-user',
      user_metadata: {
        name: 'Demo User',
        email: 'demo@example.com',
      },
    },
  });

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
        members_posted_today: ['demo-user', 'user2'], // 2 out of 5 posted
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
        ], // all 8 posted!
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
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="login-container">
        <div style={{ fontSize: '48px', marginBottom: '24px' }}>🙏</div>
        <h1>Gratitude Journal</h1>
        <p>Share gratitude with your trusted circles</p>
        <button onClick={signInWithGoogle} className="google-btn">
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
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🙏</span>
            <h1
              style={{
                color: '#1a202c',
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
              }}
            >
              Gratitude Journal
            </h1>
          </div>

          {/* Personal Streak Display */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: userPostedToday ? '#f0fff4' : '#fef7f0',
                padding: '8px 12px',
                borderRadius: '8px',
                border: userPostedToday
                  ? '1px solid #9ae6b4'
                  : '1px solid #feb2a8',
              }}
            >
              <span style={{ fontSize: '16px' }}>
                {getStreakEmoji(userStreak.current_streak)}
              </span>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                <div style={{ color: userPostedToday ? '#2f855a' : '#c05621' }}>
                  {userStreak.current_streak} day streak
                </div>
                <div style={{ fontSize: '12px', color: '#718096' }}>
                  Best: {userStreak.longest_streak} days
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#2d3748',
                  }}
                >
                  {session.user.user_metadata.name}
                </div>
                <div style={{ fontSize: '12px', color: '#718096' }}>
                  {session.user.user_metadata.email}
                </div>
              </div>
              <button onClick={signOut} className="sign-out-btn">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            marginTop: '20px',
          }}
        >
          <button
            onClick={() => setActiveTab('feed')}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              borderBottom:
                activeTab === 'feed'
                  ? '2px solid #667eea'
                  : '2px solid transparent',
              color: activeTab === 'feed' ? '#667eea' : '#718096',
              transition: 'all 0.2s',
            }}
          >
            📝 Gratitude Feed
          </button>
          <button
            onClick={() => setActiveTab('communities')}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              borderBottom:
                activeTab === 'communities'
                  ? '2px solid #667eea'
                  : '2px solid transparent',
              color: activeTab === 'communities' ? '#667eea' : '#718096',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            👥 Communities
            {pendingInvites.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '8px',
                  background: '#e53e3e',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                }}
              >
                {pendingInvites.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main
        style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}
      >
        {activeTab === 'feed' && (
          <>
            {/* Community Streaks Overview */}
            {userCommunities.length > 0 && (
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '32px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h3
                  style={{
                    color: '#2d3748',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  🔥 Community Streaks
                </h3>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {userCommunities.map((community) => {
                    const userPostedToCommunity = hasUserPostedTodayToCommunity(
                      community.id,
                      session.user.id
                    );
                    return (
                      <div
                        key={community.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: community.all_members_posted_today
                            ? '#f0fff4'
                            : '#fafafa',
                          borderRadius: '8px',
                          border: community.all_members_posted_today
                            ? '1px solid #9ae6b4'
                            : '1px solid #e2e8f0',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: '500', color: '#2d3748' }}>
                            {community.name}
                          </div>
                          <div style={{ fontSize: '14px', color: '#718096' }}>
                            {community.members_posted_today.length}/
                            {community.member_count} posted today
                            {!userPostedToCommunity && (
                              <span
                                style={{ color: '#e53e3e', fontWeight: '500' }}
                              >
                                {' '}
                                (you haven't posted)
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '16px',
                              fontWeight: '600',
                              color: community.all_members_posted_today
                                ? '#2f855a'
                                : '#2d3748',
                            }}
                          >
                            <span>
                              {getStreakEmoji(community.current_streak)}
                            </span>
                            {community.current_streak} days
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
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
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Filter by community:
              </label>
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: 'white',
                  cursor: 'pointer',
                  minWidth: '200px',
                }}
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
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  marginBottom: '32px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>
                    ✨
                  </div>
                  <h2
                    style={{
                      color: '#2d3748',
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '8px',
                    }}
                  >
                    Today's Gratitude Prompt
                  </h2>
                  <p
                    style={{
                      color: '#4a5568',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      marginBottom: '8px',
                      fontStyle: 'italic',
                    }}
                  >
                    "{todaysPrompt}"
                  </p>
                  {selectedCommunity !== 'all' ? (
                    <p style={{ color: '#718096', fontSize: '14px' }}>
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
                    <p
                      style={{
                        color: '#e53e3e',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Select a community below to share your gratitude
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: '24px' }}>
                  {selectedCommunity === 'all' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '8px',
                        }}
                      >
                        Choose community to share to: *
                      </label>
                      <select
                        value={selectedCommunity}
                        onChange={(e) => setSelectedCommunity(e.target.value)}
                        style={{
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px',
                          background: 'white',
                          cursor: 'pointer',
                          width: '100%',
                          outline: 'none',
                        }}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = '#667eea')
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = '#e2e8f0')
                        }
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
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '16px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      backgroundColor: '#fafafa',
                    }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = '#667eea')
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = '#e2e8f0')
                    }
                  />
                </div>

                <button
                  onClick={submitGratitude}
                  disabled={
                    !gratitudeText.trim() ||
                    submitting ||
                    selectedCommunity === 'all'
                  }
                  style={{
                    background:
                      gratitudeText.trim() && selectedCommunity !== 'all'
                        ? '#48bb78'
                        : '#a0aec0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '14px 32px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor:
                      gratitudeText.trim() && selectedCommunity !== 'all'
                        ? 'pointer'
                        : 'not-allowed',
                    width: '100%',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {submitting ? (
                    <>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid transparent',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      ></div>
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

            {userCommunities.length === 0 && (
              <div
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '48px',
                  textAlign: 'center',
                  marginBottom: '32px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                <h2
                  style={{
                    color: '#2d3748',
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '8px',
                  }}
                >
                  No Communities Yet
                </h2>
                <p style={{ color: '#718096', marginBottom: '24px' }}>
                  Create or join a community to start sharing gratitude!
                </p>
                <button
                  onClick={() => setActiveTab('communities')}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}
                >
                  Manage Communities
                </button>
              </div>
            )}

            {/* Community Feed */}
            {filteredEntries.length > 0 && (
              <div>
                <h3
                  style={{
                    color: '#2d3748',
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>🌟</span>
                  {selectedCommunity === 'all'
                    ? 'All Communities Feed'
                    : `${
                        userCommunities.find((c) => c.id === selectedCommunity)
                          ?.name
                      } Feed`}
                </h3>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e2e8f0',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow =
                          '0 8px 16px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow =
                          '0 2px 4px rgba(0, 0, 0, 0.05)';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#2d3748',
                              marginBottom: '4px',
                            }}
                          >
                            {entry.user_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#718096' }}>
                            {formatDate(entry.created_at)} at{' '}
                            {formatTime(entry.created_at)} •{' '}
                            {entry.community_name}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#667eea',
                            backgroundColor: '#f0f4ff',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontWeight: '500',
                          }}
                        >
                          Daily Prompt
                        </div>
                      </div>

                      <div
                        style={{
                          fontSize: '13px',
                          color: '#718096',
                          fontStyle: 'italic',
                          marginBottom: '12px',
                          padding: '8px 12px',
                          backgroundColor: '#f7fafc',
                          borderRadius: '8px',
                          borderLeft: '3px solid #667eea',
                        }}
                      >
                        "{entry.prompt_question}"
                      </div>

                      <p
                        style={{
                          color: '#2d3748',
                          fontSize: '16px',
                          lineHeight: '1.6',
                          marginBottom: '16px',
                        }}
                      >
                        {entry.content}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <button
                          onClick={() => toggleLike(entry.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            color: entry.liked_by_user ? '#e53e3e' : '#718096',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f7fafc';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                              'transparent';
                          }}
                        >
                          <span style={{ fontSize: '16px' }}>
                            {entry.liked_by_user ? '❤️' : '🤍'}
                          </span>
                          {entry.likes} {entry.likes === 1 ? 'heart' : 'hearts'}
                        </button>

                        {entry.user_id === session.user.id && (
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#48bb78',
                              fontWeight: '500',
                              backgroundColor: '#f0fff4',
                              padding: '4px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            Your Entry
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredEntries.length === 0 && userCommunities.length > 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: '#718096',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌱</div>
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
              <div style={{ marginBottom: '32px' }}>
                <h3
                  style={{
                    color: '#2d3748',
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>📬</span>
                  Pending Invitations
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        border: '2px solid #fbbf24',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#2d3748',
                              marginBottom: '4px',
                            }}
                          >
                            {invite.community_name}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#718096',
                              marginBottom: '8px',
                            }}
                          >
                            Invited by {invite.invited_by_name} (
                            {invite.invited_by_email})
                          </div>
                          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                            {formatDate(invite.created_at)} at{' '}
                            {formatTime(invite.created_at)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() =>
                              acceptInvite(
                                invite.id,
                                invite.community_id,
                                invite.community_name
                              )
                            }
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineInvite(invite.id)}
                            style={{
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px 16px',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                            }}
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

            {/* My Communities with Enhanced Streak Display */}
            <div style={{ marginBottom: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h3
                  style={{
                    color: '#2d3748',
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>👥</span>
                  My Communities
                </h3>
                <button
                  onClick={() => setShowCreateCommunity(true)}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span>➕</span>
                  Create Community
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {userCommunities.map((community) => {
                  const userPostedToCommunity = hasUserPostedTodayToCommunity(
                    community.id,
                    session.user.id
                  );
                  return (
                    <div
                      key={community.id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        border: community.all_members_posted_today
                          ? '2px solid #9ae6b4'
                          : '1px solid #e2e8f0',
                      }}
                    >
                      {/* Streak Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                          padding: '12px 16px',
                          background: community.all_members_posted_today
                            ? '#f0fff4'
                            : '#f8fafc',
                          borderRadius: '8px',
                          border: community.all_members_posted_today
                            ? '1px solid #9ae6b4'
                            : '1px solid #e2e8f0',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '18px',
                              fontWeight: '600',
                              color: community.all_members_posted_today
                                ? '#2f855a'
                                : '#2d3748',
                              marginBottom: '4px',
                            }}
                          >
                            <span>
                              {getStreakEmoji(community.current_streak)}
                            </span>
                            {community.current_streak} Day Community Streak
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: community.all_members_posted_today
                                ? '#2f855a'
                                : '#718096',
                            }}
                          >
                            {community.members_posted_today.length}/
                            {community.member_count} posted today
                            {community.all_members_posted_today &&
                              ' - Streak continues! 🎉'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: '#718096',
                            }}
                          >
                            Record: {community.longest_streak} days
                          </div>
                          {!userPostedToCommunity && (
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#e53e3e',
                                fontWeight: '500',
                                marginTop: '4px',
                              }}
                            >
                              You need to post!
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              color: '#2d3748',
                              fontSize: '18px',
                              fontWeight: '600',
                              margin: '0 0 8px 0',
                            }}
                          >
                            {community.name}
                          </h4>
                          {community.description && (
                            <p
                              style={{
                                color: '#718096',
                                fontSize: '14px',
                                margin: '0 0 12px 0',
                              }}
                            >
                              {community.description}
                            </p>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              fontSize: '12px',
                              color: '#9ca3af',
                            }}
                          >
                            <span>{community.member_count} members</span>
                            <span>
                              Created {formatDate(community.created_at)}
                            </span>
                            {community.is_admin && (
                              <span
                                style={{ color: '#667eea', fontWeight: '500' }}
                              >
                                Admin
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {community.is_admin && (
                            <button
                              onClick={() => {
                                setInviteCommunityId(community.id);
                                setShowInviteModal(true);
                              }}
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer',
                              }}
                            >
                              Invite
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCommunity(community.id);
                              setActiveTab('feed');
                            }}
                            style={{
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              fontSize: '12px',
                              fontWeight: '500',
                              cursor: 'pointer',
                            }}
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

            {/* Rest of communities tab content remains the same... */}
            {/* Discover Communities */}
            <div>
              <h3
                style={{
                  color: '#2d3748',
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span>🔍</span>
                Discover Communities
              </h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                {communities
                  .filter((c) => !c.is_member)
                  .map((community) => (
                    <div
                      key={community.id}
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              color: '#2d3748',
                              fontSize: '18px',
                              fontWeight: '600',
                              margin: '0 0 8px 0',
                            }}
                          >
                            {community.name}
                          </h4>
                          {community.description && (
                            <p
                              style={{
                                color: '#718096',
                                fontSize: '14px',
                                margin: '0 0 12px 0',
                              }}
                            >
                              {community.description}
                            </p>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              fontSize: '12px',
                              color: '#9ca3af',
                              marginBottom: '8px',
                            }}
                          >
                            <span>{community.member_count} members</span>
                            <span>
                              Created {formatDate(community.created_at)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '14px',
                              color: '#4a5568',
                            }}
                          >
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
                          style={{
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
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

      {/* Modals remain the same... */}
      {showCreateCommunity && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  color: '#2d3748',
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                }}
              >
                Create New Community
              </h2>
              <button
                onClick={() => {
                  setShowCreateCommunity(false);
                  setNewCommunityName('');
                  setNewCommunityDescription('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Community Name *
              </label>
              <input
                type="text"
                value={newCommunityName}
                onChange={(e) => setNewCommunityName(e.target.value)}
                placeholder="e.g., Family Circle, Work Friends, Book Club"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Description (Optional)
              </label>
              <textarea
                value={newCommunityDescription}
                onChange={(e) => setNewCommunityDescription(e.target.value)}
                placeholder="Brief description of your community's purpose..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowCreateCommunity(false);
                  setNewCommunityName('');
                  setNewCommunityDescription('');
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={createCommunity}
                disabled={!newCommunityName.trim()}
                style={{
                  background: newCommunityName.trim() ? '#667eea' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: newCommunityName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Create Community
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  color: '#2d3748',
                  fontSize: '20px',
                  fontWeight: '600',
                  margin: 0,
                }}
              >
                Invite to Community
              </h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteCommunityId('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginBottom: '8px',
                fontSize: '14px',
                color: '#718096',
              }}
            >
              Inviting to:{' '}
              <strong>
                {communities.find((c) => c.id === inviteCommunityId)?.name}
              </strong>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px',
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteCommunityId('');
                }}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={inviteToCompletely}
                disabled={!inviteEmail.trim()}
                style={{
                  background: inviteEmail.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
