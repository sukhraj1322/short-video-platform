import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, Video as VideoIcon, X } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { uploadVideoToCloudinary, formatFileSize, formatDuration } from '@/utils/cloudinary';
import { saveVideo, addLog } from '@/utils/idb';
import { Video } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          title: 'Invalid file',
          description: 'Please select a video file',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      const url = URL.createObjectURL(droppedFile);
      setPreview(url);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    if (!caption.trim()) {
      toast({
        title: 'Caption required',
        description: 'Please add a caption for your video',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Upload to Cloudinary
      const cloudinaryResponse = await uploadVideoToCloudinary(file, setProgress);

      // Save video metadata to IndexedDB
      const video: Video = {
        id: crypto.randomUUID(),
        userId: user.id,
        username: user.username,
        cloudinaryUrl: cloudinaryResponse.secure_url,
        thumbnailUrl: cloudinaryResponse.thumbnail_url,
        caption: caption.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        duration: cloudinaryResponse.duration,
        resolution: `${cloudinaryResponse.width}x${cloudinaryResponse.height}`,
        likes: 0,
        comments: [],
        views: 0,
        uploadedAt: Date.now(),
      };

      await saveVideo(video);
      await addLog({
        type: 'upload',
        message: `Uploaded video: ${caption}`,
        metadata: { videoId: video.id, duration: video.duration },
      });

      toast({
        title: 'Upload successful!',
        description: 'Your video has been uploaded',
      });

      // Reset form
      setFile(null);
      setCaption('');
      setTags('');
      setPreview(null);
      setProgress(0);

      // Navigate to feed
      setTimeout(() => navigate('/feed'), 1000);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload video. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Upload Video</span>
          </h1>
          <p className="text-muted-foreground mb-8">Share your short-form content with the world</p>

          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
              <CardDescription>Add your video and provide details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              {!file ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <VideoIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Drop your video here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="outline" size="sm">
                    Select File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                    {preview && (
                      <video
                        src={preview}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* File Info */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{file.name}</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>

                  {/* Caption */}
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption *</Label>
                    <Textarea
                      id="caption"
                      placeholder="Write a catchy caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      maxLength={150}
                      rows={3}
                      className="bg-background/50"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {caption.length}/150
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., funny, dance, trending"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !caption.trim()}
                    className="w-full gap-2 glow-primary"
                  >
                    <UploadIcon className="h-4 w-4" />
                    {uploading ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
