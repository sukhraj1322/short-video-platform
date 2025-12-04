import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Eye, Send, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Video, Comment } from '@/types';
import { getAllVideos, updateVideo, addLog, deleteVideo, deleteVideoBlob } from '@/utils/idb';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Watch() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  // Resolve local:// URLs from IndexedDB into a temporary object URL for playback
  useEffect(() => {
    let objectUrl: string | null = null;

    const resolveLocalUrl = async () => {
      if (!video) return;
      try {
        if (video.cloudinaryUrl?.startsWith('local://')) {
          const publicId = video.cloudinaryUrl.replace('local://', '');
          const { getVideoBlob } = await import('@/utils/idb');

          // Retry a few times in case the blob write is slightly delayed
          let blob: Blob | undefined;
          const maxAttempts = 3;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            blob = await getVideoBlob(publicId);
            if (blob) break;
            // small delay before retrying
            await new Promise(res => setTimeout(res, 250 * attempt));
          }

          if (blob) {
            objectUrl = URL.createObjectURL(blob);
            if (videoRef.current) {
              videoRef.current.src = objectUrl;
              // ensure video element updates
              try {
                await videoRef.current.load();
              } catch (e) {
                console.debug('Video load after resolving blob failed (non-fatal)', e);
              }
            }
            setVideoError(false);
          } else {
            // No blob found; show preview and provide guidance
            console.warn(`No local video blob found for ${publicId}`);
            setVideoError(true);
            // notify user once that this video is not available locally
            toast({ title: 'Video not available', description: 'This demo video blob is missing. Try re-uploading the video or use Cloudinary for persistent hosting.', variant: 'destructive' });
          }
        } else {
          // Non-local URL, ensure the video element uses it
          if (videoRef.current) videoRef.current.src = video.cloudinaryUrl;
        }
      } catch (e) {
        console.error('Failed to resolve local video blob:', e);
        setVideoError(true);
      }
    };

    resolveLocalUrl();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [video]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  const loadVideo = async () => {
    if (!videoId) return;

    try {
      const allVideos = await getAllVideos();
      const currentVideo = allVideos.find(v => v.id === videoId);
      
      if (currentVideo) {
        const updatedVideo = { ...currentVideo, views: currentVideo.views + 1 };
        await updateVideo(updatedVideo);
        await addLog({ type: 'view', message: `Watched video: ${currentVideo.caption}`, metadata: { videoId } });
        setVideo(updatedVideo);

        const related = allVideos
          .filter(v => v.id !== videoId)
          .slice(0, 6);
        setRelatedVideos(related);
      }
    } catch (error) {
      console.error('Error loading video:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const time = (value[0] / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(value[0]);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleLike = async () => {
    if (!video || !user) return;

    const updatedVideo = { ...video, likes: liked ? video.likes - 1 : video.likes + 1 };
    await updateVideo(updatedVideo);
    await addLog({ type: 'like', message: `${liked ? 'Unliked' : 'Liked'} video: ${video.caption}`, metadata: { videoId: video.id } });
    setVideo(updatedVideo);
    setLiked(!liked);
    
    if (!liked) {
      toast({ title: '❤️ Liked!', description: 'Added to your liked videos' });
    }
  };

  const handleComment = async () => {
    if (!video || !user || !comment.trim()) return;

    const newComment: Comment = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      text: comment.trim(),
      timestamp: Date.now(),
    };

    const updatedVideo = {
      ...video,
      comments: [...video.comments, newComment],
    };

    await updateVideo(updatedVideo);
    await addLog({ type: 'comment', message: `Commented on video: ${video.caption}`, metadata: { videoId: video.id } });
    setVideo(updatedVideo);
    setComment('');
    
    toast({
      title: '💬 Comment posted!',
      description: 'Your comment has been added',
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: '🔗 Link copied!', description: 'Video link copied to clipboard' });
  };

  const handleDelete = async () => {
    if (!video || !user) return;

    // Only the owner can delete their video in this demo
    if (user.id !== video.userId) {
      toast({ title: 'Permission denied', description: 'You can only delete your own videos', variant: 'destructive' });
      return;
    }

    const ok = window.confirm('Delete this video? This action cannot be undone.');
    if (!ok) return;

    try {
      // If the video is stored locally in demo mode, remove its blob as well
      if (video.cloudinaryUrl?.startsWith('local://')) {
        const publicId = video.cloudinaryUrl.replace('local://', '');
        try {
          await deleteVideoBlob(publicId);
        } catch (e) {
          console.warn('Failed to delete local video blob', e);
        }
      }

      await deleteVideo(video.id);
      await addLog({ type: 'delete', message: `Deleted video: ${video.caption}`, metadata: { videoId: video.id } });

      toast({ title: 'Video deleted', description: 'The video has been removed' });
      navigate('/feed');
    } catch (e) {
      console.error('Failed to delete video', e);
      toast({ title: 'Delete failed', description: 'Could not delete the video. Try again.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <div className="container mx-auto px-4 pt-24">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-video bg-muted animate-pulse rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen gradient-bg">
        <Navbar />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="container mx-auto px-4 pt-24 text-center"
        >
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-2xl font-bold mb-2">Video not found</p>
          <p className="text-muted-foreground mb-4">This video may have been removed</p>
          <Button onClick={() => navigate('/feed')} className="glow-primary">
            Back to Feed
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/feed')}
            className="mb-4 gap-2 hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur overflow-hidden group">
              <CardContent className="p-0 relative">
                {videoError ? (
                  <div className="aspect-video bg-black flex flex-col items-center justify-center">
                    <div className="text-6xl mb-4">🎥</div>
                    <p className="text-lg font-medium mb-2">Video Preview</p>
                    <p className="text-muted-foreground text-sm">Demo mode - Video stored locally</p>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={video.cloudinaryUrl}
                      className="w-full aspect-video bg-black cursor-pointer"
                      onTimeUpdate={handleTimeUpdate}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => setVideoError(true)}
                      onClick={togglePlay}
                      onMouseMove={() => setShowControls(true)}
                      playsInline
                    />
                    
                    {/* Custom Controls */}
                    <AnimatePresence>
                      {showControls && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
                          onMouseMove={() => setShowControls(true)}
                        >
                          {/* Center Play Button */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={togglePlay}
                              className="w-20 h-20 rounded-full bg-primary/80 backdrop-blur flex items-center justify-center"
                            >
                              {isPlaying ? (
                                <Pause className="h-10 w-10 text-primary-foreground" />
                              ) : (
                                <Play className="h-10 w-10 text-primary-foreground ml-1" />
                              )}
                            </motion.button>
                          </div>
                          
                          {/* Bottom Controls */}
                          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                            <Slider
                              value={[progress]}
                              onValueChange={handleSeek}
                              max={100}
                              step={0.1}
                              className="cursor-pointer"
                            />
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                </Button>
                              </div>
                              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
                                <Maximize className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Video Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6 space-y-4">
                  <h1 className="text-2xl font-bold">{video.caption}</h1>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground">@{video.username}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{new Date(video.uploadedAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {video.views} views
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant={liked ? 'default' : 'outline'}
                          size="sm"
                          onClick={handleLike}
                          className={`gap-2 ${liked ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                        >
                          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
                          {video.likes}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="destructive" size="sm" className="gap-2" onClick={handleDelete}>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </motion.div>
                    </div>
                  </div>

                  {video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {video.tags.map((tag, index) => (
                        <motion.span 
                          key={tag} 
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                          className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          #{tag}
                        </motion.span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Comments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    Comments ({video.comments.length})
                  </h2>

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                      className="bg-background/50"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={handleComment} disabled={!comment.trim()} className="gap-2">
                        <Send className="h-4 w-4" />
                        Post
                      </Button>
                    </motion.div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {video.comments.length === 0 ? (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center text-muted-foreground py-8"
                      >
                        No comments yet. Be the first to comment!
                      </motion.p>
                    ) : (
                      video.comments.map((c, index) => (
                        <motion.div 
                          key={c.id} 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex gap-3 p-3 rounded-lg hover:bg-muted/20 transition-colors"
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-sm font-bold text-white">
                            {c.username[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">@{c.username}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(c.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{c.text}</p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Related Videos */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-bold">Up Next</h2>
            {relatedVideos.length === 0 ? (
              <p className="text-muted-foreground text-sm">No more videos available</p>
            ) : (
              relatedVideos.map((v, index) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <Card
                    className="border-border/50 bg-card/50 backdrop-blur cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
                    onClick={() => navigate(`/watch/${v.id}`)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-3">
                        <div className="relative w-32 h-20 sm:w-40 sm:h-24 flex-shrink-0">
                          <img
                            src={v.thumbnailUrl}
                            alt={v.caption}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 py-2 pr-2">
                          <p className="text-sm font-medium line-clamp-2 mb-1">{v.caption}</p>
                          <p className="text-xs text-muted-foreground">@{v.username}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Eye className="h-3 w-3" /> {v.views} views
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
