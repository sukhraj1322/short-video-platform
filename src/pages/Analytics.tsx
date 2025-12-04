import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Play, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Video, Log } from '@/types';
import { getAllVideos, getAllLogs } from '@/utils/idb';
import { useAuth } from '@/context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';

export default function Analytics() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [liveReach, setLiveReach] = useState(false);
  const [reachData, setReachData] = useState<{ time: string; reach: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (liveReach) {
      const interval = setInterval(() => {
        setReachData(prev => {
          const newData = [...prev];
          if (newData.length > 10) newData.shift();
          newData.push({
            time: new Date().toLocaleTimeString(),
            reach: Math.floor(Math.random() * 500) + 100
          });
          return newData;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [liveReach]);

  const loadData = async () => {
    try {
      const allVideos = await getAllVideos();
      const userVideos = user ? allVideos.filter(v => v.userId === user.id) : allVideos;
      setVideos(userVideos);
      
      const allLogs = await getAllLogs();
      setLogs(allLogs);
      
      // Initialize reach data
      setReachData([
        { time: '00:00', reach: 120 },
        { time: '04:00', reach: 80 },
        { time: '08:00', reach: 250 },
        { time: '12:00', reach: 420 },
        { time: '16:00', reach: 380 },
        { time: '20:00', reach: 520 },
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const totalLikes = videos.reduce((sum, v) => sum + v.likes, 0);
  const totalComments = videos.reduce((sum, v) => sum + v.comments.length, 0);

  // Engagement pie chart data
  const engagementData = [
    { name: 'Views', value: totalViews, color: '#8B5CF6' },
    { name: 'Likes', value: totalLikes, color: '#EC4899' },
    { name: 'Comments', value: totalComments, color: '#F97316' },
  ];

  // Activity distribution
  const activityData = [
    { name: 'Login', count: logs.filter(l => l.type === 'login').length, color: '#22C55E' },
    { name: 'Upload', count: logs.filter(l => l.type === 'upload').length, color: '#A855F7' },
    { name: 'Like', count: logs.filter(l => l.type === 'like').length, color: '#EC4899' },
    { name: 'Comment', count: logs.filter(l => l.type === 'comment').length, color: '#F97316' },
    { name: 'Search', count: logs.filter(l => l.type === 'search').length, color: '#3B82F6' },
  ];

  // Video performance data
  const videoPerformanceData = videos.slice(0, 5).map(v => ({
    name: v.caption.substring(0, 15) + '...',
    views: v.views,
    likes: v.likes,
    comments: v.comments.length,
  }));

  const COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#22C55E', '#3B82F6'];

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-gradient">Analytics</span>
              </h1>
              <p className="text-muted-foreground">Track your video performance</p>
            </div>
            <Button onClick={loadData} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.1, type: "spring" }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="border-primary/30 bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition-colors"></div>
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Videos</p>
                    <motion.p 
                      className="text-2xl sm:text-3xl font-bold"
                      key={videos.length}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      {videos.length}
                    </motion.p>
                  </div>
                  <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
                    <Play className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.2, type: "spring" }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-500/5 backdrop-blur">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Views</p>
                    <p className="text-2xl sm:text-3xl font-bold text-purple-400">{totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.3, type: "spring" }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-pink-500/5 backdrop-blur">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Likes</p>
                    <p className="text-2xl sm:text-3xl font-bold text-pink-400">{totalLikes.toLocaleString()}</p>
                  </div>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.4, type: "spring" }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-500/5 backdrop-blur">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Comments</p>
                    <p className="text-2xl sm:text-3xl font-bold text-orange-400">{totalComments.toLocaleString()}</p>
                  </div>
                  <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Pie Chart */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Engagement Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={engagementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {engagementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Distribution */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Activity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]}>
                        {activityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Live Reach Toggle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.7 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur mb-8 overflow-hidden relative">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-pink-500 to-orange-500 ${liveReach ? 'animate-pulse' : ''}`}></div>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <motion.div animate={liveReach ? { rotate: 360 } : {}} transition={{ duration: 2, repeat: liveReach ? Infinity : 0, ease: "linear" }}>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </motion.div>
                  {liveReach ? 'Live Reach (Updating)' : 'Video Reach Over Time'}
                  {liveReach && (
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="ml-2 text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full"
                    >
                      LIVE
                    </motion.span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Live Mode</span>
                  <Switch checked={liveReach} onCheckedChange={setLiveReach} />
                  <AnimatePresence>
                    {liveReach && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 1.5, 1] }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-3 h-3 rounded-full bg-green-500"
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reachData}>
                    <XAxis dataKey="time" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="reach" 
                      stroke="#8B5CF6" 
                      strokeWidth={3}
                      dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#EC4899' }}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Video Performance */}
        {videoPerformanceData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Top Video Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={videoPerformanceData}>
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="views" fill="#8B5CF6" name="Views" />
                      <Bar dataKey="likes" fill="#EC4899" name="Likes" />
                      <Bar dataKey="comments" fill="#F97316" name="Comments" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
