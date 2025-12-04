import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IndianRupee, TrendingUp, Eye, Heart, Video as VideoIcon, Calculator, Sparkles, ArrowUpRight, Wallet } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from '@/types';
import { getAllVideos } from '@/utils/idb';
import { useAuth } from '@/context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis } from 'recharts';

// Revenue calculation rates (in INR - Rupees)
const RATES = {
  viewRate: 0.05, // ₹0.05 per view
  likeRate: 0.10, // ₹0.10 per like
  commentRate: 0.15, // ₹0.15 per comment
};

export default function Revenue() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allVideos = await getAllVideos();
      const userVideos = user ? allVideos.filter(v => v.userId === user.id) : allVideos;
      setVideos(userVideos);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate revenue per video
  const videoRevenue = videos.map(video => {
    const viewEarnings = video.views * RATES.viewRate;
    const likeEarnings = video.likes * RATES.likeRate;
    const commentEarnings = video.comments.length * RATES.commentRate;
    const total = viewEarnings + likeEarnings + commentEarnings;
    
    return {
      ...video,
      viewEarnings,
      likeEarnings,
      commentEarnings,
      totalEarnings: total,
    };
  });

  // Total earnings
  const totalViewEarnings = videoRevenue.reduce((sum, v) => sum + v.viewEarnings, 0);
  const totalLikeEarnings = videoRevenue.reduce((sum, v) => sum + v.likeEarnings, 0);
  const totalCommentEarnings = videoRevenue.reduce((sum, v) => sum + v.commentEarnings, 0);
  const totalEarnings = totalViewEarnings + totalLikeEarnings + totalCommentEarnings;

  // Pie chart data
  const earningsBreakdown = [
    { name: 'Views', value: totalViewEarnings, color: '#8B5CF6' },
    { name: 'Likes', value: totalLikeEarnings, color: '#EC4899' },
    { name: 'Comments', value: totalCommentEarnings, color: '#F97316' },
  ];

  // Monthly earnings simulation (last 6 months)
  const monthlyData = [
    { month: 'Jul', earnings: totalEarnings * 0.6 },
    { month: 'Aug', earnings: totalEarnings * 0.7 },
    { month: 'Sep', earnings: totalEarnings * 0.75 },
    { month: 'Oct', earnings: totalEarnings * 0.85 },
    { month: 'Nov', earnings: totalEarnings * 0.95 },
    { month: 'Dec', earnings: totalEarnings },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

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
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Revenue</span>
          </h1>
          <p className="text-muted-foreground">Track your earnings from videos</p>
        </motion.div>

        {/* Rate Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
        >
          <Card className="border-border/50 bg-gradient-to-r from-primary/10 via-pink-500/10 to-orange-500/10 backdrop-blur mb-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-center gap-2 mb-4">
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Calculator className="h-6 w-6 text-primary" />
                </motion.div>
                <span className="font-bold text-lg">Earning Rates</span>
                <Sparkles className="h-4 w-4 text-yellow-500 ml-2" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/20 border border-purple-500/30"
                >
                  <Eye className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Per View</p>
                    <p className="font-bold text-purple-400">₹{RATES.viewRate.toFixed(2)}</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-pink-500/20 border border-pink-500/30"
                >
                  <Heart className="h-5 w-5 text-pink-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Per Like</p>
                    <p className="font-bold text-pink-400">₹{RATES.likeRate.toFixed(2)}</p>
                  </div>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/20 border border-orange-500/30"
                >
                  <span className="text-xl">💬</span>
                  <div>
                    <p className="text-xs text-muted-foreground">Per Comment</p>
                    <p className="font-bold text-orange-400">₹{RATES.commentRate.toFixed(2)}</p>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.2, type: "spring" }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <Card className="border-primary/50 bg-gradient-to-br from-primary/30 via-primary/20 to-pink-500/20 backdrop-blur overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Wallet className="h-3 w-3" /> Total Earnings
                    </p>
                    <motion.p 
                      className="text-3xl font-bold text-primary"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={totalEarnings}
                    >
                      {formatCurrency(totalEarnings)}
                    </motion.p>
                    <p className="text-xs text-green-400 flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3" /> +12% this month
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <IndianRupee className="h-12 w-12 text-primary" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.3, type: "spring" }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/20 to-purple-500/5 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">From Views</p>
                    <p className="text-2xl font-bold text-purple-400">{formatCurrency(totalViewEarnings)}</p>
                  </div>
                  <motion.div whileHover={{ scale: 1.2 }}>
                    <Eye className="h-10 w-10 text-purple-500" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.4, type: "spring" }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/20 to-pink-500/5 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">From Likes</p>
                    <p className="text-2xl font-bold text-pink-400">{formatCurrency(totalLikeEarnings)}</p>
                  </div>
                  <motion.div 
                    whileHover={{ scale: 1.2 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Heart className="h-10 w-10 text-pink-500" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            transition={{ delay: 0.5, type: "spring" }}
            whileHover={{ scale: 1.05, y: -10 }}
          >
            <Card className="border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-500/5 backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">From Comments</p>
                    <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalCommentEarnings)}</p>
                  </div>
                  <motion.span 
                    className="text-4xl"
                    whileHover={{ scale: 1.2, rotate: 15 }}
                  >
                    💬
                  </motion.span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earnings Breakdown Pie Chart */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-primary" />
                  Earnings Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={earningsBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      >
                        {earningsBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Monthly Earnings Trend */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Monthly Earnings Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(value) => `₹${value}`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="#8B5CF6" 
                        fillOpacity={1} 
                        fill="url(#colorEarnings)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Video Earnings Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="h-5 w-5 text-primary" />
                Earnings by Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              {videoRevenue.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No videos uploaded yet. Upload videos to start earning!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4">Video</th>
                        <th className="text-right py-3 px-4">Views</th>
                        <th className="text-right py-3 px-4">Likes</th>
                        <th className="text-right py-3 px-4">Comments</th>
                        <th className="text-right py-3 px-4">Total Earnings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videoRevenue.map((video, index) => (
                        <motion.tr 
                          key={video.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.05 }}
                          className="border-b border-border/50 hover:bg-muted/20"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.caption}
                                className="w-12 h-16 object-cover rounded"
                              />
                              <span className="font-medium line-clamp-1">{video.caption}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            <div>
                              <span className="block">{video.views}</span>
                              <span className="text-xs text-muted-foreground">{formatCurrency(video.viewEarnings)}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            <div>
                              <span className="block">{video.likes}</span>
                              <span className="text-xs text-muted-foreground">{formatCurrency(video.likeEarnings)}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            <div>
                              <span className="block">{video.comments.length}</span>
                              <span className="text-xs text-muted-foreground">{formatCurrency(video.commentEarnings)}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-bold text-primary">
                            {formatCurrency(video.totalEarnings)}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
