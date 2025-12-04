import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Trash2, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Log } from '@/types';
import { getAllLogs, getDB } from '@/utils/idb';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const allLogs = await getAllLogs();
      setLogs(allLogs.reverse());
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(138, 43, 226);
    doc.text('ShortlyX Activity Logs', 20, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    
    // Logs
    doc.setFontSize(9);
    doc.setTextColor(0);
    
    let y = 45;
    logs.forEach((log, index) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      
      const date = new Date(log.timestamp).toLocaleString();
      const typeColor = getTypeColor(log.type);
      
      doc.setTextColor(...typeColor);
      doc.text(`[${log.type.toUpperCase()}]`, 20, y);
      
      doc.setTextColor(0);
      doc.text(`${date}`, 50, y);
      doc.text(log.message.substring(0, 80), 100, y);
      
      y += 8;
    });
    
    doc.save('shortlyx-logs.pdf');
    toast({ title: 'PDF Downloaded', description: 'Logs exported successfully!' });
  };

  const getTypeColor = (type: string): [number, number, number] => {
    switch (type) {
      case 'login': return [34, 197, 94];
      case 'logout': return [239, 68, 68];
      case 'signup': return [59, 130, 246];
      case 'upload': return [168, 85, 247];
      case 'like': return [236, 72, 153];
      case 'comment': return [251, 146, 60];
      case 'view': return [20, 184, 166];
      default: return [100, 100, 100];
    }
  };

  const clearLogs = async () => {
    try {
      const db = await getDB();
      await db.clear('logs');
      setLogs([]);
      toast({ title: 'Logs Cleared', description: 'All activity logs have been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clear logs', variant: 'destructive' });
    }
  };

  const getTypeColorClass = (type: string) => {
    switch (type) {
      case 'login': return 'bg-green-500/20 text-green-400';
      case 'logout': return 'bg-red-500/20 text-red-400';
      case 'signup': return 'bg-blue-500/20 text-blue-400';
      case 'upload': return 'bg-purple-500/20 text-purple-400';
      case 'like': return 'bg-pink-500/20 text-pink-400';
      case 'comment': return 'bg-orange-500/20 text-orange-400';
      case 'view': return 'bg-teal-500/20 text-teal-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

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
                <span className="text-gradient">Activity Logs</span>
              </h1>
              <p className="text-muted-foreground">{logs.length} total activities recorded</p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={loadLogs} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={downloadPDF} className="gap-2 glow-primary">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={clearLogs} variant="destructive" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No logs yet</h2>
            <p className="text-muted-foreground">Activity will appear here as you use the app</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="border-border/50 bg-card/50 backdrop-blur">
                  <CardContent className="p-4 flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColorClass(log.type)}`}>
                      {log.type}
                    </span>
                    <span className="text-sm flex-1">{log.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
